(() => {
  const invite = 'https://discord.gg/7P6V3pASw';
  const toast = message => {
    const item = document.createElement('div');
    item.className = 'vortex-toast';
    item.textContent = message;
    document.body.appendChild(item);
    requestAnimationFrame(() => item.classList.add('show'));
    setTimeout(() => { item.classList.remove('show'); setTimeout(() => item.remove(), 240); }, 3400);
  };
  const showShop = (name, description) => {
    const overlay = document.createElement('div');
    overlay.className = 'vortex-checkout';
    overlay.innerHTML = `<section class="vortex-checkout-card" role="dialog" aria-modal="true" aria-label="${name}"><button class="vortex-checkout-close" aria-label="Close">×</button><span>VORTEX SHOP / EARLY ACCESS</span><h2>${name}</h2><p>${description}</p><div class="vortex-checkout-note">Payments are not open yet. Join Discord to get collection previews and the launch notification first.</div><a class="btn" href="${invite}" target="_blank" rel="noopener noreferrer">JOIN DISCORD</a></section>`;
    const close = () => overlay.remove();
    overlay.addEventListener('click', event => { if (event.target === overlay || event.target.closest('.vortex-checkout-close')) close(); });
    document.body.appendChild(overlay);
  };
  const style = document.createElement('style');
  style.textContent = '.vortex-toast{position:fixed;right:22px;bottom:22px;z-index:9999;max-width:360px;padding:14px 17px;border:1px solid rgba(104,255,244,.38);border-radius:12px;background:#0b252b;color:#edffff;box-shadow:0 16px 45px rgba(0,0,0,.36);font:12px Manrope,sans-serif;transform:translateY(20px);opacity:0;transition:.24s}.vortex-toast.show{transform:translateY(0);opacity:1}.vortex-checkout{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:20px;background:rgba(1,10,13,.8);backdrop-filter:blur(9px)}.vortex-checkout-card{position:relative;width:min(510px,100%);padding:38px;border:1px solid rgba(111,255,243,.32);border-radius:18px;background:linear-gradient(145deg,#10363d,#07171c);box-shadow:0 24px 85px rgba(0,0,0,.5);color:#efffff}.vortex-checkout-card>span{color:#67f7ec;font:10px "DM Mono",monospace;letter-spacing:.11em}.vortex-checkout-card h2{margin:13px 45px 12px 0;font-size:40px;letter-spacing:-.065em}.vortex-checkout-card p{color:#b8d3d5;line-height:1.65}.vortex-checkout-note{margin:23px 0;padding:13px;border-left:2px solid #29dfd3;background:rgba(45,222,211,.08);color:#cbe5e4;font-size:13px;line-height:1.5}.vortex-checkout-close{position:absolute;top:17px;right:18px;border:0;background:transparent;color:#cffffa;font-size:29px;cursor:pointer}.product .btn{cursor:pointer}.product.is-ready{transform:translateY(-4px)}';
  document.head.appendChild(style);
  if (location.pathname.endsWith('/store.html')) {
    document.querySelectorAll('.product').forEach(card => {
      const title = card.querySelector('h3')?.textContent || 'Vortex item';
      const description = card.querySelector('p')?.textContent || 'A Vortex collection item.';
      const button = card.querySelector('.btn');
      if (!button) return;
      button.removeAttribute('href');
      button.setAttribute('role', 'button');
      button.textContent = 'VIEW EARLY ACCESS';
      button.addEventListener('click', event => { event.preventDefault(); showShop(title, description); });
      card.addEventListener('mouseenter', () => card.classList.add('is-ready'));
      card.addEventListener('mouseleave', () => card.classList.remove('is-ready'));
    });
  }
  document.querySelectorAll('a[href*="discord.gg"]').forEach(link => link.addEventListener('click', () => toast('Opening the Vortex Discord community…')));
})();
