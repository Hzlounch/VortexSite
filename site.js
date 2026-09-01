/* ==========================================================================
   VORTEX CLIENT — MINIMAL SITE LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle
  const menuBtn = document.getElementById('menuBtn');
  const mobileNav = document.getElementById('mobileNav');
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      const isOpen = mobileNav.classList.contains('open');
      menuBtn.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });
  }

  // Header credits sync (wallet)
  if (window.VortexCredits) {
    const sync = () => {
      const els = document.querySelectorAll('[data-credit]');
      if (els.length) {
        const w = VortexCredits.load();
        els.forEach((el) => { el.innerText = w.credits || 0; });
      }
    };
    sync();
    window.addEventListener('vortex-credits', sync);
  }

  // Config: dark hero CTAs re-style
  const primaryBtns = document.querySelectorAll('.btn-primary');
  primaryBtns.forEach((btn) => {
    btn.addEventListener('mouseenter', () => { btn.style.filter = 'brightness(1.08)'; });
    btn.addEventListener('mouseleave', () => { btn.style.filter = ''; });
  });
});
