(() => {
  const style = document.createElement('style');
  style.textContent = '.social-section{padding-bottom:80px}.social-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.social-card{position:relative;display:grid;grid-template-columns:44px 1fr 28px;gap:17px;align-items:start;min-height:165px;padding:25px;border:1px solid var(--line);border-radius:15px;background:linear-gradient(145deg,rgba(12,42,48,.9),rgba(7,23,28,.96));color:var(--text);text-decoration:none;transition:transform .25s,border-color .25s,background .25s}.social-card:hover{transform:translateY(-5px);border-color:#35e4d7;background:linear-gradient(145deg,#134b52,#0a2026)}.social-number,.social-name{color:#71f9ef;font:10px "DM Mono",monospace;letter-spacing:.1em}.social-name{display:block}.social-card h3{margin:10px 0 8px;font-size:23px;letter-spacing:-.05em}.social-card p{margin:0;color:#9fbabc;font-size:13px;line-height:1.55}.social-arrow{align-self:center;color:#82fff4;font-size:24px}@media(max-width:650px){.social-grid{grid-template-columns:1fr}.social-card{min-height:130px}}';
  document.head.appendChild(style);
  document.title = document.title.replace(/Vortex\s+Client/gi, 'VortexLauncher');
  const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: node => ['SCRIPT', 'STYLE'].includes(node.parentElement?.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const textNodes = []; while (textWalker.nextNode()) textNodes.push(textWalker.currentNode);
  textNodes.forEach(node => { node.nodeValue = node.nodeValue.replace(/Vortex\s+Client/gi, 'VortexLauncher'); });
  const socials = [
    ['YouTube', '@vortexlauncher', 'https://youtube.com/@vortexlauncher', 'Watch releases, showcases, and Vortex updates.'],
    ['TikTok', '@vortexlauncher4', 'https://www.tiktok.com/@vortexlauncher4', 'Short previews, clips, and launch moments.'],
    ['Instagram', '@vortexlauncherq', 'https://www.instagram.com/vortexlauncherq/', 'Behind the scenes and visual updates.'],
    ['GitHub', '@Hzlounch', 'https://github.com/Hzlounch', 'Follow the public Vortex project work.'],
    ['Discord', 'VortexLauncher', 'https://discord.gg/7P6V3pASw', 'Join the community and get support.']
  ];
  const navLink = '<a href="socials.html">Socials</a>';
  document.querySelectorAll('.nav,.mobile').forEach(nav => { if (!nav.querySelector('a[href="socials.html"]')) nav.insertAdjacentHTML('beforeend', navLink); });
  if (!location.pathname.endsWith('/socials.html')) return;
  const host = document.querySelector('[data-social-grid]');
  if (!host) return;
  host.innerHTML = socials.map(([name, handle, url, copy], index) => `<a class="social-card" href="${url}" target="_blank" rel="noopener noreferrer"><span class="social-number">0${index + 1}</span><div><span class="social-name">${name}</span><h3>${handle}</h3><p>${copy}</p></div><span class="social-arrow">↗</span></a>`).join('');
})();
