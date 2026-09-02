// Vercel serverless — purchase a cosmetic for the signed-in user.
// Calls the Vortex bot's /api/credits/spend with the user's Discord ID and a shared secret.
const ME_URL = 'https://discord.com/api/v10/users/@me';
const CATALOG = {
  cape_quantum: 500, cape_void: 1500, cape_crimson: 750, cape_aurora: 1800,
  wings_phoenix: 2000, wings_dragon: 1500, wings_cyber: 1200, wings_angel: 1100,
  trail_flame: 300, trail_storm: 650, trail_snow: 250, trail_heart: 900,
  aura_plasma: 750, aura_ember: 600, aura_galaxy: 1600,
  emote_dab: 200, emote_salute: 200, emote_gg: 450
};

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
  if (!token) return res.status(401).json({ ok: false, message: 'Sign in with Discord to buy cosmetics.' });
  const body = (typeof req.body === 'string') ? JSON.parse(req.body || '{}') : (req.body || {});
  const itemId = String(body.itemId || '');
  const cost = CATALOG[itemId];
  if (!cost) return res.status(400).json({ ok: false, message: 'Unknown item.' });

  const BOT_URL = process.env.BOT_API_URL || '';
  const SECRET = process.env.API_SECRET || '';
  if (!BOT_URL || !SECRET) {
    return res.status(501).json({ ok: false, message: 'Purchase service not configured yet.' });
  }

  try {
    const me = await fetch(ME_URL, { headers: { Authorization: `Bearer ${token}` } });
    if (me.status !== 200) return res.status(401).json({ ok: false, message: 'Session expired.' });
    const user = await me.json();

    const r = await fetch(BOT_URL + '/api/credits/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discordId: user.id, itemId, cost, secret: SECRET })
    });
    const data = await r.json();
    return res.status(200).json({
      ok: !!data.ok,
      credits: data.credits,
      owned: data.owned,
      message: data.message || (data.ok ? 'Item unlocked.' : 'Purchase failed.')
    });
  } catch (e) {
    return res.status(502).json({ ok: false, message: 'Purchase service unreachable.' });
  }
};
