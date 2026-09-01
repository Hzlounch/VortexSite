// Vercel serverless — return current signed-in Discord user (reads session cookie)
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
    if (me.status !== 200) {
      res.setHeader('Set-Cookie', 'vortex_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax');
      return res.status(401).json({ ok: false, message: 'Session expired.' });
    }
    const user = await me.json();
    return res.json({
      ok: true,
      id: user.id,
      username: user.username,
      displayName: user.global_name || user.username,
      avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : ''
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
};