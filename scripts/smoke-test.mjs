// Site smoke test (VORTEX+ & COINS store): serves the static root with
// node's own http server and asserts the premium-system shape.
// Run: node scripts/smoke-test.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.css': 'text/css', '.png': 'image/png',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };

const FILES = ['store.html', 'index.html', 'vortex-plus.html', 'link-minecraft.html',
  'js/store-page.js', 'js/vortex-plus.js', 'js/catalog.js',
  'data/cosmetics.json', 'data/cosmetics/capes.json', 'data/cosmetics/hats.json', 'data/cosmetics/pets.json',
  'cosmetics-store.js', 'api/credits-history.js', 'api/credits-redeem.js', 'api/plus-status.js', 'api/store-buy.js', 'api/credits-balance.js',
  'cosmetics/capes/vortex_signature_cape.png', 'cosmetics/hats/vortex_signature_hat.png',
  'cosmetics/hats/vortex_signature_hat.json', 'cosmetics/pets/vortexling.png',
  'cosmetics/pets/vortexling.json', 'cosmetics/pets/vortexling-anim.json',
  'scene-store.webp', 'vortex-logo.jpg', 'site.css', 'cosmetics/cs-coins.png', 'cosmetics/cs-vortex_plus.png'];

// Paths that MUST be gone: product catalog items, collection record,
// store-bound previews. (Client-bound textures/models intentionally stay.)
const GONE_404 = ['cosmetics/collections/link-account/collection.json',
  'cosmetics/collections/link-account/preview.webp',
  'cosmetics/capes/vortex_signature_cape_preview.webp',
  'cosmetics/hats/vortex_signature_hat_preview.webp',
  'cosmetics/pets/vortexling_preview.webp',
  'data/vortex-plus.json'];

const server = createServer(async (req, res) => {
  try {
    const rel = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^[/\\]+/, '');
    const data = await readFile(join(ROOT, rel));
    res.writeHead(200, { 'Content-Type': MIME[extname(rel)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('nope');
  }
});
await new Promise(r => server.listen(8901, '127.0.0.1', r));

let failed = 0;
async function mustFetch(f, minBytes) {
  const r = await fetch('http://127.0.0.1:8901/' + f);
  if (!r.ok) { console.error('FAIL', f, r.status); failed++; return null; }
  const b = await r.arrayBuffer();
  console.log('OK', f, b.byteLength);
  if (!b.byteLength || (minBytes && b.byteLength < minBytes)) {
    console.error('FAIL empty/tiny', f); failed++; return null;
  }
  return b;
}
try {
  for (const f of FILES) await mustFetch(f);
  for (const f of GONE_404) {
    const r = await fetch('http://127.0.0.1:8901/' + f);
    if (r.ok) { console.error('FAIL should be gone', f); failed++; }
    else console.log('OK gone', f);
  }
  // Empty catalog: total 0, every category file holds zero items.
  const cat = await (await fetch('http://127.0.0.1:8901/data/cosmetics.json')).json();
  if (!cat || cat.total !== 0) { console.error('FAIL catalog must be empty', JSON.stringify(cat)); failed++; }
  for (const c of ['capes', 'hats', 'pets']) {
    const d = await (await fetch('http://127.0.0.1:8901/data/cosmetics/' + c + '.json')).json();
    if (!d || !Array.isArray(d.items) || d.items.length !== 0) {
      console.error('FAIL category must be empty', c); failed++;
    }
  }
  // Store = Vortex+ + Coins only: no product UI, no fake success strings.
  const store = await (await fetch('http://127.0.0.1:8901/store.html')).text();
  for (const needle of ['js/store-page.js', 'VORTEX+', 'Vortex Coins', 'id="plusState"',
    'id="coinBig"', 'id="coinHistory"', 'data-coins']) {
    if (!store.includes(needle)) { console.error('FAIL store.html missing', needle); failed++; }
  }
  for (const banned of ['storeCatalog', 'data-view', 'data-buy', 'data-wish', 'catPills',
    'prod-letter', 'Purchase successful', 'purchase complete']) {
    if (store.includes(banned)) { console.error('FAIL store.html contains banned', banned); failed++; }
  }
  const page = await (await fetch('http://127.0.0.1:8901/js/store-page.js')).text();
  for (const needle of ['link-minecraft.html', '/api/credits-history', '/api/credits-redeem']) {
    if (!page.includes(needle)) { console.error('FAIL store-page.js missing', needle); failed++; }
  }
  for (const banned of ['prod-letter', 'charAt(0)', 'data-buy', 'loadCategory', 'Purchase successful']) {
    if (page.includes(banned)) { console.error('FAIL store-page.js contains banned', banned); failed++; }
  }
  // Plus page: live status, honest scope, coming-soon billing, no fake perks.
  const plus = await (await fetch('http://127.0.0.1:8901/vortex-plus.html')).text();
  for (const needle of ['js/vortex-plus.js', 'id="plusStatus"', 'COMING SOON', 'Coming soon']) {
    if (!plus.includes(needle)) { console.error('FAIL vortex-plus.html missing', needle); failed++; }
  }
  for (const banned of ['Monthly cape drops', 'Exclusive Capes', 'exclusive capes', 'plusConcepts',
    'Purchase successful', '$4.99', '$9.99', '$19.99']) {
    if (plus.includes(banned)) { console.error('FAIL vortex-plus.html contains banned', banned); failed++; }
  }
  // Entitlement module: server truth, no local persistence of status.
  const mod = await (await fetch('http://127.0.0.1:8901/js/vortex-plus.js')).text();
  for (const needle of ['fetchPlusStatus', 'user.entitlements.vortex_plus', 'statusPill']) {
    if (!mod.includes(needle)) { console.error('FAIL vortex-plus.js missing', needle); failed++; }
  }
  if (/localStorage\.setItem.*plus/i.test(mod) || /localStorage.*vortex_plus/i.test(mod)) {
    console.error('FAIL vortex-plus.js must never persist entitlement'); failed++;
  }
} catch (e) {
  console.error('FAIL', e.message);
  failed++;
} finally {
  server.close();
}
console.log(failed ? `smoke-test: ${failed} failures` : 'smoke-test: all green');
process.exitCode = failed ? 1 : 0;
