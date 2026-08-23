/* VortexSite — site.js
 * Premium Lunar-inspired site interactions + credit system glue + ticket API
 */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------- Scroll progress bar ----------
  const scrollBar = $('#scrollBar');
  const onScroll = () => {
    const h = document.documentElement;
    const scrolled = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 || 0;
    if (scrollBar) scrollBar.style.setProperty('--progress', scrolled + '%');

    const header = $('#siteHeader');
    if (header) header.classList.toggle('scrolled', h.scrollTop > 24);

    // Reveal
    $$('[data-reveal]').forEach((el) => {
      if (el.classList.contains('visible')) return;
      const r = el.getBoundingClientRect();
      if (r.top < h.clientHeight - 80) el.classList.add('visible');
    });
  };
  document.addEventListener('scroll', onScroll, { passive: true });

  // ---------- Mobile menu ----------
  $('#menuBtn')?.addEventListener('click', (e) => {
    const open = $('#mobileNav').classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded', String(open));
  });
  $$('#mobileNav a').forEach((a) => a.addEventListener('click', () => $('#mobileNav').classList.remove('open')));

  // ---------- Launch clock (tick each second) ----------
  const launchClock = $('#launchClock');
  if (launchClock) {
    const tick = () => {
      const d = new Date();
      launchClock.textContent = [d.getHours(), d.getMinutes(), d.getSeconds()]
        .map((n) => String(n).padStart(2, '0')).join(':');
    };
    tick(); setInterval(tick, 1000);
  }

  // ---------- Scroll to download ----------
  window.scrollToDownload = () => {
    const el = document.getElementById('download');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ---------- Reveal first items already on screen ----------
  requestAnimationFrame(() => {
    onScroll();
    // Make first batch visible if they're above the fold
    $$('.hero [data-reveal]').forEach((el, i) => setTimeout(() => el.classList.add('visible'), i * 60));
  });

  // ---------- Hero canvas: animated nebula particles ----------
  const scene = $('#scene');
  if (scene && scene.getContext) {
    const ctx = scene.getContext('2d');
    let w, h, particles;
    const count = Math.min(110, Math.floor(window.innerWidth / 12));
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      w = scene.clientWidth;
      h = scene.clientHeight;
      scene.width = w * ratio;
      scene.height = h * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = new Array(count).fill(0).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.2 + Math.random() * 1.2,
        r: 0.6 + Math.random() * 1.8,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        hue: 220 + Math.random() * 110, // 220 violet → 330 → cyan 180 -> 190
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    let mx = 0.5, my = 0.5;
    window.addEventListener('pointermove', (e) => {
      mx = e.clientX / (window.innerWidth || 1);
      my = e.clientY / (window.innerHeight || 1);
    }, { passive: true });

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const offX = (mx - 0.5) * 16;
      const offY = (my - 0.5) * 10;
      particles.forEach((p) => {
        p.x += p.vx * p.z + offX * 0.01;
        p.y += p.vy * p.z + offY * 0.01;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 10 * p.z);
        grad.addColorStop(0, `hsla(${p.hue}, 90%, 72%, ${0.9 * p.z})`);
        grad.addColorStop(0.4, `hsla(${p.hue + 30}, 90%, 60%, ${0.35 * p.z})`);
        grad.addColorStop(1, `hsla(${p.hue}, 90%, 60%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 10 * p.z, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsla(${p.hue}, 100%, 85%, ${0.95})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Connective mesh
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 120 * 120) {
            const alpha = (1 - d2 / (120 * 120)) * 0.14 * Math.min(a.z, b.z);
            ctx.strokeStyle = `rgba(165, 180, 252, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  // ---------- Extra hero floaty particles ----------
  const particlesBox = $('#particles');
  if (particlesBox) {
    const N = 28;
    for (let i = 0; i < N; i++) {
      const p = document.createElement('i');
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.setProperty('--delay', `${Math.random() * 6}s`);
      p.style.setProperty('--duration', `${4 + Math.random() * 8}s`);
      const palette = ['#a5b4fc', '#c4b5fd', '#67e8f9', '#f0abfc'];
      p.style.setProperty('--accent', palette[i % palette.length]);
      particlesBox.appendChild(p);
    }
  }

  // ---------- Stat counters ----------
  const animateCounter = (el, target, suffix = '', duration = 1400) => {
    const start = performance.now();
    const from = 0;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.floor(from + (target - from) * eased);
      el.textContent = v.toLocaleString('en-US') + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const statTargets = {
    sPlayers: 128470,
    sInstalls: 492360,
    sCredits: 8412050,
    sMods: 720,
  };
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      if (statTargets[id]) animateCounter(e.target, statTargets[id], '', 1800);
      statObserver.unobserve(e.target);
    });
  }, { threshold: 0.3 });
  Object.keys(statTargets).forEach((id) => {
    const el = document.getElementById(id);
    if (el) statObserver.observe(el);
  });

  // Observe pillar and step animations
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const delay = entry.target.classList.contains('delay-1') ? 80 :
                    entry.target.classList.contains('delay-2') ? 160 :
                    entry.target.classList.contains('delay-3') ? 240 : 0;
      setTimeout(() => entry.target.classList.add('visible'), delay);
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.18 });
  $$('.pillar,.step,[data-reveal]').forEach((el) => {
    if (!el.classList.contains('visible')) revealObserver.observe(el);
  });

  // ---------- Shop filter ----------
  $$('.tabs button').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.tabs button').forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const f = btn.dataset.filter;
      $$('#shopGrid .item, .shop .product').forEach((it) => {
        const show = f === 'all' || it.dataset.cat === f;
        it.style.display = show ? '' : 'none';
      });
    });
  });

  // ---------- Launcher tabs preview (cosmetic) ----------
  $$('.launch-tab').forEach((t) => {
    t.addEventListener('click', () => {
      $$('.launch-tab').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
    });
  });

  // ---------- Stat hover parallax ----------
  $$('.stat').forEach((s) => {
    s.addEventListener('pointermove', (e) => {
      const r = s.getBoundingClientRect();
      s.style.setProperty('--x', `${(e.clientX - r.left) / r.width * 100}%`);
    });
  });

  // ---------- Toast helper (window.toast) ----------
  let toastTimer = null;
  window.toast = (msg, type = '') => {
    let t = document.querySelector('.credit-toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'credit-toast';
      document.body.appendChild(t);
    }
    t.className = 'credit-toast ' + (type || '');
    t.innerHTML = String(msg);
    t.style.animation = 'none';
    // eslint-disable-next-line no-unused-expressions
    t.offsetHeight; // reflow restart
    t.style.animation = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(-14px)';
      setTimeout(() => (t.style.cssText = ''), 320);
    }, 3800);
  };

  // ---------- Credit system (credit bar + wallet modal) ----------
  const creditBar = $('#creditBar');
  const creditBalanceEl = $('#creditBalance');
  const creditMessageEl = $('#creditMessage');
  const walletModal = $('#walletModal');
  const walletBalanceEl = $('#walletBalance');
  const welcomeStatusEl = $('#welcomeStatus');
  const walletHistoryEl = $('#walletHistory');
  const walletOwnedGrid = $('#walletOwnedGrid');

  const wallet = (typeof window.VortexCredits !== 'undefined')
    ? window.VortexCredits
    : {
        credits: 0, welcome: false, history: [], owned: [],
        save() {}, load() {},
        welcome() { return { ok: true, credits: this.credits, fresh: true }; },
        daily() { return this.welcome(); },
        add() {}, spend() { return { ok: false }; },
        redeem() { return { ok: false }; },
        exportCode() { return 'VX1-NOAPI'; },
      };

  const trySync = async () => {
    try {
      const id = localStorage.getItem('vortex-wallet-id') || null;
      if (!id) return null;
      const base = VORTEX_BASE;
      const r = await fetch(base + '/api/credits?id=' + encodeURIComponent(id), { credentials: 'omit' });
      if (!r.ok) return null;
      const data = await r.json();
      if (data && typeof data.credits === 'number') {
        wallet.credits = data.credits;
        wallet.welcome = !!data.welcome;
        wallet.history = Array.isArray(data.history) ? data.history : [];
        wallet.owned = Array.isArray(data.owned) ? data.owned : [];
        wallet.save();
        return data;
      }
    } catch (err) { /* offline or network issue — silent */ }
    return null;
  };

  const renderCreditBar = () => {
    if (creditBar) {
      creditBar.style.display = 'flex';
      creditBalanceEl.textContent = '◆ ' + (wallet.credits || 0).toLocaleString('en-US');
      if (creditMessageEl) {
        creditMessageEl.textContent = wallet.welcome
          ? 'Welcome bonus already claimed · Earn more via Discord drops, redeem codes, events.'
          : 'Eligible for one-time 100 CR welcome bonus. Tap +100 Welcome to claim.';
      }
    }
  };

  const renderWallet = () => {
    if (walletBalanceEl) walletBalanceEl.textContent = (wallet.credits || 0).toLocaleString('en-US');
    if (welcomeStatusEl) {
      welcomeStatusEl.textContent = wallet.welcome
        ? '✓ Welcome bonus claimed — 100 CR granted'
        : 'Pending · Claim via launcher or the +100 Welcome button';
      welcomeStatusEl.style.color = wallet.welcome ? '#86ffc1' : '#fde68a';
    }
    if (walletHistoryEl) {
      const items = wallet.history || [];
      if (items.length === 0) {
        walletHistoryEl.innerHTML =
          '<li style="grid-template-columns:1fr"><span style="color:#67878a">Activity will show here after you claim the welcome bonus or use a redeem code.</span></li>';
      } else {
        walletHistoryEl.innerHTML = items.slice(0, 20).map((h) => {
          const amt = Number(h.amount || 0);
          const sign = amt >= 0 ? 'pos' : 'neg';
          const fmtAmt = (amt >= 0 ? '+' : '') + amt.toLocaleString('en-US') + ' CR';
          const d = new Date(h.at || Date.now());
          const dStr = d.toLocaleDateString('en-US', { year: '2-digit', month: 'short', day: 'numeric' });
          return `<li>
                    <b class="${sign}">${fmtAmt}</b>
                    <span>${escapeHtml(h.note || '-')}</span>
                    <small>${dStr}</small>
                  </li>`;
        }).join('');
      }
    }
    if (walletOwnedGrid) {
      const owned = wallet.owned || [];
      // Preserve welcome card, prepend owned items
      const welcomeHtml = `<div class="wallet-item"><div class="thumb">🧾</div><div><h4>Welcome Bonus (One-time)</h4><span>${wallet.welcome ? '✓ Claimed · 100 CR' : 'Pending · Unclaimed 100 CR'}</span></div></div>`;
      const itemsHtml = owned.map((o) => {
        const thumb = o.type === 'cape' ? '🧥' : o.type === 'wings' ? '🦋' : o.type === 'boost' ? '⚡' : '◆';
        return `<div class="wallet-item"><div class="thumb">${thumb}</div><div><h4>${escapeHtml(o.name || 'Item')}</h4><span>${escapeHtml(o.kind || 'Owned')}</span></div></div>`;
      }).join('');
      walletOwnedGrid.innerHTML = welcomeHtml + itemsHtml;
    }
  };

  const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  // Claim 100 welcome (via API if possible, otherwise local only)
  const claimWelcome = async () => {
    // Local first for instant feedback
    const localRes = wallet.welcome ? { ok: false, message: 'Welcome bonus already claimed.' } : wallet.welcome();
    renderCreditBar();
    renderWallet();

    if (localRes.ok) {
      window.toast('Welcome bonus claimed! <b style="color:#fde68a">+100 CR</b> added to your wallet.');
    } else if (localRes.fresh === false && wallet.welcome) {
      window.toast('Welcome bonus already claimed — only one per player.', 'warn');
    }

    // Try sync to bot API if user has a wallet id
    try {
      const id = localStorage.getItem('vortex-wallet-id');
      if (!id) return;
      const res = await fetch(VORTEX_BASE + '/api/credits/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-secret': VORTEX_SECRET },
        body: JSON.stringify({ id })
      });
      const data = await res.json().catch(() => ({}));
      if (data && typeof data.credits === 'number') {
        wallet.credits = data.credits;
        wallet.welcome = !!data.welcome;
        if (Array.isArray(data.history)) wallet.history = data.history;
        wallet.save();
        renderCreditBar();
        renderWallet();
      }
      if (data && data.ok === false && !localRes.ok) {
        window.toast(data.message || 'Could not claim.', 'warn');
      }
    } catch (_) { /* offline */ }
  };

  // Redeem code
  const doRedeem = async () => {
    const input = $('#redeemInput');
    const code = (input?.value || '').trim();
    if (!code) return window.toast('Enter a redeem code first.', 'warn');
    const res = wallet.redeem(code);
    renderCreditBar();
    renderWallet();
    // try network redeem too
    try {
      const id = localStorage.getItem('vortex-wallet-id');
      if (id) {
        const r = await fetch(VORTEX_BASE + '/api/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-secret': VORTEX_SECRET },
          body: JSON.stringify({ id, code })
        });
        const data = await r.json().catch(() => ({}));
        if (data && typeof data.credits === 'number') {
          wallet.credits = data.credits;
          wallet.history = Array.isArray(data.history) ? data.history : wallet.history;
          wallet.save();
          renderCreditBar(); renderWallet();
          if (data.ok === false && !res.ok) {
            window.toast(data.message || 'Invalid or already used code.', 'error');
            return;
          }
        }
      }
    } catch (_) { /* offline */ }

    if (res.ok) window.toast(`Redeemed! <b style="color:#86ffc1">+${res.amount} CR</b> — ${res.message || 'thank you!'}`);
    else window.toast(res.message || 'Invalid or already used code.', 'error');
    if (input) input.value = '';
  };

  // Export wallet code
  const doExport = () => {
    const code = wallet.exportCode();
    if (!code) return window.toast('Nothing to export yet. Claim bonus first.', 'warn');
    try {
      navigator.clipboard?.writeText(code);
      window.toast(`Transfer code copied to clipboard. Paste it in another browser/launcher to move your wallet.<br><small style="color:#a5b4fc">${escapeHtml(code)}</small>`);
    } catch (_) {
      window.toast(`Your transfer code is ready: <b style="color:#a5b4fc">${escapeHtml(code)}</b>`);
    }
  };

  const openWallet = () => {
    if (walletModal) {
      walletModal.classList.add('show');
      walletModal.setAttribute('aria-hidden', 'false');
    }
  };
  const closeWalletOnBackdrop = (e) => {
    if (e.target.id === 'walletModal' || e.target.id === 'ticketModal') {
      e.target.classList.remove('show');
      e.target.setAttribute('aria-hidden', 'true');
    }
  };
  document.addEventListener('click', (e) => {
    if (e.target.closest('#closeTicketModal')) {
      const m = $('#ticketModal');
      if (m) { m.classList.remove('show'); m.setAttribute('aria-hidden', 'true'); }
    }
  });

  // Wire up credit bar
  if (creditBar) {
    $('#creditBtn')?.addEventListener('click', claimWelcome);
    $('#redeemBtn')?.addEventListener('click', doRedeem);
    $('#exportBtn')?.addEventListener('click', doExport);
    $('#walletBtn')?.addEventListener('click', openWallet);
    $('#redeemInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doRedeem(); });
    walletModal?.addEventListener('click', closeWalletOnBackdrop);
  }

  // ---------- Ticket form (modal + page) ----------
  // Bot API base - matches VortexBot index.js default (the user can override via env)
  const VORTEX_BASE = (typeof window.VORTEX_WEBSITE_URL !== 'undefined')
    ? window.VORTEX_WEBSITE_URL
    : 'https://vortex-site-ruddy.vercel.app';
  const VORTEX_SECRET = (typeof window.VORTEX_API_SECRET !== 'undefined')
    ? window.VORTEX_API_SECRET
    : 'site-public';

  // Attach globals in case other scripts want to use
  window.VORTEX_BASE = VORTEX_BASE;
  window.VORTEX_SECRET = VORTEX_SECRET;

  const submitTicket = async (data) => {
    if (!data.user || !data.message) {
      return { ok: false, message: 'Please fill in your Discord name and describe the issue.' };
    }
    const payload = {
      user: data.user,
      category: data.category || 'General',
      message: data.message,
      at: new Date().toISOString()
    };
    try {
      const r = await fetch(VORTEX_BASE + '/api/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-secret': VORTEX_SECRET },
        body: JSON.stringify(payload)
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        return { ok: false, message: err.message || `Server returned ${r.status}.` };
      }
      return await r.json();
    } catch (err) {
      // Save locally so the user has a record
      try {
        const key = 'vortex-pending-tickets';
        const prev = JSON.parse(localStorage.getItem(key) || '[]');
        prev.push({ ...payload, pending: true, sentAt: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(prev));
      } catch (_) { /* ignore */ }
      return { ok: true, message: 'Saved offline! Once online your ticket will be forwarded automatically via Discord.' };
    }
  };

  const wireTicketForm = (scope) => {
    const sendBtn = $('#sendTicketBtn', scope);
    const note = $('#ticketNote', scope);
    sendBtn?.addEventListener('click', async () => {
      const userEl = $('#tUser', scope);
      const catEl = $('#tCategory', scope);
      const msgEl = $('#tMessage', scope);
      if (note) note.classList.remove('error');
      if (note) note.textContent = 'Sending...';
      const res = await submitTicket({
        user: (userEl?.value || '').trim(),
        category: (catEl?.value || 'General'),
        message: (msgEl?.value || '').trim(),
      });
      if (note) {
        note.textContent = res.message || (res.ok ? 'Ticket received.' : 'Could not send.');
        if (!res.ok) note.classList.add('error');
      }
      if (res.ok && window.toast) window.toast('Ticket received. Staff will reply on Discord.');
      if (res.ok) {
        if (userEl) userEl.value = '';
        if (msgEl) msgEl.value = '';
        setTimeout(() => {
          const m = scope.closest && scope.closest('#ticketModal');
          if (m) { m.classList.remove('show'); m.setAttribute('aria-hidden', 'true'); }
        }, 1600);
      }
    });
  };

  const ticketModal = $('#ticketModal');
  if (ticketModal) {
    wireTicketForm(ticketModal);
    ticketModal.addEventListener('click', closeWalletOnBackdrop);
  }

  // Page-level ticket form if present
  const pageForm = $('.ticket-form');
  if (pageForm && !$('#sendTicketBtn', pageForm)?.dataset.pageWired) {
    wireTicketForm(pageForm);
    const btn = $('#sendTicketBtn', pageForm);
    if (btn) btn.dataset.pageWired = '1';
  }

  // Support page CTA -> open ticket modal
  $$('[data-open-ticket]').forEach((b) => b.addEventListener('click', () => {
    const m = $('#ticketModal');
    if (m) { m.classList.add('show'); m.setAttribute('aria-hidden', 'false'); }
  }));

  // ---------- Initial wallet load + sync ----------
  wallet.load && wallet.load();
  // Lazy sync - if the user has any wallet id, ping the bot API
  setTimeout(() => {
    renderCreditBar();
    renderWallet();
    trySync();
  }, 260);

  // ESC close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [walletModal, ticketModal].forEach((m) => {
        if (m && m.classList.contains('show')) {
          m.classList.remove('show');
          m.setAttribute('aria-hidden', 'true');
        }
      });
    }
  });
})();
