(() => {
  const safe = value => String(value || '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]);
  const date = value => { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };

  const openPost = post => {
    const overlay = document.createElement('div');
    overlay.className = 'vortex-post-overlay';
    overlay.innerHTML = `<article class="vortex-post" role="dialog" aria-modal="true">
      <button class="vortex-post-close" aria-label="Close">×</button>
      <span class="meta">${safe(post.category || 'ANNOUNCEMENT')} / ${safe(date(post.publishedAt || new Date()))} ${post.author ? `• ${safe(post.author)}` : ''}</span>
      <h2>${safe(post.title)}</h2>
      <p class="vortex-post-summary">${safe(post.summary || '')}</p>
      <div class="vortex-post-body">${safe(post.body || post.summary || '').replace(/\n/g, '<br>')}</div>
    </article>`;

    const close = () => overlay.remove();
    overlay.addEventListener('click', event => { if (event.target === overlay || event.target.closest('.vortex-post-close')) close(); });
    document.body.appendChild(overlay);
  };

  const renderNewsToPage = posts => {
    if (!posts || !posts.length) return;

    // Render on news.html
    const newsList = document.querySelector('.list') || document.querySelector('.news-grid');
    if (newsList && (location.pathname.endsWith('/news.html') || location.pathname.includes('news'))) {
      const existingManaged = newsList.querySelectorAll('.vortex-managed-news');
      existingManaged.forEach(el => el.remove());

      posts.forEach(post => {
        const item = document.createElement('div');
        item.className = 'news-card vortex-managed-news';
        item.style.cursor = 'pointer';
        item.innerHTML = `
          <div class="news-meta">${safe(post.category || 'NEWS')} • ${safe(date(post.publishedAt || new Date()))}</div>
          <h3 class="news-title">${safe(post.title)}</h3>
          <p class="news-desc">${safe(post.summary || '')}</p>
          <span style="color: var(--primary); font-weight: 800; font-size: 0.85rem;">READ ARTICLE →</span>
        `;
        item.addEventListener('click', () => openPost(post));
        newsList.prepend(item);
      });
    }

    // Render on index.html
    if (location.pathname.endsWith('/index.html') || location.pathname === '/' || location.pathname.endsWith('/')) {
      const featured = document.querySelector('.featured-news') || document.querySelector('.news-card');
      const post = posts[0];
      if (post && featured) {
        const label = featured.querySelector('.date') || featured.querySelector('.news-meta');
        const heading = featured.querySelector('h3') || featured.querySelector('.news-title');
        const summary = featured.querySelector('p') || featured.querySelector('.news-desc');
        if (label) label.textContent = `${post.category || 'ANNOUNCEMENT'} • ${date(post.publishedAt || new Date())}`;
        if (heading) heading.textContent = post.title;
        if (summary) summary.textContent = post.summary || '';
        featured.style.cursor = 'pointer';
        featured.onclick = () => openPost(post);
      }
    }
  };

  const loadAllNews = async () => {
    let combinedPosts = [];

    // Local Storage News (added via web console or bot relay / WebSocket / API)
    try {
      const localData = JSON.parse(localStorage.getItem('vortex_news_posts') || '[]');
      if (Array.isArray(localData)) combinedPosts.push(...localData);
    } catch (e) {}

    // Static site-content.json file
    try {
      const res = await fetch('content/site-content.json', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.news)) {
          combinedPosts.push(...data.news);
        }
      }
    } catch (e) {}

    // Deduplicate by ID or title
    const seen = new Set();
    const uniquePosts = combinedPosts.filter(post => {
      const key = post.id || post.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort newest first
    uniquePosts.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));

    renderNewsToPage(uniquePosts);
    return uniquePosts;
  };

  // Expose global API for Discord Bot and external integrations
  window.VortexNewsAPI = {
    addPost: (post) => {
      if (!post || !post.title) return false;
      const newPost = {
        id: post.id || 'bot-' + Date.now(),
        title: post.title,
        category: post.category || 'ANNOUNCEMENT',
        summary: post.summary || '',
        body: post.body || post.summary || '',
        publishedAt: post.publishedAt || new Date().toISOString(),
        author: post.author || 'Vortex Bot'
      };

      let existing = [];
      try {
        existing = JSON.parse(localStorage.getItem('vortex_news_posts') || '[]');
      } catch (e) {}

      existing.unshift(newPost);
      localStorage.setItem('vortex_news_posts', JSON.stringify(existing));
      loadAllNews();

      // Dispatch custom event for real-time listeners
      window.dispatchEvent(new CustomEvent('vortex:news-added', { detail: newPost }));
      return true;
    },
    clearBotPosts: () => {
      localStorage.removeItem('vortex_news_posts');
      loadAllNews();
    },
    refresh: loadAllNews
  };

  // Inject Overlay CSS
  const style = document.createElement('style');
  style.textContent = `
    .vortex-post-overlay {
      position: fixed; inset: 0; z-index: 9999;
      display: grid; place-items: center; padding: 20px;
      background: rgba(3, 8, 18, 0.85); backdrop-filter: blur(12px);
    }
    .vortex-post {
      position: relative; width: min(720px, 100%); max-height: min(740px, calc(100vh - 40px));
      overflow-y: auto; padding: 40px; border: 1px solid rgba(0, 240, 255, 0.4);
      border-radius: 20px; background: linear-gradient(145deg, #09162a, #040914);
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 240, 255, 0.2);
      color: #f8fafc;
    }
    .vortex-post h2 { margin: 12px 35px 14px 0; font-size: clamp(24px, 4vw, 38px); font-weight: 900; letter-spacing: -0.03em; }
    .vortex-post .meta { color: var(--primary, #00f0ff); font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    .vortex-post-summary { color: #94a3b8; font-size: 1.05rem; line-height: 1.6; margin-top: 10px; }
    .vortex-post-body { margin-top: 24px; color: #cbd5e1; line-height: 1.8; font-size: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 20px; }
    .vortex-post-close {
      position: absolute; top: 20px; right: 20px; width: 36px; height: 36px;
      border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 50%; background: rgba(0, 240, 255, 0.1);
      color: #00f0ff; font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s ease;
    }
    .vortex-post-close:hover { background: rgba(0, 240, 255, 0.3); color: #fff; transform: scale(1.05); }
  `;
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllNews);
  } else {
    loadAllNews();
  }
})();
