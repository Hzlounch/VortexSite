/* ==========================================================================
   VORTEX CLIENT — UPDATES (CHANGELOG) LOADER
   Renders the full update timeline from DEFAULT data merged with any entries
   published by the Discord bot via /site-updates (site-content.json -> updates).
   Filters + sticky version rail are included.
   ========================================================================== */

const VORTEX_UPDATES_DEFAULTS = [
  {
    id: 'upd-1', version: 'v1.5.2', tag: 'RELEASE', publishedAt: '2026-08-28',
    title: 'Vortex 1.5.2 — Atomic Ember',
    notes: [
      'New GPU pipeline now on by default for all devices — up to 2x FPS on weaker machines.',
      'Launcher startup cut from 9s to ~4s with async loading.',
      'Added 24 new cosmetics and the Quantum Capes collection.',
      'Fixed a crash when closing the store while a purchase is loading.',
      'Download resuming now works after an interrupted install.',
      'Updated all bundled mods to their latest compatible versions.'
    ]
  },
  {
    id: 'upd-2', version: 'v1.5.1', tag: 'HOTFIX', publishedAt: '2026-08-17',
    title: 'Vortex 1.5.1 — Hotfix',
    notes: [
      'Fixed launcher hang on Windows 10 with low RAM.',
      'Fixed migration wizard resetting profile settings.',
      'Hotfixed an issue where FPS caps were ignored after alt-tabbing.',
      'Patched a rare account-link timeout.'
    ]
  },
  {
    id: 'upd-3', version: 'v1.5.0', tag: 'PUBLIC BETA', publishedAt: '2026-08-02',
    title: 'Vortex 1.5.0 — Public Beta',
    notes: [
      'Introducing the new rendering core and shader-ready pipeline.',
      'Store and Credits system fully rebuilt with instant delivery.',
      'New profile manager with per-mod feature toggles.',
      'Microsoft authentication rewritten for the new sign-in flow.',
      'Community servers feed added to the launcher home tab.'
    ]
  },
  {
    id: 'upd-4', version: 'v1.4.4', tag: 'RELEASE', publishedAt: '2026-07-21',
    title: 'Vortex 1.4.4 — Stability Update',
    notes: [
      'Reduced memory usage by ~18% on crowded servers.',
      'Fixed frequent disconnect spam when changing servers quickly.',
      'Improved HUD module positioning with snapping.',
      'Bug fixes for mods conflicting during profile switch.'
    ]
  },
  {
    id: 'upd-5', version: 'v1.4.0', tag: 'RELEASE', publishedAt: '2026-06-30',
    title: 'Vortex 1.4.0 — The Performance Update',
    notes: [
      'Rebuilt rendering pipeline with significantly reduced overhead.',
      'New, faster launcher with parallel downloads.',
      'Added built-in version compatibility checker.',
      'Fresh UI across the launcher and settings.'
    ]
  }
];

document.addEventListener('DOMContentLoaded', () => {
  const feed = document.getElementById('uptFeed');
  const side = document.getElementById('uptSide');
  const tags = document.getElementById('uptTags');
  if (!feed) return;

  const sources = [
    'https://vortex-site-beta.vercel.app/content/site-content.json',
    'content/site-content.json'
  ];

  loadFrom(sources, 0);

  function loadFrom(list, index) {
    if (index >= list.length) { render(VORTEX_UPDATES_DEFAULTS); return; }
    fetch(list[index], { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then((data) => {
        const items = Array.isArray(data && data.updates) ? data.updates : [];
        if (!items.length) throw new Error('empty');
        const merged = items.concat(VORTEX_UPDATES_DEFAULTS.filter((d) => !items.some((i) => i.version === d.version && i.id === d.id)));
        render(merged);
      })
      .catch(() => loadFrom(list, index + 1));
  }

  function render(all) {
    const norm = all.map((u, i) => Object.assign({}, u, { key: u.id || ('upd-' + i) }));
    norm.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
    feed.innerHTML = '';
    side.innerHTML = '<div class="upt-side-title">Versions</div>';

    norm.forEach((u, i) => {
      feed.appendChild(buildCard(u, i === 0));
      side.appendChild(buildSide(u));
    });

    if (tags) {
      const buttons = Array.from(tags.querySelectorAll('.upt-tag'));
      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          buttons.forEach((b) => b.classList.remove('on'));
          btn.classList.add('on');
          const key = (btn.textContent || '').trim().toLowerCase();
          norm.forEach((u) => {
            const card = document.getElementById('upt-' + u.key);
            if (!card) return;
            const tag = (u.tag || 'release').toLowerCase();
            card.style.display = key === 'all' || tag === key || tag.includes(key) ? '' : 'none';
          });
        });
      });
    }
  }

  function tagClass(tag) {
    const t = (tag || '').toUpperCase();
    if (t.includes('HOTFIX')) return 'red';
    if (t.includes('BETA')) return 'gold';
    return 'green';
  }

  function buildSide(u) {
    const a = document.createElement('a');
    a.className = 'upt-side-item';
    a.href = '#upt-' + u.key;
    const chip = document.createElement('span');
    chip.className = 'upt-chip';
    chip.textContent = u.version || 'Latest';
    const info = document.createElement('span');
    info.className = 'upt-side-info';
    info.textContent = (u.publishedAt || '').slice(0, 10);
    a.appendChild(chip);
    a.appendChild(info);
    return a;
  }

  function buildCard(u, latest) {
    const card = document.createElement('article');
    card.className = 'upt-card' + (latest ? ' latest' : '');
    card.id = 'upt-' + u.key;

    const head = document.createElement('div');
    head.className = 'upt-head';
    const meta = document.createElement('div');
    meta.className = 'upt-meta';
    const tag = document.createElement('span');
    tag.className = 'upt-mini-tag ' + tagClass(u.tag);
    tag.textContent = u.tag || 'RELEASE';
    const date = document.createElement('span');
    date.className = 'upt-date';
    date.innerHTML = '<i class="fa-regular fa-calendar"></i> ' + timeAgo(u.publishedAt);
    meta.appendChild(tag);
    meta.appendChild(date);

    const ver = document.createElement('span');
    ver.className = 'upt-ver';
    ver.textContent = u.version || 'Latest';
    head.appendChild(meta);
    head.appendChild(ver);

    card.appendChild(head);

    const h3 = document.createElement('h3');
    h3.innerHTML = (latest ? '<i class="fa-solid fa-star"></i> ' : '') + escapeHtml(u.title || 'Vortex Update');
    card.appendChild(h3);

    const notes = Array.isArray(u.notes) ? u.notes : [];
    const lines = notes.map((n) => String(n).trim()).filter(Boolean);
    if (lines.length) {
      const list = document.createElement('ul');
      list.className = 'upt-notes';
      lines.forEach((line) => {
        const li = document.createElement('li');
        li.textContent = line;
        list.appendChild(li);
      });
      card.appendChild(list);
    }

    if (u.author) {
      const auth = document.createElement('div');
      auth.className = 'upt-author';
      auth.textContent = 'Published by ' + u.author;
      card.appendChild(auth);
    }

    return card;
  }

  function timeAgo(dateStr) {
    if (!dateStr) return 'recently';
    const t = new Date(String(dateStr).endsWith('Z') || String(dateStr).includes('T') ? dateStr : dateStr + 'T00:00:00Z');
    if (isNaN(t.getTime())) return 'recently';
    const diff = Date.now() - t.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    const hours = Math.floor(mins / 60);
    if (hours < 1) return mins + 'm ago';
    const days = Math.floor(hours / 24);
    if (days < 1) return hours + 'h ago';
    const weeks = Math.floor(days / 7);
    if (weeks < 1) return days + 'd ago';
    const months = Math.floor(days / 30);
    if (months < 1) return weeks + 'w ago';
    const years = Math.floor(months / 12);
    if (years < 1) return months + 'mo ago';
    return years + 'yr ago';
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
});