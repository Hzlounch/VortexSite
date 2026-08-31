/**
 * Vortex News & Dynamic Content Loader
 */
(() => {
  const safe = value => String(value || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c]);
  const formatDate = str => {
    const d = new Date(str);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const openPostModal = post => {
    const existing = document.querySelector('.vortex-post-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'vortex-post-overlay';
    overlay.style.cssText = 'position:fixed; inset:0; z-index:99999; display:grid; place-items:center; padding:20px; background:rgba(4,6,10,0.85); backdrop-filter:blur(20px); animation:fadeIn 0.3s ease;';

    overlay.innerHTML = `
      <article class="vortex-post" role="dialog" aria-modal="true" style="position:relative; width:min(760px,100%); max-height:min(800px, calc(100vh - 40px)); overflow-y:auto; padding:40px; border:1px solid var(--border-glow,#00d2ff); border-radius:24px; background:rgba(10,16,28,0.95); box-shadow:0 30px 90px rgba(0,0,0,0.9), 0 0 50px rgba(0,210,255,0.2); color:#fff;">
        <button class="vortex-post-close" aria-label="Close" style="position:absolute; top:20px; right:20px; width:38px; height:38px; border-radius:50%; border:1px solid var(--border); background:rgba(255,255,255,0.08); color:#fff; font-size:1.4rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">×</button>
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
          <span style="font-size:0.75rem; font-weight:900; padding:6px 14px; border-radius:20px; background:rgba(0,210,255,0.15); border:1px solid var(--border-glow); color:var(--primary,#00d2ff); uppercase; letter-spacing:1px;">${safe(post.category)}</span>
          <span style="font-size:0.85rem; color:var(--text-sub,#94a3b8); font-weight:600;"><i class="fa-regular fa-calendar"></i> ${safe(formatDate(post.publishedAt))}</span>
        </div>
        <h2 style="font-size:clamp(1.8rem, 4vw, 2.8rem); font-weight:900; margin-bottom:16px; line-height:1.15; color:#fff;">${safe(post.title)}</h2>
        <p style="font-size:1.1rem; color:var(--primary,#00d2ff); font-weight:700; margin-bottom:24px; line-height:1.6;">${safe(post.summary)}</p>
        <div style="font-size:1rem; color:var(--text-sub,#94a3b8); line-height:1.8; border-top:1px solid var(--border); padding-top:24px;">
          ${safe(post.body).replace(/\n/g, '<br>')}
        </div>
      </article>
    `;

    const closeBtn = overlay.querySelector('.vortex-post-close');
    const close = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay || e.target === closeBtn) close(); });
    document.body.appendChild(overlay);
  };

  const renderNewsGrid = posts => {
    const container = document.getElementById('newsGridContainer');
    if (!container || !posts.length) return;

    container.innerHTML = posts.map(post => `
      <article class="news-card" data-tilt style="display:flex; flex-direction:column; background:rgba(14,20,32,0.6); backdrop-filter:blur(25px); border:1px solid var(--border); border-radius:24px; padding:32px; transition:all 0.3s cubic-bezier(0.16,1,0.3,1); position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <span style="font-size:0.75rem; font-weight:900; padding:4px 12px; border-radius:20px; background:rgba(0,210,255,0.15); border:1px solid var(--border-glow); color:var(--primary,#00d2ff); uppercase; letter-spacing:1px;">${safe(post.category)}</span>
          <span style="font-size:0.8rem; color:var(--text-muted,#64748b); font-weight:600;"><i class="fa-regular fa-calendar"></i> ${safe(formatDate(post.publishedAt))}</span>
        </div>
        <h2 style="font-size:1.6rem; font-weight:900; color:#fff; margin-bottom:12px; line-height:1.2;">${safe(post.title)}</h2>
        <p style="font-size:0.95rem; color:var(--text-sub,#94a3b8); line-height:1.6; margin-bottom:24px; flex:1;">${safe(post.summary)}</p>
        <button class="btn btn-secondary glow-btn read-post-btn" data-id="${safe(post.id)}" style="padding:10px 20px; font-size:0.85rem; width:100%;"><i class="fa-solid fa-newspaper"></i> Read Full Article</button>
      </article>
    `).join('');

    container.querySelectorAll('.read-post-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const post = posts.find(p => p.id === id);
        if (post) openPostModal(post);
      });
    });

    if (typeof VanillaTilt !== 'undefined') {
      VanillaTilt.init(container.querySelectorAll('[data-tilt]'), { max: 10, speed: 400 });
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    fetch('content/site-content.json', { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const posts = data && Array.isArray(data.news) ? data.news : [];
        window.VortexNewsPosts = posts;
        renderNewsGrid(posts);
      })
      .catch(err => console.warn('[VortexNews] Error fetching news content:', err));
  });
})();
