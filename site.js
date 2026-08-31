/* ==========================================================================
   VORTEXLAUNCHER — CLIENT SIDE INTERACTION & CANVAS LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Language Dropdown Toggle & Selector
  const langToggle = document.getElementById('langToggle');
  const langDropdown = document.getElementById('langDropdown');

  if (langToggle && langDropdown) {
    langToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      langDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      langDropdown.classList.remove('show');
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        if (window.VortexI18n) {
          window.VortexI18n.setLanguage(lang);
        }
        const currentLabel = document.getElementById('currentLangLabel');
        if (currentLabel) {
          currentLabel.textContent = lang.toUpperCase();
        }
        langDropdown.classList.remove('show');
      });
    });

    // Set initial label
    const initialLang = localStorage.getItem('vortex_lang') || 'en';
    const currentLabel = document.getElementById('currentLangLabel');
    if (currentLabel) {
      currentLabel.textContent = initialLang.toUpperCase();
    }
  }

  // 2. Mobile Menu Toggle
  const menuBtn = document.getElementById('menuBtn');
  const mobileNav = document.getElementById('mobileNav');

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      const isOpen = mobileNav.classList.contains('open');
      menuBtn.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });
  }

  // 3. Header Scroll Effect
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

  // 4. Header Credits Auto-Sync
  function updateHeaderCredits() {
    const el = document.getElementById('headerCr');
    if (el && window.VortexCredits) {
      const w = VortexCredits.load();
      el.innerText = w.credits || 0;
    }
  }

  updateHeaderCredits();
  window.addEventListener('vortex-credits', updateHeaderCredits);

  // 5. Scroll Reveal Animations
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
  revealOnScroll();

  // 6. Canvas Minecraft / Vortex Particle Simulation
  const canvas = document.getElementById('vortex-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.angle = Math.random() * Math.PI * 2;
        this.radius = Math.random() * (width > height ? width : height);
        this.speed = (Math.random() * 0.004) + 0.001;
        this.size = Math.random() * 2.5 + 0.5;
        // Flame / Vortex Red-Orange-Cyan spectrum
        const choices = [0, 15, 30, 180, 350];
        this.hue = choices[Math.floor(Math.random() * choices.length)];
      }
      update() {
        this.angle -= this.speed;
        this.radius -= this.radius * 0.004;
        if (this.radius < 2) this.reset();
      }
      draw() {
        const x = width / 2 + Math.cos(this.angle) * this.radius;
        const y = height / 2 + Math.sin(this.angle) * this.radius;
        ctx.beginPath();
        ctx.arc(x, y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 100%, 65%, 0.8)`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${this.hue}, 100%, 50%)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < 400; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.fillStyle = 'rgba(5, 6, 10, 0.18)';
      ctx.fillRect(0, 0, width, height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animate);
    }
    animate();
  }

  // 7. Vanilla Tilt Init
  if (typeof VanillaTilt !== 'undefined') {
    VanillaTilt.init(document.querySelectorAll("[data-tilt]"), {
      max: 12,
      speed: 400,
      glare: true,
      "max-glare": 0.2,
      scale: 1.03
    });
  }
});
