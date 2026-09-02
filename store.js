/* VORTEX — premium cosmetics store (Lunar-style, original catalog) */
(function () {
  const CATALOG = [
    { id: 'cape_quantum', name: 'Quantum Cape', cat: 'cape', rarity: 'epic', price: 500, icon: 'fa-solid fa-feather', desc: 'An iridescent cape that shifts hue with your movement.' },
    { id: 'cape_void', name: 'Voidwalker Cape', cat: 'cape', rarity: 'legendary', price: 1500, icon: 'fa-solid fa-cloud', desc: 'A near-black cape that drinks the light around it.' },
    { id: 'cape_crimson', name: 'Crimson Cloak', cat: 'cape', rarity: 'rare', price: 750, icon: 'fa-solid fa-hand-fist', desc: 'Deep red cloak, cut for arena fighting.' },
    { id: 'cape_aurora', name: 'Aurora Mantle', cat: 'cape', rarity: 'legendary', price: 1800, icon: 'fa-solid fa-mountain-sun', desc: 'A flowing northern-lights style cape.' },
    { id: 'wings_phoenix', name: 'Phoenix Wings', cat: 'wings', rarity: 'legendary', price: 2000, icon: 'fa-solid fa-dragon', desc: 'Blazing wings of an ancient fire bird.' },
    { id: 'wings_dragon', name: 'Dragon Wings', cat: 'wings', rarity: 'legendary', price: 1500, icon: 'fa-solid fa-dragon', desc: 'Scaled wings — a rare draconic cosmetic.' },
    { id: 'wings_cyber', name: 'Cyber Wings', cat: 'wings', rarity: 'epic', price: 1200, icon: 'fa-solid fa-robot', desc: 'Holographic tech wings with a neon edge.' },
    { id: 'wings_angel', name: 'Seraph Wings', cat: 'wings', rarity: 'epic', price: 1100, icon: 'fa-solid fa-angles-up', desc: 'Soft white wings for a celestial look.' },
    { id: 'trail_flame', name: 'Ember Trail', cat: 'trail', rarity: 'common', price: 300, icon: 'fa-solid fa-fire', desc: 'Sparks the size of embers follow your steps.' },
    { id: 'trail_storm', name: 'Storm Trail', cat: 'trail', rarity: 'rare', price: 650, icon: 'fa-solid fa-cloud-bolt', desc: 'Crackling arcs of lightning trail behind you.' },
    { id: 'trail_snow', name: 'Frost Trail', cat: 'trail', rarity: 'common', price: 250, icon: 'fa-solid fa-snowflake', desc: 'Cool flurries gather where you walk.' },
    { id: 'trail_heart', name: 'Heart Trail', cat: 'trail', rarity: 'epic', price: 900, icon: 'fa-solid fa-heart', desc: 'Floating hearts drift from your stride.' },
    { id: 'aura_plasma', name: 'Plasma Halo', cat: 'aura', rarity: 'epic', price: 750, icon: 'fa-solid fa-circle-half-stroke', desc: 'A glowing halo of plasma orbits your head.' },
    { id: 'aura_ember', name: 'Ember Aura', cat: 'aura', rarity: 'rare', price: 600, icon: 'fa-solid fa-fire', desc: 'Soft embers circle your body.' },
    { id: 'aura_galaxy', name: 'Galaxy Aura', cat: 'aura', rarity: 'legendary', price: 1600, icon: 'fa-solid fa-meteor', desc: 'A slow-turning swirl of stars.' },
    { id: 'emote_dab', name: 'Dab Emote', cat: 'emote', rarity: 'common', price: 200, icon: 'fa-solid fa-hands', desc: 'A quick dab you can play in lobby.' },
    { id: 'emote_salute', name: 'Salute Emote', cat: 'emote', rarity: 'common', price: 200, icon: 'fa-solid fa-hand', desc: 'Salute your opponents before a duel.' },
    { id: 'emote_gg', name: 'GG Emote', cat: 'emote', rarity: 'rare', price: 450, icon: 'fa-solid fa-star', desc: 'A spinning GG badge emote.' }
  ];
  const RARITY = { common: 0, rare: 1, epic: 2, legendary: 3 };
  const RCOL = { common: '#9aa7b0', rare: '#3ea6ff', epic: '#c084fc', legendary: '#ffc94d' };
  const CTYPE = { cape: 'Cape', wings: 'Wings', trail: 'Trail', aura: 'Aura', emote: 'Emote' };

  let wallet = { credits: 0, owned: [], loggedIn: false };
  const API = (window.VERTEX_API || '');

  function fmt(n) { return Number(n || 0).toLocaleString(); }

  function readWallet() {
    // Prefer real wallet from the server; fall back to local demo wallet if present.
    fetch((API || '') + '/api/credits-balance').then(r => r.json()).then((d) => {
      if (d && d.ok) {
        wallet = { credits: Number(d.credits || 0), owned: d.owned || [], loggedIn: true };
        syncHeader();
        renderActive();
      }
    }).catch(() => {
      try {
        if (window.VortexCredits && typeof window.VortexCredits.load === 'function') {
          wallet = Object.assign({ credits: 0, owned: [], loggedIn: false }, window.VortexCredits.load());
          syncHeader();
          renderActive();
        }
      } catch (_) {}
    });
  }

  function syncHeader() {
    const el = document.querySelector('[data-credit]');
    if (el) el.textContent = fmt(wallet.credits);
  }

  function ownedSet() { return new Set(wallet.owned || []); }

  let _filters = { cat: 'all', rarity: 'all', sort: 'price' };
  function activeCat() { return _filters.cat; }
  function renderActive() { render(_filters.cat, _filters.rarity, _filters.sort); }

  function render(cat, rarity, sort) {
    const grid = document.getElementById('storeGrid');
    if (!grid) return;
    let items = CATALOG.slice();
    if (cat && cat !== 'all') items = items.filter(i => i.cat === cat);
    if (rarity && rarity !== 'all') items = items.filter(i => i.rarity === rarity);
    if (sort === 'price') items.sort((a, b) => a.price - b.price);
    else if (sort === 'rarity') items.sort((a, b) => RARITY[b.rarity] - RARITY[a.rarity]);
    else items.sort((a, b) => a.name.localeCompare(b.name));
    const owned = ownedSet();
    if (!items.length) {
      grid.innerHTML = '<p style="grid-column:1/-1;color:var(--muted);text-align:center;padding:30px;">No cosmetics in this filter yet.</p>';
      return;
    }
    grid.innerHTML = items.map(i => {
      const mine = owned.has(i.id);
      const afford = wallet.credits >= i.price;
      return `
      <div class="cosm" data-id="${i.id}" style="--rc:${RCOL[i.rarity]};">
        <div class="cosm-rarity">${i.rarity.toUpperCase()}</div>
        <div class="cosm-icon"><i class="${i.icon}"></i></div>
        <div class="cosm-type">${CTYPE[i.cat]}</div>
        <h3>${i.name}</h3>
        <p>${i.desc}</p>
        <div class="cosm-price"><i class="fa-solid fa-coins"></i> ${fmt(i.price)} CR</div>
        <button class="btn ${mine ? 'owned' : (afford ? 'btn-primary' : 'btn-disabled')}" data-buy="${i.id}" ${mine ? 'disabled' : ''}>
          ${mine ? '<i class="fa-solid fa-check"></i> Owned' : '<i class="fa-solid fa-cart-shopping"></i> Purchase'}
        </button>
      </div>`;
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', () => {
    readWallet();

    // Category tabs
    document.querySelectorAll('#storeCats .cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#storeCats .cat-btn').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        _filters.cat = btn.getAttribute('data-cat');
        renderActive();
      });
    });

    // Rarity / sort
    const rr = document.getElementById('filterRarity');
    const ss = document.getElementById('filterSort');
    if (rr) rr.addEventListener('change', () => { _filters.rarity = rr.value; renderActive(); });
    if (ss) ss.addEventListener('change', () => { _filters.sort = ss.value; renderActive(); });

    // Purchase
    document.getElementById('storeGrid').addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-buy]');
      if (!btn || btn.disabled) return;
      const id = btn.getAttribute('data-buy');
      const item = CATALOG.find(x => x.id === id);
      if (!item) return;

      if (!wallet.loggedIn) {
        flash('Sign in with Discord to buy cosmetics.', false);
        const login = document.getElementById('storeLogin') || null;
        if (login) login.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      // Buy through the credits endpoint (Discord-linked wallet)
      btn.disabled = true;
      try {
        const res = await fetch((API || '') + '/api/store-buy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: id })
        });
        const data = await res.json();
        if (data && data.ok) {
          wallet.credits = data.credits;
          wallet.owned = data.owned || wallet.owned;
          syncHeader();
          renderActive();
          flash(`Unlocked ${item.name}! 🎉`, true);
        } else {
          flash((data && data.message) || 'Purchase failed.', false);
          btn.disabled = false;
        }
      } catch (_) {
        flash('Could not reach the purchase service.', false);
        btn.disabled = false;
      }
    });

    renderActive();
  });

  function flash(msg, ok) {
    const toast = document.createElement('div');
    toast.className = 'store-toast ' + (ok ? 'ok' : 'no');
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 2600);
  }
})();
