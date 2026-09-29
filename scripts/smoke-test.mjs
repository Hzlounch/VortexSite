// Site smoke test: serves the static root with node's own http server,
// asserts key routes + catalog shape. Run: node scripts/smoke-test.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.css': 'text/css', '.png': 'image/png',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };

const FILES = ['store.html', 'index.html', 'features.html', 'link-minecraft.html', 'js/store-page.js', 'js/catalog.js',
  'data/cosmetics.json', 'data/cosmetics/wings.json', 'data/cosmetics/suits.json',
  'cosmetics/wings/galaxy_wings.webp', 'cosmetics/pets/mini_dragon.webp', 'cosmetics/auras/void_aura.webp',
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
  const cat = await (await fetch('http://127.0.0.1:8901/data/cosmetics.json')).json();
  if (cat.total !== 100) { console.error('FAIL catalog total', cat.total); failed++; }
  const wings = await (await fetch('http://127.0.0.1:8901/data/cosmetics/wings.json')).json();
  if ((wings.items || []).length !== 15) { console.error('FAIL wings count'); failed++; }
  const store = await (await fetch('http://127.0.0.1:8901/store.html')).text();
  for (const needle of ['js/store-page.js', 'vortex-logo.jpg']) {
    if (!store.includes(needle)) { console.error('FAIL store.html missing', needle); failed++; }
  }
  if (store.includes('cosmetics-store.js') || store.includes('src="store.js"')) {
    console.error('FAIL store.html still loads legacy bundle'); failed++;
  }
} catch (e) {
  console.error('FAIL', e.message);
  failed++;
} finally {
  server.close();
}
console.log(failed ? `smoke-test: ${failed} failures` : 'smoke-test: all green');
process.exitCode = failed ? 1 : 0;
