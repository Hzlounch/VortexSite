// Vercel serverless — create a new support ticket
// Authenticates via session cookie (Discord OAuth), then posts a rich embed to the
// staff ticket webhook. The Discord bot captures the embed and stores the ticket.
const ME_URL = 'https://discord.com/api/v10/users/@me';

function parseCookie(cookie) {
  const out = {};
  (cookie || '').split(';').forEach(part => {
    const idx = part.indexOf('=');
    if (idx > -1) out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  });
  return out;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Use POST.' });

  const webhook = process.env.TICKET_WEBHOOK_URL || '';
  if (!webhook) return res.status(503).json({ ok: false, message: 'Support webhook not configured yet.' });

  const body = req.body || {};
  const subject = String(body.subject || '').trim();
  const category = String(body.category || 'General').trim() || 'General';
  const minecraft = String(body.minecraft || '').trim();
  const message = String(body.message || '').trim();
  if (!subject || !message) return res.status(400).json({ ok: false, message: 'Subject and message are required.' });

  let name = 'Guest';
  let discordId = '';
  let avatar = '';
  const token = parseCookie(req.headers.cookie).vortex_session;
  if (token) {
    try {
      const me = await fetch(ME_URL, { headers: { Authorization: `Bearer ${token}` } });
      const user = await me.json();
      if (user.id) {
        name = user.global_name || user.username;
        discordId = user.id;
        avatar = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : '';
      }
    } catch (_) {}
  }

  const ticketId = 'WT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase();
  const embed = {
    title: `🌐 Ticket Created — ${ticketId}`,
    color: 0x16b4ee,
    fields: [
      { name: 'Discord Username', value: name.slice(0, 80), inline: true },
      { name: 'Discord ID', value: discordId || 'none', inline: true },
      { name: 'Minecraft IGN', value: minecraft || 'None', inline: true },
      { name: 'Category', value: category.slice(0, 40), inline: true },
      { name: 'Subject', value: subject.slice(0, 200) },
      { name: 'Message', value: message.slice(0, 3000) }
    ],
    footer: { text: 'VORTEX WEBSITE TICKET SYSTEM • Staff response pending' },
    timestamp: new Date().toISOString()
  };
  if (avatar) embed.author = { name: name.slice(0, 64), icon_url: avatar };

  const payload = { username: 'Vortex Website', embeds: [embed] };
  try {
    const resp = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) return res.status(502).json({ ok: false, message: 'Discord webhook failed.' });
  } catch (e) {
    return res.status(502).json({ ok: false, message: 'Discord webhook failed.' });
  }

  return res.json({ ok: true, ticketId, status: 'Waiting for Staff' });
};