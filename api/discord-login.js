// Vercel serverless — Discord OAuth2 login redirect
module.exports = (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID || '';
  if (!clientId) return res.status(500).send('DISCORD_CLIENT_ID not configured.');
  const base = process.env.SITE_URL || `https://${req.headers.host}`;
  const redirect = process.env.DISCORD_REDIRECT_URI || `${base}/api/discord-callback`;
  const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=identify`;
  res.redirect(url);
};