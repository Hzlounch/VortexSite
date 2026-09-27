/* ==========================================================================
   VORTEX CLIENT — NEWS LOADER
   Loads published news from the live site JSON (written by the Discord bot
   via /site-news) and prepends them above the static fallback cards.
   If fetch fails or no posts exist, the static cards remain untouched.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('.news-grid2');
  if (!grid) return;

  initFilters(grid);

  const sources = [
    'https://vortex-site-beta.vercel.app/content/site-content.json',
    'content/site-content.json'
  ];

  loadFrom(sources, 0);

  function loadFrom(list, index) {
    if (index >= list.length) return;
    fetch(list[index], { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) { throw new Error('HTTP ' + res.status); }
        return res.json();
      })
      .then((data) => {
        const posts = Array.isArray(data && data.news) ? data.news : [];
        if (!posts.length) throw new Error('empty');
        const homeGrid = document.querySelector('.news-grid');
        posts.slice(0, 3).forEach((post, i) => {
          const card = buildCard(post);
          if (card) grid.insertBefore(card, grid.firstChild);
          if (homeGrid && i < 3) {
            const item = buildHomeCard(post);
            if (item) homeGrid.insertBefore(item, homeGrid.firstChild);
          }
        });
      })
      .catch(() => loadFrom(list, index + 1));
  }
});

function initFilters(grid) {
  const buttons = Array.from(document.querySelectorAll('.news-cat'));
  if (!buttons.length) return;
  const cards = () => Array.from(grid.querySelectorAll('.news-card'));

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('on'));
      btn.classList.add('on');
      const key = (btn.textContent || '').trim().toLowerCase();
      cards().forEach((card) => {
        const tag = (card.querySelector('.nc-tag')?.textContent || '').toLowerCase();
        const show = key === 'all' || tag === key || tag.includes(key);
        card.style.display = show ? '' : 'none';
      });
    });
  });
}

function buildHomeCard(p) {
  if (!p || !p.title) return null;
  const cat = p.category || 'News';
  const summary = p.summary || 'Check out the latest Vortex news.';

  const a = document.createElement('a');
  a.className = 'news-item';
  a.href = 'news.html';
  a.setAttribute('aria-label', p.title);

  const top = document.createElement('div');
  top.className = 'news-top';
  const av = document.createElement('span');
  av.className = 'avatar-sm';
  av.textContent = (p.title || 'V').charAt(0).toUpperCase();
  const tag = document.createElement('span');
  tag.className = 'news-tag';
  tag.textContent = cat;
  top.appendChild(av);
  top.appendChild(tag);

  const date = document.createElement('div');
  date.className = 'news-date';
  date.innerHTML = '<i class="fa-regular fa-calendar"></i> ' + (p.publishedAt || 'recently');

  const h3 = document.createElement('h3');
  h3.textContent = p.title;

  const para = document.createElement('p');
  para.textContent = summary;

  const more = document.createElement('span');
  more.className = 'news-more';
  more.innerHTML = 'Read update <i class="fa-solid fa-arrow-right"></i>';

  a.appendChild(top);
  a.appendChild(date);
  a.appendChild(h3);
  a.appendChild(para);
  a.appendChild(more);
  return a;
}

function buildCard(p) {
  if (!p || !p.title) return null;
  const cat = p.category || 'News';
  const summary = p.summary || 'Check out the latest Vortex news.';

  const card = document.createElement('article');
  card.className = 'news-card dynamic-news';

  const top = document.createElement('div');
  top.className = 'nc-top';
  const tag = document.createElement('span');
  tag.className = 'nc-tag';
  tag.textContent = cat;
  const when = document.createElement('span');
  when.className = 'nc-when';
  when.innerHTML = '<i class="fa-regular fa-clock"></i> ' + timeAgo(p.publishedAt);
  top.appendChild(tag);
  top.appendChild(when);

  if (p.imageUrl && /^https?:\/\//i.test(p.imageUrl)) {
    const img = document.createElement('img');
    img.className = 'nc-cover';
    img.src = p.imageUrl;
    img.alt = p.title;
    img.loading = 'lazy';
    img.onerror = () => img.remove();
    card.appendChild(img);
  }

  const h3 = document.createElement('h3');
  h3.textContent = p.title;
  card.appendChild(h3);

  const para = document.createElement('p');
  para.textContent = summary;
  card.appendChild(para);

  if (p.body && p.body.trim()) {
    const over = document.createElement('details');
    over.className = 'nc-body';
    const sum = document.createElement('summary');
    sum.textContent = 'Read more';
    const content = document.createElement('div');
    content.textContent = p.body;
    over.appendChild(sum);
    over.appendChild(content);
    card.appendChild(over);
  }

  const author = document.createElement('div');
  author.className = 'nc-author';
  const av = document.createElement('span');
  av.className = 'avatar';
  const initial = (p.author || 'Vortex').trim().charAt(0).toUpperCase() || 'V';
  av.textContent = initial;
  const meta = document.createElement('div');
  const nm = document.createElement('b');
  nm.textContent = p.author || 'Vortex Team';
  const role = document.createElement('span');
  role.textContent = p.category_label || cat;
  meta.appendChild(nm);
  meta.appendChild(role);
  author.appendChild(av);
  author.appendChild(meta);
  card.appendChild(author);

  return card;
}

function timeAgo(dateStr) {
  if (!dateStr) return 'recently';
  const t = new Date(dateStr.endsWith('Z') || dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00Z');
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