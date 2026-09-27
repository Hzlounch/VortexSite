// Vercel serverless — Discord OAuth2 callback: exchange code, store session cookie
const TOKEN_URL = 'https://discord.com/api/oauth2/token';
const ME_URL = 'https://discord.com/api/v10/users/@me';
const MAX_AGE = 60 * 60 * 24 * 7;

function parseCookie(cookie) {
  const out = {};
  (cookie || '').split(';').forEach(part => {
    const idx = part.indexOf('=');
    if (idx > -1) out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  });
  return out;
}

module.exports = async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect('/support.html?login=failed');

  const clientId = process.env.DISCORD_CLIENT_ID || '';
  const clientSecret = process.env.DISCORD_CLIENT_SECRET || '';
  const base = process.env.SITE_URL || `https://${req.headers.host}`;
  const redirect = process.env.DISCORD_REDIRECT_URI || `${base}/api/discord-callback`;

  try {
    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirect
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.redirect('/support.html?login=failed');

    const me = await fetch(ME_URL, { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
    const user = await me.json();
    if (!user.id) return res.redirect('/support.html?login=failed');

    res.setHeader('Set-Cookie', `vortex_session=${encodeURIComponent(tokenData.access_token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}`);
    res.redirect(`/support.html?login=success&uid=${user.id}`);
  } catch (e) {
    res.redirect('/support.html?login=error');
  }
};