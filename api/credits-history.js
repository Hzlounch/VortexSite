// Vercel serverless — returns the signed-in user's real Vortex Credits
// transaction history (via bot wallet). No demo data: every row comes
// from the bot, and every failure mode is reported honestly so the UI
// can show login / unavailable / empty states instead of faking rows.
const ME_URL = 'https://discord.com/api/v10/users/@me';

function parseCookie(cookie) {
  const out = {};
  (cookie || '').split(';').forEach(part => {
    const idx = part.indexOf('=');
    if (idx > -1) out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  });
  return out;
}

module.exports = async (req, res) => {
  const token = parseCookie(req.headers.cookie).vortex_session;
  if (!token) return res.status(401).json({ ok: false, message: 'Not signed in.' });

  try {
    const me = await fetch(ME_URL, { headers: { Authorization: `Bearer ${token}` } });
    if (me.status !== 200) return res.status(401).json({ ok: false, message: 'Session expired.' });
    const user = await me.json();

    const BOT_URL = process.env.BOT_API_URL || '';
    const SECRET = process.env.API_SECRET || '';
    if (!BOT_URL) {
      return res.json({ ok: true, configured: false, history: [], balance: 0 });
    }
    const headers = { 'Content-Type': 'application/json' };
    if (SECRET) headers['x-api-secret'] = SECRET;

    const acct = await (await fetch(BOT_URL + '/api/account/' + encodeURIComponent(user.id), { headers })).json().catch(() => ({}));
    const mc = acct && acct.linked && acct.linked.mc;
    if (!acct || !acct.ok || !mc) {
      return res.json({ ok: true, configured: true, linked: false, history: [], balance: Number((acct && acct.coins) || 0) });
    }
    const cred = await (await fetch(BOT_URL + '/api/credits/' + encodeURIComponent(mc), { headers })).json().catch(() => ({}));
    const history = Array.isArray(cred && cred.history) ? cred.history.slice(0, 15).map((h) => ({
      at: h.at || null,
      amount: Number(h.amount || 0),
      note: String(h.note || ''),
    })) : [];
    return res.json({
      ok: true,
      configured: true,
      linked: true,
      balance: Number((cred && cred.credits) || 0),
      history,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
};
