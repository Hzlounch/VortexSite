// Vercel serverless — purchase a cosmetic for the signed-in user.
// Calls the Vortex bot's /api/credits/spend with the user's Discord ID and a shared secret.
//
// Prices/ids come from the generated catalog (data/cosmetics.json, built by
// scripts/sync-catalog.mjs from data/cosmetics/capes.json) — never a hardcoded list,
// so ids here can never drift from what the Store sells and the game owns.
const fs = require('fs');
const path = require('path');
const ME_URL = 'https://discord.com/api/v10/users/@me';

let CATALOG = null;
function loadCatalog() {
  if (CATALOG) return CATALOG;
  CATALOG = { prices: {}, names: {} };
  try {
    // All active catalog categories (capes/hats/pets) — never hardcoded ids.
    const dir = path.join(__dirname, '..', 'data', 'cosmetics');
    const cats = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''));
    for (const c of cats) {
      const f = path.join(__dirname, '..', 'data', 'cosmetics', c + '.json');
      const d = JSON.parse(fs.readFileSync(f, 'utf8'));
      for (const it of (d.items || [])) {
        CATALOG.prices[it.id] = Number(it.price);
        CATALOG.names[it.id] = it.name || it.id;
      }
    }
  } catch (e) {
    CATALOG = null;
  }
  return CATALOG;
}

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
  const itemId = String(body.itemId || '').toLowerCase();
  const catalog = loadCatalog();
  if (!catalog) return res.status(501).json({ ok: false, message: 'Catalog not generated yet (sync-catalog).' });
  const cost = catalog.prices[itemId];
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
