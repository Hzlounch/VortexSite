import fs from 'fs';
import path from 'path';

export const config = { runtime: 'nodejs' };

const FILE = path.join(process.cwd(), 'content', 'socials.json');
const VALID = ['youtube', 'tiktok', 'instagram', 'discord', 'github'];
const DAY = 1000 * 60 * 60 * 24;
const MAX_SITE_PER_CHANNEL = 200;

function read() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
  catch { return { channels: {} }; }
}

function write(data) {
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
}

function parseCookie(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed.' });
  }
  const body = (typeof req.body === 'string') ? JSON.parse(req.body || '{}') : (req.body || {});
  const platform = String(body.platform || '');
  if (!VALID.includes(platform)) return res.status(400).json({ ok: false, message: 'Unknown platform.' });

  const data = read();
  const ch = data.channels[platform];
  if (!ch) return res.status(404).json({ ok: false, message: 'Channel not found.' });

  // SSP cookie guards against repeat counting for the same visitor
  const sspRaw = parseCookie(req.headers.cookie).vortex_ss;
  let ssp = [];
  try { ssp = JSON.parse(sspRaw || '[]'); } catch {}
  const key = `follow:${platform}`;

  let action;
  if (ssp.includes(key)) {
    // Visitor is "un-following" from the site back — remove the vote
    ssp = ssp.filter(k => k !== key);
    if (ch.site > 0) ch.site -= 1;
    action = 'dec';
  } else {
    // Visitor follows — add a vote, cap for sanity
    if (ch.site < MAX_SITE_PER_CHANNEL) ch.site += 1;
    ssp.push(key);
    action = 'inc';
  }

  write(data);

  res.setHeader('Set-Cookie', `vortex_ss=${encodeURIComponent(JSON.stringify(ssp))}; Path=/; Max-Age=${DAY * 30}; HttpOnly; SameSite=Lax`);
  return res.status(200).json({
    ok: true,
    action,
    platform,
    total: ch.base + ch.site,
    base: ch.base,
    site: ch.site
  });
}
