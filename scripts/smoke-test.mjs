// Site smoke test (LINK ACCOUNT COLLECTION): serves the static root with
// node's own http server, asserts key routes + exactly-1-collection shape.
// Run: node scripts/smoke-test.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.css': 'text/css', '.png': 'image/png',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };

const FILES = ['store.html', 'index.html', 'link-minecraft.html', 'js/store-page.js', 'js/catalog.js',
  'data/cosmetics.json', 'data/cosmetics/capes.json', 'data/cosmetics/hats.json', 'data/cosmetics/pets.json',
  'cosmetics-store.js', 'cosmetics/collections/link-account/collection.json',
  'cosmetics/capes/vortex_signature_cape_preview.webp', 'cosmetics/capes/vortex_signature_cape.png',
  'cosmetics/hats/vortex_signature_hat_preview.webp', 'cosmetics/hats/vortex_signature_hat.png',
  'cosmetics/hats/vortex_signature_hat.json', 'cosmetics/pets/vortexling_preview.webp',
  'cosmetics/pets/vortexling.png', 'cosmetics/pets/vortexling.json', 'cosmetics/pets/vortexling-anim.json',
  'cosmetics/collections/link-account/preview.webp',
  'scene-store.webp', 'vortex-logo.jpg', 'site.css', 'cosmetics/cs-coins.png'];

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
  // EXACTLY ONE collection with EXACTLY 3 items, all present in the catalog.
  const cat = await (await fetch('http://127.0.0.1:8901/data/cosmetics.json')).json();
  const cats = (cat.categories || []).sort().join(',');
  if (cats !== 'capes,hats,pets' || cat.total !== 3) {
    console.error('FAIL catalog shape', JSON.stringify(cat)); failed++;
  }
  const col = await (await fetch('http://127.0.0.1:8901/cosmetics/collections/link-account/collection.json')).json();
  const want = ['vortex-signature-cape', 'vortex-signature-hat', 'vortexling-pet'];
  if (!col || col.id !== 'link-account' || JSON.stringify(col.items) !== JSON.stringify(want)) {
    console.error('FAIL collection must be exactly the 3 items', JSON.stringify(col)); failed++;
  }
  for (const c of ['capes', 'hats', 'pets']) {
    const d = await (await fetch('http://127.0.0.1:8901/data/cosmetics/' + c + '.json')).json();
    if (!d.items || d.items.length !== 1) { console.error('FAIL cat must hold 1 item', c); failed++; continue; }
    const it = d.items[0];
    if (it.cat !== c || it.collection !== 'link-account') { console.error('FAIL item fields', it.id); failed++; }
    if (it.status !== 'functional' && it.status !== 'preview-only') { console.error('FAIL status', it.id); failed++; }
    for (const f of [it.img, it.texture]) {
      if (!f) { console.error('FAIL missing file field', it.id); failed++; continue; }
      await mustFetch(f, 100);
    }
    if (it.model) await mustFetch(it.model, 50);
  }
  const store = await (await fetch('http://127.0.0.1:8901/store.html')).text();
  for (const needle of ['js/store-page.js', 'vortex-logo.jpg', 'LINK ACCOUNT', 'link-minecraft.html',
    'cosmetics/capes/vortex_signature_cape_preview.webp', 'cosmetics/hats/vortex_signature_hat_preview.webp',
    'cosmetics/pets/vortexling_preview.webp', 'data-view="vortex-signature-hat"', 'data-view="vortexling-pet"']) {
    if (!store.includes(needle)) { console.error('FAIL store.html missing', needle); failed++; }
  }
  if (store.includes('cosmetics-store.js') || store.includes('src="store.js"')) {
    console.error('FAIL store.html still loads legacy bundle'); failed++;
  }
  for (const banned of ['prod-letter', 'detail-letter', 'data-pill="wings"', 'data-pill="suits"',
    'data-pill="auras"', 'data-pill="plus"', 'eclipse-cape', 'vortex-phantom']) {
    if (store.includes(banned)) { console.error('FAIL store.html contains banned', banned); failed++; }
  }
  const page = await (await fetch('http://127.0.0.1:8901/js/store-page.js')).text();
  for (const banned of ['prod-letter', 'charAt(0)', 'plusOnly', "'wings'", "'suits'", "'auras'"]) {
    if (page.includes(banned)) { console.error('FAIL store-page.js contains banned', banned); failed++; }
  }
} catch (e) {
  console.error('FAIL', e.message);
  failed++;
} finally {
  server.close();
}
console.log(failed ? `smoke-test: ${failed} failures` : 'smoke-test: all green');
process.exitCode = failed ? 1 : 0;
