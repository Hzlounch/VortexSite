import fs from 'fs';
import path from 'path';

export const config = { runtime: 'nodejs' };

const FILE = path.join(process.cwd(), 'content', 'socials.json');

function read() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
  catch { return { channels: {} }; }
}

export default function handler(req, res) {
  const data = read();
  const counts = {};
  for (const [k, c] of Object.entries(data.channels || {})) {
    counts[k] = {
      handle: c.handle || '',
      url: c.url || '',
      base: c.base || 0,
      site: c.site || 0,
      total: (c.base || 0) + (c.site || 0)
    };
  }
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ ok: true, counts, updatedAt: data.updatedAt });
}
