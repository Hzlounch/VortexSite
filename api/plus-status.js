// Vercel serverless — centralized Vortex+ entitlement read for the site.
// Source of truth is ALWAYS the server (VortexBot wallet entitlements:
// user.entitlements.vortex_plus). States: active | standard | unavailable.
// Never persisted, never trusted from the browser. The launcher and the
// in-game client should consume this same shape (or the bot directly).
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
  if (!token) return res.json({ ok: true, state: 'signed-out', plus: false });

  try {
    const me = await fetch(ME_URL, { headers: { Authorization: `Bearer ${token}` } });
    if (me.status !== 200) return res.json({ ok: true, state: 'signed-out', plus: false });
    const user = await me.json();

    const BOT_URL = process.env.BOT_API_URL || '';
    const SECRET = process.env.API_SECRET || '';
    if (!BOT_URL) return res.json({ ok: true, configured: false, state: 'unknown', plus: false });
    const headers = { 'Content-Type': 'application/json' };
    if (SECRET) headers['x-api-secret'] = SECRET;

    const a = await (await fetch(BOT_URL + '/api/account/' + encodeURIComponent(user.id), { headers })).json().catch(() => ({}));
    if (!a || !a.ok) return res.json({ ok: true, configured: true, state: 'unavailable', plus: false });
    return res.json({
      ok: true,
      configured: true,
      state: a.vortexPlus ? 'active' : 'standard',
      plus: !!a.vortexPlus,
      mc: (a.linked && a.linked.mc) || null,
      coins: (typeof a.coins === 'number') ? a.coins : null,
      me: { id: user.id, username: user.username,
        avatar: user.avatar ? 'https://cdn.discordapp.com/avatars/' + user.id + '/' + user.avatar + '.png' : '',
        displayName: user.global_name || user.username },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
};
