// Vercel serverless — Microsoft OAuth callback (server-side verification).
//
// Validates state (CSRF), exchanges the code with the PKCE verifier, walks
// the Xbox Live -> XSTS -> Minecraft chain, reads the verified profile, and
// completes the Discord link session via the bot (shared API secret).
// Every failure maps to a friendly error on the linking page — never a
// stack trace, never "undefined", never leaked secrets/tokens.
const crypto = require('crypto');

function parseCookie(cookie) {
  const out = {};
  (cookie || '').split(';').forEach(part => {
    const idx = part.indexOf('=');
    if (idx > -1) out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  });
  return out;
}
function fail(res, msg) {
  res.redirect('/link-minecraft.html?error=' + encodeURIComponent(msg));
}
function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

module.exports = async (req, res) => {
  const q = req.query || {};
  if (q.error) return fail(res, 'Microsoft sign-in was cancelled.');
  const code = q.code;
  const state = q.state;
  let jar = null;
  try { jar = JSON.parse(parseCookie(req.headers.cookie).vx_ms || 'null'); } catch (_) {}
  if (!code || !jar || jar.state !== state || !jar.verifier || Date.now() > jar.exp) {
    return fail(res, 'Expired or invalid login attempt. Please try again.');
  }
  // one-time: burn the cookie immediately
  res.setHeader('Set-Cookie', 'vx_ms=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure');

  const clientId = process.env.MS_CLIENT_ID || '';
  const clientSecret = process.env.MS_CLIENT_SECRET || '';
  const base = (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/$/, '');
  const redirect = `${base}/api/ms-callback`;
  const botBase = (process.env.BOT_API_URL || '').replace(/\/$/, '');
  const apiSecret = process.env.API_SECRET || '';
  if (!clientId || !clientSecret) return fail(res, 'Microsoft login is not configured yet.');
  if (!botBase || !apiSecret) return fail(res, 'Link backend is not configured yet.');

  try {
    // 1. code -> Microsoft access token (PKCE)
    const t = await fetch('https://login.live.com/oauth20_token.srf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId, client_secret: clientSecret, code,
        grant_type: 'authorization_code', redirect_uri: redirect,
        scope: 'XboxLive.signin offline_access', code_verifier: jar.verifier
      })
    });
    const tj = await t.json();
    if (!tj.access_token) return fail(res, 'Microsoft refused the login. Please try again.');
    const msToken = tj.access_token;

    // 2. Xbox Live
    const x = await fetch('https://user.auth.xboxlive.com/user/authenticate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: 'd=' + msToken }, RelyingParty: 'http://auth.xboxlive.com', TokenType: 'JWT' })
    });
    const xj = await x.json();
    if (!xj.Token) return fail(res, 'Xbox sign-in failed. Please try again.');
    let uhs = '';
    try { uhs = xj.DisplayClaims.xui[0].uhs; } catch (_) {}
    if (!uhs) return fail(res, 'Xbox sign-in failed. Please try again.');

    // 3. XSTS
    const s = await fetch('https://xsts.auth.xboxlive.com/xsts/authorize', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Properties: { SandboxId: 'RETAIL', UserTokens: [xj.Token] }, RelyingParty: 'rp://api.minecraftservices.com/', TokenType: 'JWT' })
    });
    const sj = await s.json();
    if (!sj.Token) {
      const xerr = sj.XErr || 0;
      if (xerr === 2148916233) return fail(res, 'No Xbox account here. Sign in with an account that owns Minecraft.');
      if (xerr === 2148916238) return fail(res, 'Child accounts need a parent to approve Xbox sign-in first.');
      return fail(res, 'Xbox authorization failed. Please try again.');
    }

    // 4. Minecraft token + verified profile
    const m = await fetch('https://api.minecraftservices.com/authentication/login_with_xbox', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityToken: 'XBL3.0 x=' + uhs + ';' + sj.Token })
    });
    const mj = await m.json();
    if (!mj.access_token) return fail(res, 'Minecraft login failed. Please try again.');
    const p = await fetch('https://api.minecraftservices.com/minecraft/profile', {
      headers: { Authorization: 'Bearer ' + mj.access_token }
    });
    if (p.status === 404) return fail(res, 'Minecraft account unavailable: this Microsoft account owns no Minecraft copy.');
    const prof = await p.json();
    if (!prof || !prof.id || !prof.name) return fail(res, 'Could not read the Minecraft profile.');

    // 5. complete the Discord link session (bot enforces duplicates)
    const done = await fetch(botBase + '/api/link/session/complete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: apiSecret, token: jar.session || '', mc: prof.name, uuid: prof.id })
    });
    const dj = await done.json().catch(() => ({}));
    if (!dj || !dj.ok) return fail(res, (dj && dj.error) || 'Linking failed on the backend.');
    res.redirect('/link-minecraft.html?done=1&mc=' + encodeURIComponent(prof.name));
  } catch (e) {
    return fail(res, 'Backend unavailable. Please try again in a minute.');
  }
};
