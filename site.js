/* ==========================================================================
   VORTEX CLIENT — GLOBAL INTERACTIVITY & EVENT HANDLERS v2.5
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const menuBtn = document.getElementById('menuBtn');
  const mobileNav = document.getElementById('mobileNav');

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      const isOpen = mobileNav.classList.contains('open');
      menuBtn.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });
  }

  // 2. Header Scroll Blur Effect
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

  // 3. Header Credits Auto-Sync
  function updateHeaderCredits() {
    const el = document.getElementById('headerCr');
    if (el && window.VortexCredits) {
      const w = window.VortexCredits.load();
      el.innerText = w.credits || 0;
    }
  }

  updateHeaderCredits();
  window.addEventListener('vortex-credits', updateHeaderCredits);

  // 4. Scroll Reveal Animations
  const reveals = document.querySelectorAll('.reveal');
  function revealOnScroll() {
    for (let i = 0; i < reveals.length; i++) {
      const windowHeight = window.innerHeight;
      const elementTop = reveals[i].getBoundingClientRect().top;
      const elementVisible = 80;
      if (elementTop < windowHeight - elementVisible) {
        reveals[i].classList.add('active');
      }
    }
  }
  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll(); // Trigger immediately on load

  // 5. Initialize VanillaTilt 3D Effect for Cards
  if (typeof VanillaTilt !== 'undefined') {
    VanillaTilt.init(document.querySelectorAll("[data-tilt]"), {
      max: 12,
      speed: 400,
      glare: true,
      "max-glare": 0.2,
      scale: 1.02
    });
  }
});
