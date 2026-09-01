// Vercel serverless — sign out (clear session cookie)
module.exports = (req, res) => {
  res.setHeader('Set-Cookie', 'vortex_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax');
  res.redirect('/support.html');
};