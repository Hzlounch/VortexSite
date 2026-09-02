/* VORTEX — live social counters & follow/unfollow votes */
document.addEventListener('DOMContentLoaded', () => {
  const API = (window.VERTEX_API || '');
  const fmt = (n) => {
    n = Math.max(0, n);
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  };

  const setCount = (platform, total) => {
    const el = document.getElementById('count-' + platform);
    if (el) el.textContent = fmt(total);
  };

  const setLabel = (platform, following) => {
    const btn = document.querySelector(`[data-follow="${platform}"]`);
    if (!btn) return;
    const span = btn.querySelector('.s-follow');
    if (!span) return;
    if (following) {
      span.innerHTML = '<i class="fa-solid fa-check"></i> Following';
      btn.classList.add('following');
    } else {
      const icons = { discord: 'fa-discord', youtube: 'fa-youtube', tiktok: 'fa-tiktok', instagram: 'fa-instagram', github: 'fa-github' };
      const verbs = { discord: 'Follow', youtube: 'Subscribe', tiktok: 'Follow', instagram: 'Follow', github: 'Follow' };
      span.innerHTML = `<i class="fa-brands ${icons[platform] || 'fa-heart'}"></i> ${verbs[platform] || 'Follow'}`;
      btn.classList.remove('following');
    }
  };

  const load = async () => {
    try {
      const res = await fetch((API || '') + '/api/social-counts');
      const data = await res.json();
      if (!data.ok) return;
      // stat strip
      const strip = document.getElementById('socialStatStrip');
      if (strip) {
        const labels = { discord: 'Discord', youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', github: 'GitHub' };
        strip.innerHTML = Object.entries(data.counts).map(([k, c]) =>
          `<div class="stat-mini"><b style="color:var(--accent);">${fmt(c.total)}</b><span>${labels[k] || k}</span></div>`
        ).join('');
      }
      // per-card counts + follow state from cookie
      const cookie = document.cookie.split(';').find(p => p.trim().startsWith('vortex_ss='));
      let ssp = [];
      if (cookie) { try { ssp = JSON.parse(decodeURIComponent(cookie.split('=').slice(1).join('='))); } catch {} }
      Object.entries(data.counts).forEach(([k, c]) => {
        setCount(k, c.total);
        setLabel(k, ssp.includes('follow:' + k));
      });
    } catch (_) {}
  };

  // Follow buttons: vote up (follow) / down (un-follow) + track
  const CHANNELS = {
    youtube: 'https://youtube.com/@vortexlauncher',
    tiktok: 'https://www.tiktok.com/@vortexlauncher4',
    instagram: 'https://www.instagram.com/vortexlauncherq/',
    discord: 'https://discord.gg/7P6V3pASw',
    github: 'https://github.com/Hzlounch'
  };
  document.querySelectorAll('[data-follow]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const platform = btn.getAttribute('data-follow');
      const card = btn.closest('.social-card');
      if (card) card.classList.add('s-busy');
      try {
        const res = await fetch((API || '') + '/api/social-follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform })
        });
        const data = await res.json();
        if (data.ok) {
          setCount(platform, data.total);
          const following = data.action === 'inc';
          setLabel(platform, following);
        }
      } catch (_) {
        // API unavailable (e.g. opened as a local file) — still let the link work
      }
      // Always open the real platform so the visitor actually follows there.
      const link = btn.getAttribute('href') || CHANNELS[platform];
      if (link) window.open(link, '_blank', 'noopener');
      if (card) card.classList.remove('s-busy');
    });
  });

  load();
});
