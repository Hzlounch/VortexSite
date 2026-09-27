(() => {
  const safe = value => String(value || '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]);
  const date = value => { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
  const openPost = post => {
    const overlay = document.createElement('div');
    overlay.className = 'vortex-post-overlay';
    overlay.innerHTML = `<article class="vortex-post" role="dialog" aria-modal="true"><button class="vortex-post-close" aria-label="Close">×</button><span class="meta">${safe(post.category)} / ${safe(date(post.publishedAt))}</span><h2>${safe(post.title)}</h2><p class="vortex-post-summary">${safe(post.summary)}</p><div class="vortex-post-body">${safe(post.body).replace(/\n/g, '<br>')}</div></article>`;
    const close = () => overlay.remove();
    overlay.addEventListener('click', event => { if (event.target === overlay || event.target.closest('.vortex-post-close')) close(); });
    document.body.appendChild(overlay);
  };
  const addNewsToPage = posts => {
    if (!location.pathname.endsWith('/news.html')) return;
    const list = document.querySelector('.list');
    if (!list || !posts.length) return;
    [...posts].reverse().forEach(post => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'list-item vortex-managed-news';
      item.innerHTML = `<span class="meta">${safe(post.category)} / ${safe(date(post.publishedAt))}</span><div><h3>${safe(post.title)}</h3><p>${safe(post.summary)}</p></div><span class="more">READ UPDATE →</span>`;
      item.addEventListener('click', () => openPost(post));
      list.prepend(item);
    });
  };
  const addNewsToHome = posts => {
    if (!location.pathname.endsWith('/index.html') && location.pathname !== '/') return;
    const post = posts[0];
    const featured = document.querySelector('.featured-news');
    if (!post || !featured) return;
    const label = featured.querySelector('.date');
    const heading = featured.querySelector('h3');
    const button = featured.querySelector('.story');
    if (label) label.textContent = `${post.category} / ${date(post.publishedAt)}`;
    if (heading) heading.textContent = post.title;
    if (button) { button.textContent = 'READ LATEST UPDATE →'; button.onclick = () => openPost(post); }
  };
  const style = document.createElement('style');
  style.textContent = '.vortex-managed-news{font:inherit}.vortex-post-overlay{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:22px;background:rgba(1,10,13,.78);backdrop-filter:blur(9px)}.vortex-post{position:relative;width:min(720px,100%);max-height:min(740px,calc(100vh - 44px));overflow:auto;padding:42px;border:1px solid rgba(93,250,240,.3);border-radius:18px;background:linear-gradient(145deg,#0d2c32,#061419);box-shadow:0 25px 80px rgba(0,0,0,.45);color:#efffff}.vortex-post h2{margin:12px 35px 14px 0;font-size:clamp(29px,5vw,48px);letter-spacing:-.06em;line-height:1}.vortex-post-summary{color:#b2cfd0;font-size:17px;line-height:1.65}.vortex-post-body{margin-top:25px;color:#d2e7e7;line-height:1.8}.vortex-post-close{position:absolute;top:17px;right:18px;width:34px;height:34px;border:1px solid rgba(121,247,239,.32);border-radius:50%;background:#11353a;color:#dffffb;font-size:26px;line-height:1;cursor:pointer}.vortex-post-close:hover{background:#1d6061}';
  document.head.appendChild(style);
  fetch('content/site-content.json', { cache: 'no-store' }).then(response => response.ok ? response.json() : null).then(content => {
    const posts = content && Array.isArray(content.news) ? content.news : [];
    addNewsToPage(posts);
    addNewsToHome(posts);
  }).catch(() => {});
})();
