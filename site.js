/* ==========================================================================
   VORTEX CLIENT — THE NEXT-GEN JAVASCRIPT LOGIC
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
      const w = VortexCredits.load();
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
      const elementVisible = 100;
      if (elementTop < windowHeight - elementVisible) {
        reveals[i].classList.add('active');
      }
    }
  }
  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll(); // Trigger immediately on load

  // 5. Initialize Particles.js (Premium Effect)
  if (typeof particlesJS !== 'undefined') {
    particlesJS("particles-js", {
      particles: {
        number: { value: 60, density: { enable: true, value_area: 800 } },
        color: { value: ["#00d2ff", "#7c5cff", "#10b981"] },
        shape: { type: "circle" },
        opacity: { value: 0.5, random: true, anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false } },
        size: { value: 3, random: true, anim: { enable: true, speed: 2, size_min: 0.1, sync: false } },
        line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.1, width: 1 },
        move: { enable: true, speed: 1, direction: "none", random: true, straight: false, out_mode: "out", bounce: false }
      },
      interactivity: {
        detect_on: "canvas",
        events: {
          onhover: { enable: true, mode: "bubble" },
          onclick: { enable: true, mode: "push" },
          resize: true
        },
        modes: {
          bubble: { distance: 200, size: 6, duration: 2, opacity: 0.8, speed: 3 },
          push: { particles_nb: 4 }
        }
      },
      retina_detect: true
    });
  }

  // 6. Vanilla Tilt 3D Effect for Cards
  if (typeof VanillaTilt !== 'undefined') {
    VanillaTilt.init(document.querySelectorAll("[data-tilt]"), {
      max: 15,
      speed: 400,
      glare: true,
      "max-glare": 0.2,
      scale: 1.05
    });
  }
});
