// Vercel serverless — returns signed-in user's real Vortex Credits balance (via bot wallet).
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
    if (!BOT_URL || !SECRET) {
      // Fallback: report logged-in OR preloads edge for gates
      return res.json({ ok: true, credits: 0, owned: [], configured: false, user: { id: user.id, username: user.username } });
    }

    const r = await fetch(BOT_URL + '/api/wallet/' + encodeURIComponent(user.id), {
      headers: { 'Content-Type': 'application/json', 'x-api-secret': SECRET }
    });
    const data = await r.json().catch(() => ({}));
    return res.json({
      ok: true,
      configured: true,
      user: { id: user.id, username: user.username },
      credits: Number(data.credits || data.balance || 0),
      owned: data.owned || []
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
};
