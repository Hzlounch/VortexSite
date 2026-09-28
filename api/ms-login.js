// Vercel serverless — Microsoft OAuth start (PKCE, server-side only).
//
// Only works when the owner configures MS_CLIENT_ID / MS_CLIENT_SECRET /
// SITE_URL / BOT_API_URL / API_SECRET in Vercel env. Without them it
// returns an honest "not configured" page — never a fake login.
// Secrets NEVER reach the browser. State+PKCE verifier are bound in an
// HttpOnly cookie (double-submit CSRF check in the callback).
const crypto = require('crypto');

const AUTH_URL = 'https://login.live.com/oauth20_authorize.srf';

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

module.exports = async (req, res) => {
  const clientId = process.env.MS_CLIENT_ID || '';
  const base = (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/$/, '');
  const redirect = `${base}/api/ms-callback`;
  const session = String((req.query && req.query.session) || '');
  if (!clientId) {
    res.statusCode = 501;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end('<h1>Microsoft login is not configured yet</h1><p>The owner needs to set MS_CLIENT_ID / MS_CLIENT_SECRET in Vercel env. You can still link with an in-game code instead.</p><p><a href="/link-minecraft.html">Back to linking</a></p>');
  }
  const state = b64url(crypto.randomBytes(24));
  const verifier = b64url(crypto.randomBytes(48));
  const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
  const payload = JSON.stringify({ state, verifier, session, exp: Date.now() + 10 * 60 * 1000 });
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirect,
    scope: 'XboxLive.signin offline_access',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256'
  });
  res.setHeader('Set-Cookie', `vx_ms=${encodeURIComponent(payload)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600; Secure`);
  res.redirect(AUTH_URL + '?' + params.toString());
};
