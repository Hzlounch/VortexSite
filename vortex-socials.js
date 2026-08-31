/**
 * Vortex Socials helper - Handles dynamic social card rendering and social toasts
 */
(() => {
  const socials = [
    { name: 'YouTube', handle: '@vortexlauncher', url: 'https://youtube.com/@vortexlauncher', desc: 'Watch trailers, FPS benchmarks, and feature showcases.', icon: 'fa-brands fa-youtube', color: '#ff0000' },
    { name: 'TikTok', handle: '@vortexlauncher4', url: 'https://www.tiktok.com/@vortexlauncher4', desc: 'Short clips, PVP montages, and quick client tips.', icon: 'fa-brands fa-tiktok', color: '#ff0050' },
    { name: 'Instagram', handle: '@vortexlauncherq', url: 'https://www.instagram.com/vortexlauncherq/', desc: 'Behind the scenes photos and update leaks.', icon: 'fa-brands fa-instagram', color: '#e1306c' },
    { name: 'GitHub', handle: 'Hzlounch', url: 'https://github.com/Hzlounch', desc: 'Follow public open-source mods and launcher updates.', icon: 'fa-brands fa-github', color: '#ffffff' },
    { name: 'Discord', handle: 'Vortex Community', url: 'https://discord.gg/7P6V3pASw', desc: 'Join 100K+ members for support, giveaways, and chat.', icon: 'fa-brands fa-discord', color: '#5865f2' }
  ];

  window.VortexSocialsList = socials;

  document.addEventListener('DOMContentLoaded', () => {
    const host = document.querySelector('[data-social-grid]');
    if (host) {
      host.innerHTML = socials.map((s, index) => `
        <a class="social-card" href="${s.url}" target="_blank" rel="noopener noreferrer" style="--card-accent: ${s.color}">
          <div class="s-icon" style="color: ${s.color};"><i class="${s.icon}"></i></div>
          <div class="s-info">
            <span class="s-num">0${index + 1} · ${s.name}</span>
            <div class="s-title">${s.handle}</div>
            <div class="s-desc">${s.desc}</div>
          </div>
          <i class="fa-solid fa-arrow-up-right-from-square s-arrow"></i>
        </a>
      `).join('');
    }
  });
})();
