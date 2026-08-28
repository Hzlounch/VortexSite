/* ==========================================================================
   VORTEX CLIENT — SITE JAVASCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Menu Toggle
  const menuBtn = document.getElementById('menuBtn');
  const mobileNav = document.getElementById('mobileNav');

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      const isOpen = mobileNav.classList.contains('open');
      menuBtn.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });
  }

  // Header Scroll Blur Effect
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    if (header) {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  });

  // Header Credits Auto-Sync
  function updateHeaderCredits() {
    const el = document.getElementById('headerCr');
    if (el && window.VortexCredits) {
      const w = VortexCredits.load();
      el.innerText = w.credits || 0;
    }
  }

  updateHeaderCredits();
  window.addEventListener('vortex-credits', updateHeaderCredits);
});
