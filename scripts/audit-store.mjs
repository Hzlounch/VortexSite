// Per-product store audit: [OK] / [ERROR] for every cosmetic.
// Checks: id, img path, file existence (case-sensitive), extension,
// category folder, rarity, price, metadata status. Never silent.
// Run: node scripts/audit-store.mjs
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RARITIES = new Set(['Common', 'Rare', 'Epic', 'Legendary', 'Mythic']);

function existsCaseSensitive(rel) {
  const parts = String(rel).split('/');
  let cur = ROOT;
  for (const p of parts) {
    if (!p || p === '.') continue;
    if (p === '..') return false;
    let entries;
    try { entries = readdirSync(cur); } catch { return false; }
    if (!entries.includes(p)) return false;
    cur = join(cur, p);
  }
  return true;
}

const idx = JSON.parse(readFileSync(join(ROOT, 'data', 'cosmetics.json'), 'utf8'));
let ok = 0, bad = 0;
for (const cat of idx.categories || []) {
  const d = JSON.parse(readFileSync(join(ROOT, 'data', 'cosmetics', cat + '.json'), 'utf8'));
  for (const it of d.items || []) {
    const problems = [];
    if (!it.id) problems.push('no id');
    if (!it.img) problems.push('no img field');
    else {
      if (!it.img.endsWith('.webp')) problems.push('not webp: ' + it.img);
      if (!existsCaseSensitive(it.img)) problems.push('MISSING: ' + it.img);
      const dir = 'cosmetics/' + it.img.split('/')[1];
      if (it.img.split('/')[1] !== it.cat) problems.push('img not in category folder');
      void dir;
    }
    if (!RARITIES.has(it.rarity)) problems.push('bad rarity: ' + it.rarity);
    if (!Number.isFinite(Number(it.price)) || Number(it.price) <= 0) problems.push('bad price');
    if (!it.cat) problems.push('no category');
    if (!it.name) problems.push('no name');
    if (it.status !== 'functional' && it.status !== 'preview-only') problems.push('bad status: ' + it.status);
    if (!it.texture) problems.push('no texture field');
    else if (!existsCaseSensitive(it.texture)) problems.push('MISSING texture: ' + it.texture);
    if (!it.collection) problems.push('no collection');
    if (problems.length) {
      bad++;
      console.log('[ERROR]', it.id || '?', '\n   ' + problems.join('; '));
    } else {
      ok++;
      console.log('[OK]', it.name + ' (' + it.id + ')');
    }
  }
}
// asset orphans: webp files no product references
const referenced = new Set();
for (const cat of idx.categories || []) {
  const d = JSON.parse(readFileSync(join(ROOT, 'data', 'cosmetics', cat + '.json'), 'utf8'));
  for (const it of d.items || []) if (it.img) referenced.add(it.img);
}
function walk(dir, base) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const rel = base + '/' + f;
    if (statSync(p).isDirectory()) walk(p, rel);
    else if (/\.webp$/.test(f) && !referenced.has(rel)) console.log('[ORPHAN]', rel);
  }
}
walk(join(ROOT, 'cosmetics'), 'cosmetics');
console.log(`audit-store: ${ok} OK, ${bad} errors`);
process.exit(bad ? 1 : 0);
