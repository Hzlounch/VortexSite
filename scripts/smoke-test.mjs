// Site smoke test (CAPES-ONLY store): serves the static root with node's
// own http server, asserts key routes + capes catalog shape.
// Run: node scripts/smoke-test.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.css': 'text/css', '.png': 'image/png',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };

const FILES = ['store.html', 'index.html', 'features.html', 'vortex-plus.html', 'js/store-page.js', 'js/catalog.js',
  'data/cosmetics.json', 'data/cosmetics/capes.json', 'data/vortex-plus.json', 'cosmetics-store.js',
  'cosmetics/capes/eclipse_cape_preview.webp', 'cosmetics/capes/galaxy_rift_cape_preview.webp', 'cosmetics/capes/royal_obsidian_cape_preview.webp',
  'scene-store.webp', 'scene-cosmic.webp', 'scene-cosmic-960.webp', 'vortex-logo.jpg', 'site.css', 'cosmetics/cs-coins.png'];

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
try {
  for (const f of FILES) {
    const r = await fetch('http://127.0.0.1:8901/' + f);
    if (!r.ok) { console.error('FAIL', f, r.status); failed++; continue; }
    const b = await r.arrayBuffer();
    console.log('OK', f, b.byteLength);
    if (!b.byteLength) { console.error('FAIL empty', f); failed++; }
  }
  // CAPES ONLY gate: index lists exactly one category, every item is a cape
  // with a real image path (never id-derived, never a letter placeholder).
  const cat = await (await fetch('http://127.0.0.1:8901/data/cosmetics.json')).json();
  if (!cat.categories || cat.categories.length !== 1 || cat.categories[0] !== 'capes') {
    console.error('FAIL catalog not capes-only', JSON.stringify(cat.categories)); failed++;
  }
  const capes = await (await fetch('http://127.0.0.1:8901/data/cosmetics/capes.json')).json();
  if (!capes.items || capes.items.length < 10 || capes.items.length > 20) {
    console.error('FAIL capes count', capes.items && capes.items.length); failed++;
  }
  if (!capes.items.find(function (i) { return i.id === 'eclipse-cape'; })) { console.error('FAIL eclipse-cape missing'); failed++; }
  for (const it of capes.items || []) {
    if (it.cat !== 'capes') { console.error('FAIL non-cape in catalog', it.id); failed++; break; }
    if (!it.img || !String(it.img).startsWith('cosmetics/capes/') || !String(it.img).endsWith('.webp')) {
      console.error('FAIL bad img', it.id, it.img); failed++; break;
    }
    const r = await fetch('http://127.0.0.1:8901/' + it.img);
    if (!r.ok) { console.error('FAIL img 404', it.id, it.img); failed++; break; }
    const b = await r.arrayBuffer();
    if (!b.byteLength) { console.error('FAIL img empty', it.id); failed++; break; }
  }
  const store = await (await fetch('http://127.0.0.1:8901/store.html')).text();
  for (const needle of ['js/store-page.js', 'vortex-logo.jpg', 'VORTEX', 'cosmetics/capes/eclipse_cape_preview.webp']) {
    if (!store.includes(needle)) { console.error('FAIL store.html missing', needle); failed++; }
  }
  if (store.includes('cosmetics-store.js') || store.includes('src="store.js"')) {
    console.error('FAIL store.html still loads legacy bundle'); failed++;
  }
  for (const banned of ['prod-letter', 'detail-letter', 'data-pill="wings"', 'data-pill="suits"', 'data-pill="pets"', 'data-pill="auras"']) {
    if (store.includes(banned)) { console.error('FAIL store.html contains banned', banned); failed++; }
  }
  const page = await (await fetch('http://127.0.0.1:8901/js/store-page.js')).text();
  for (const banned of ['prod-letter', 'charAt(0)', "'wings'", "'suits'", "'pets'", "'auras'"]) {
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
