(function () {
  const SOURCES = [
    'https://vortex-site-beta.vercel.app/content/site-content.json',
    '../content/site-content.json',
    'content/site-content.json'
  ];

  const STATUSES = ['Waiting for Staff', 'In Progress', 'Resolved', 'Closed'];
  const STATUS_META = {
    'Waiting for Staff': { icon: 'fa-clock', color: '#f5c451' },
    'In Progress': { icon: 'fa-bolt', color: '#2fe3ea' },
    'Resolved': { icon: 'fa-circle-check', color: '#3ddc84' },
    'Closed': { icon: 'fa-lock', color: '#5e6e80' }
  };

  let loadedTickets = [];
  let mineOnly = false;
  let currentUser = null;

  function timeAgo(iso) {
    const then = new Date(iso).getTime();
    if (!then) return '';
    const s = Math.floor((Date.now() - then) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    const d = Math.floor(h / 24);
    return d + 'd ago';
  }

  function statusOf(t) {
    const raw = String(t.status || 'Waiting for Staff');
    return STATUSES.find(s => raw.toLowerCase() === s.toLowerCase()) || raw;
  }

  function normalize(t) {
    const status = statusOf(t);
    const meta = STATUS_META[status] || STATUS_META['Waiting for Staff'];
    return {
      id: String(t.id || ''),
      name: String(t.name || t.author || 'Guest'),
      minecraft: String(t.minecraft || ''),
      category: String(t.category || 'General'),
      subject: String(t.subject || ''),
      status,
      color: meta.color,
      icon: meta.icon,
      ago: timeAgo(t.createdAt || t.created || '')
    };
  }

  function el(tag, cls, html) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function matchesMe(t) {
    if (!currentUser) return false;
    return t.name === currentUser.username || t.name === currentUser.displayName;
  }

  function render() {
    const board = document.getElementById('ticketBoard');
    const emptyState = document.getElementById('ticketBarEmpty');
    if (!board) return;

    const all = mineOnly ? loadedTickets.filter(matchesMe) : loadedTickets;
    if (!all.length) {
      board.innerHTML = '';
      if (emptyState) emptyState.style.display = '';
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    const colsWrap = el('div', 'ticket-board');
    const byStatus = { 'Waiting for Staff': [], 'In Progress': [], 'Resolved': [], 'Closed': [] };
    all.forEach(t => { (byStatus[t.status] = byStatus[t.status] || []).push(t); });

    for (const status of STATUSES) {
      const col = el('div', 'ticket-col');
      const meta = STATUS_META[status] || STATUS_META['Waiting for Staff'];
      const head = el('div', 'ticket-col-head');
      head.innerHTML = `<i class="fa-solid ${meta.icon}" style="color:${meta.color}"></i> <b>${status}</b> <span class="ticket-count">${(byStatus[status] || []).length}</span>`;
      col.appendChild(head);

      (byStatus[status] || []).forEach(t => {
        const card = el('article', 'ticket-card');
        const initials = (t.name || '?').trim().charAt(0).toUpperCase() || '?';
        const minefield = t.minecraft ? `<span class="ticket-mc">@${t.minecraft}</span>` : '';
        card.innerHTML = `
          <div class="ticket-card-top"><span class="ticket-id">${t.id}</span><span class="ticket-ago">${t.ago}</span></div>
          <h4>${t.subject}</h4>
          <div class="ticket-cat">${t.category}</div>
          <div class="ticket-meta-row">
            <span class="ticket-avatar">${initials}</span><span class="ticket-user">${t.name}</span>${minefield}
          </div>`;
        col.appendChild(card);
      });
      colsWrap.appendChild(col);
    }
    board.appendChild(colsWrap);
  }

  function fetchJSON(url) {
    return fetch(url, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then(d => (Array.isArray(d.tickets) ? d.tickets : []));
  }

  function load() {
    (function next(i) {
      if (i >= SOURCES.length) { loadedTickets = []; render(); return; }
      fetchJSON(SOURCES[i])
        .then(list => { loadedTickets = list.map(normalize); render(); })
        .catch(() => next(i + 1));
    })(0);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('ticketBoard')) return;
    load();

    const toggle = document.getElementById('mineToggle');
    const loginWrap = document.getElementById('authUserWrap');
    if (toggle) toggle.addEventListener('click', () => {
      mineOnly = !mineOnly;
      toggle.classList.toggle('on', mineOnly);
      toggle.textContent = mineOnly ? 'All tickets' : 'My tickets';
      render();
    });

    window.addEventListener('vortex:user', () => {
      currentUser = window.__vortexUser || null;
      if (loginWrap) loginWrap.style.display = currentUser ? 'flex' : 'none';
      render();
    });

    window.addEventListener('vortex:reload-tickets', () => { load(); });
  });
})();