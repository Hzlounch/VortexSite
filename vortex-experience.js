/**
 * Vortex Experience helper - Handles site-wide interactive enhancements & toasts
 */
(() => {
  const toast = (message, type = 'info') => {
    let container = document.getElementById('vortex-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'vortex-toast-container';
      container.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:99999; display:flex; flex-direction:column; gap:10px; pointer-events:none;';
      document.body.appendChild(container);
    }

    const item = document.createElement('div');
    item.className = `vortex-toast vortex-toast-${type}`;
    item.style.cssText = 'pointer-events:auto; min-width:280px; max-width:380px; padding:14px 20px; border-radius:14px; background:rgba(10,16,28,0.92); border:1px solid rgba(0,210,255,0.4); color:#fff; font-size:0.9rem; font-weight:700; box-shadow:0 15px 35px rgba(0,0,0,0.6), 0 0 20px rgba(0,210,255,0.2); backdrop-filter:blur(15px); transform:translateY(20px); opacity:0; transition:all 0.3s cubic-bezier(0.16,1,0.3,1); display:flex; align-items:center; gap:12px;';

    const iconMap = {
      success: '<i class="fa-solid fa-circle-check" style="color:var(--accent-green,#10b981); font-size:1.2rem;"></i>',
      error: '<i class="fa-solid fa-circle-xmark" style="color:var(--accent-pink,#f43f5e); font-size:1.2rem;"></i>',
      info: '<i class="fa-solid fa-circle-info" style="color:var(--primary,#00d2ff); font-size:1.2rem;"></i>'
    };

    item.innerHTML = `${iconMap[type] || iconMap.info}<span>${message}</span>`;
    container.appendChild(item);

    requestAnimationFrame(() => {
      item.style.transform = 'translateY(0)';
      item.style.opacity = '1';
    });

    setTimeout(() => {
      item.style.transform = 'translateY(-10px)';
      item.style.opacity = '0';
      setTimeout(() => item.remove(), 300);
    }, 3800);
  };

  window.vortexToast = toast;

  document.addEventListener('DOMContentLoaded', () => {
    // Attach toast helper to external links
    document.querySelectorAll('a[href*="discord.gg"]').forEach(link => {
      link.addEventListener('click', () => {
        toast('Opening the Vortex Discord community...', 'info');
      });
    });
  });
})();
