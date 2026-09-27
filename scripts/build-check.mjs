// Vortex site build gate — runs on `npm run build` AND on Vercel.
// Fails the deploy on: broken/case-wrong asset paths, giant JS bundles,
// missing WebP backdrops, spaces in asset names, catalog/shim drift.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

// Case-sensitive existence check (Windows FS is case-insensitive).
function existsCaseSensitive(rel) {
  const abs = join(ROOT, rel);
  const parts = abs.split(/[\\/]/);
  let cur = parts[0] + (abs.startsWith('\\\\') ? '' : '');
  // drive-letter root handling for win32
  let start = 0;
  if (/^[A-Za-z]:$/.test(parts[0])) { cur = parts[0] + '\\'; start = 1; }
  for (let i = start; i < parts.length; i++) {
    if (!parts[i]) continue;
    let entries;
    try { entries = readdirSync(cur); } catch { return false; }
    if (!entries.includes(parts[i])) return false;
    cur = join(cur, parts[i]);
  }
  return true;
}

function refsFromHtml(file) {
  const s = readFileSync(join(ROOT, file), 'utf8');
  const out = [];
  for (const m of s.matchAll(/(?:src|href)="([^"#]+)"/g)) out.push(m[1]);
  for (const m of s.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const url = part.trim().split(/\s+/)[0];
      if (url) out.push(url);
    }
  }
  return out;
}
function refsFromCss(file) {
  const s = readFileSync(join(ROOT, file), 'utf8');
  const out = [];
  for (const m of s.matchAll(/url\('([^')]+)'\)/g)) out.push(m[1]);
  return out;
}
function refsFromJs(file) {
  const s = readFileSync(join(ROOT, file), 'utf8');
  const out = [];
  for (const m of s.matchAll(/(?:from|import)\s*['"](\.[^'"]+)['"]/g)) out.push(m[1]);
  for (const m of s.matchAll(/['"]((?:data|cosmetics|js)\/[^'"]+)['"]/g)) out.push(m[1]);
  return out;
}

const EXTERNAL = /^(https?:|data:|mailto:|tel:|#)/;
const htmlFiles = readdirSync(ROOT).filter(f => f.endsWith('.html'));
const checked = new Set();
function checkRef(from, ref) {
  if (!ref || EXTERNAL.test(ref)) return;
  const clean = ref.split('#')[0].split('?')[0];
  if (!clean || clean === 'x.webp') return; // @supports probe placeholder
  // extensionless refs are routes (e.g. api/discord-login), not files
  const last = clean.split('/').pop();
  if (!last.includes('.')) return;
  const base = dirname(from) === '.' ? '' : dirname(from) + '/';
  // fetch() inside js/ modules resolves against the page, not the module file
  const rel = ((from.startsWith('js/') && /^(data|cosmetics)\//.test(clean) ? '' : base) + clean).replace(/^\.\//, '');
  if (rel.startsWith('/') || rel.includes('..')) return; // off-site / api routes
  const key = rel;
  if (checked.has(key)) return;
  checked.add(key);
  if (!existsCaseSensitive(rel)) err(`${from}: missing (case-sensitive) -> ${rel}`);
}

// 1. every html/css/js reference resolves, case-sensitively
for (const f of htmlFiles) for (const r of refsFromHtml(f)) checkRef(f, r);
for (const r of refsFromCss('site.css')) checkRef('site.css', r);
const jsFiles = ['site.js', 'store.js', 'cosmetics-store.js', 'features.js', 'news.js',
  'updates.js', 'socials.js', 'tickets.js', 'site-content.js', 'vortex-credits.js',
  'vortex-experience.js', 'vortex-socials.js', 'js/catalog.js', 'js/store-page.js']
  .filter(f => existsSync(join(ROOT, f)));
for (const f of jsFiles) for (const r of refsFromJs(f)) checkRef(f, r);

// 2. single-file JS budgets (the "giant bundle" rule)
for (const f of jsFiles) {
  const kb = statSync(join(ROOT, f)).size / 1024;
  if (kb > 500) err(`${f} is ${kb.toFixed(0)}KB — split it (budget 500KB)`);
  else if (kb > 200) warn(`${f} is ${kb.toFixed(0)}KB — consider splitting (soft budget 200KB)`);
}

// 3. no spaces / non-ascii in shippable asset names (Linux + CDN safety)
for (const dir of ['cosmetics', 'data', 'js', 'api', 'downloads']) {
  const d = join(ROOT, dir);
  if (!existsSync(d)) continue;
  for (const f of readdirSync(d)) {
    if (/[\s\u00C0-\u024F]/.test(f)) err(`bad asset name (spaces/non-ascii): ${dir}/${f}`);
  }
}
for (const f of readdirSync(ROOT)) {
  if (/\.(png|webp|jpg|jpeg)$/i.test(f) && /[\s]/.test(f)) err(`bad asset name: ${f}`);
}

// 4. webp-only policy: no scene-*.png in the repo (originals live in
// ../VortexSite-originals/, never pushed). Every backdrop webp referenced
// from CSS must exist, plus its -960 content twin; single images stay small.
for (const f of readdirSync(ROOT).filter(f => /^scene-.*\.png$/.test(f))) {
  warn(`${f} should not be in the repo — webp-only policy (delete once no process holds it; original kept in ../VortexSite-originals/)`);
}
for (const f of readdirSync(ROOT).filter(f => /^scene-.*\.webp$/.test(f) && !/-960\.webp$/.test(f))) {
  const small = f.replace(/\.webp$/, '-960.webp');
  if (!existsSync(join(ROOT, small))) err(`missing content twin: ${small} (run npm run optimize-images)`);
  const kb = statSync(join(ROOT, f)).size / 1024;
  if (kb > 500) err(`${f} is ${kb.toFixed(0)}KB — re-run optimizer with smaller width/quality`);
  else if (kb > 250) warn(`${f} is ${kb.toFixed(0)}KB — heavy for a backdrop`);
}

// 5. catalog <-> shim consistency (data is truth, shim is generated)
try {
  const idx = JSON.parse(readFileSync(join(ROOT, 'data', 'cosmetics.json'), 'utf8'));
  let n = 0;
  for (const cat of idx.categories || []) {
    const d = JSON.parse(readFileSync(join(ROOT, 'data', 'cosmetics', cat + '.json'), 'utf8'));
    n += (d.items || []).length;
  }
  if (n !== idx.total) err(`data/cosmetics.json total=${idx.total} but category files sum=${n}`);
  const shimSrc = readFileSync(join(ROOT, 'cosmetics-store.js'), 'utf8');
  const m = shimSrc.match(/var COSMETICS_STORE = (\{.*\});\s*$/s);
  if (!m) err('cosmetics-store.js is not the generated shim (run npm run sync)');
  else {
    const shim = JSON.parse(m[1]);
    if ((shim.items || []).length !== idx.total) {
      err(`cosmetics-store.js has ${(shim.items || []).length} items but data says ${idx.total} (run npm run sync)`);
    }
  }
} catch (e) {
  err('catalog check failed: ' + e.message);
}

// 6. store-buy must not contain a hardcoded catalog (it reads data/*.json)
try {
  const sb = readFileSync(join(ROOT, 'api', 'store-buy.js'), 'utf8');
  if (/cape_quantum|wings_phoenix|trail_flame/.test(sb)) err('api/store-buy.js still has the stale hardcoded catalog');
} catch { warn('api/store-buy.js not found'); }

console.log(`build-check: ${errors.length} errors, ${warnings.length} warnings`);
for (const w of warnings) console.log('WARN: ' + w);
for (const e of errors) console.log('ERROR: ' + e);
process.exit(errors.length ? 1 : 0);
