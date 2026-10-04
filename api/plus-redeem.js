// Vercel serverless — redeems a Vortex+ membership code into the
// signed-in user's Discord wallet (via bot). The bot verifies the code
// checksum and single-use state, then grants the entitlement server-side.
// This route only proves session ownership and forwards the bot's verdict
// verbatim — never invents status or success.
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
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed.' });
  const token = parseCookie(req.headers.cookie).vortex_session;
  if (!token) return res.status(401).json({ ok: false, message: 'Not signed in.' });

  try {
    const me = await fetch(ME_URL, { headers: { Authorization: `Bearer ${token}` } });
    if (me.status !== 200) return res.status(401).json({ ok: false, message: 'Session expired.' });
    const user = await me.json();

    const BOT_URL = process.env.BOT_API_URL || '';
    const SECRET = process.env.API_SECRET || '';
    if (!BOT_URL) return res.status(501).json({ ok: false, message: 'Activation service not configured yet.' });

    const headers = { 'Content-Type': 'application/json' };
    if (SECRET) headers['x-api-secret'] = SECRET;
    const body = (typeof req.body === 'string') ? JSON.parse(req.body || '{}') : (req.body || {});
    const code = String(body.code || '').trim();
    if (!code) return res.status(400).json({ ok: false, message: 'Enter a Vortex+ code.' });

    const r = await fetch(BOT_URL + '/api/plus/redeem', {
      method: 'POST', headers,
      body: JSON.stringify({ discordId: user.id, code }),
    });
    const d = await r.json().catch(() => ({}));
    return res.status(r.ok ? 200 : 400).json(d && typeof d === 'object' ? d : { ok: false, message: 'Activation failed.' });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
};
