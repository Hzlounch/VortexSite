/* VORTEX — Lunar-style cosmetics store with real product catalog */
(function () {
  // cost in TRY + coin equivalent, mirroring Lunar's pricing structure
  const TRY = (r) => ({ tryl: r, coins: Math.round(r / 0.508) });
  const PRODUCTS = [
    { id: 'demon_wings', name: 'Demon Wings', cat: 'wings', img: 'cs-demon_wings.png', price: TRY(965.96), badge: 'Scalable' },
    { id: 'dragon_wings_black', name: 'Dragon Wings (Black)', cat: 'wings', img: 'cs-dragon_wings_black.png', price: TRY(965.96), badge: 'Scalable' },
    { id: 'solid_black_wings', name: 'Solid Black Wings', cat: 'wings', img: 'cs-solid_black_wings.png', price: TRY(965.96) },
    { id: 'neon_wings', name: 'Neon Wings', cat: 'wings', img: 'cs-neon_wings.png', price: TRY(965.96) },
    { id: 'demon_wings_red', name: 'Demon Wings (Red)', cat: 'wings', img: 'cs-demon_wings_red.png', price: TRY(965.96) },
    { id: 'angel_wings', name: 'Seraph Wings', cat: 'wings', img: 'cs-angel_wings.png', price: TRY(965.96) },
    { id: 'neon_aura', name: 'Neon Aura', cat: 'auras', img: 'cs-neon_aura.png', price: TRY(410.53) },
    { id: 'darkness_aura', name: 'Darkness Aura', cat: 'auras', img: 'cs-darkness_aura.png', price: TRY(410.53) },
    { id: 'plasma_aura', name: 'Plasma Aura', cat: 'auras', img: 'cs-plasma_aura.png', price: TRY(410.53) },
    { id: 'scuba', name: 'Scuba', cat: 'bodywear', img: 'cs-scuba.png', price: TRY(410.53), badge: 'Featured on Discord' },
    { id: 'around', name: 'Around', cat: 'bodywear', img: 'cs-around.png', price: TRY(241.49) },
    { id: 'bounty_hunter', name: 'Bounty Hunter', cat: 'headwear', img: 'cs-bounty_hunter.png', price: TRY(241.49) },
    { id: 'saxophone', name: 'Saxophone', cat: 'emotes', img: 'cs-saxophone.png', price: TRY(410.53) },
    { id: 'black_devil_horns', name: 'Black Devil Horns', cat: 'headwear', img: 'cs-black_devil_horns.png', price: TRY(410.53) },
    { id: 'twerk', name: 'Twerk', cat: 'emotes', img: 'cs-twerk.png', price: TRY(410.53) },
    { id: 'tiny_mini_me', name: 'Tiny Mini Me', cat: 'pets', img: 'cs-tiny_mini_me.png', price: TRY(965.96) },
    { id: 'ghost_pet', name: 'Ghost', cat: 'pets', img: 'cs-ghost_pet.png', price: TRY(603.72) },
    { id: 'dragon_pet', name: 'Dragon Pet', cat: 'pets', img: 'cs-dragon_pet.png', price: TRY(603.72) },
    { id: 'blackout_cloak', name: 'Blackout Cloak', cat: 'cloaks', img: 'cs-blackout_cloak.png', price: TRY(410.53) },
    { id: 'galaxy_cloak', name: 'Galaxy Cloak', cat: 'cloaks', img: 'cs-galaxy_cloak.png', price: TRY(603.72) },
    { id: 'neon_lovers', name: 'Neon Lovers', cat: 'bundles', img: 'cs-neon_lovers.png', price: TRY(603.72) },
    { id: 'golden_city', name: 'Golden City', cat: 'bundles', img: 'cs-golden_city.png', price: TRY(603.72) }
  ];
  const TRENDING = ['tiny_mini_me', 'twerk', 'solid_black_wings', 'demon_wings', 'scuba', 'dragon_wings_black', 'around', 'darkness_aura', 'saxophone', 'black_devil_horns'];
  const LATEST = ['dragon_pet', 'black_devil_horns', 'tiny_mini_me', 'neon_wings', 'neon_aura', 'bounty_hunter', 'neon_lovers', 'golden_city', 'galaxy_cloak', 'blackout_cloak'];

  const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function card(p) {
    const badge = p.badge ? `<span class="prod-badge">${p.badge}</span>` : '';
    return `
      <a class="prod" href="#${p.id}">
        <div class="prod-img"><img src="cosmetics/${p.img}" alt="${p.name}" loading="lazy">${badge}</div>
        <div class="prod-info">
          <b>${p.name}</b>
          <div class="prod-price">TRY&nbsp;${fmt(p.price.tryl)}<span>or ${p.price.coins.toLocaleString()} coins</span></div>
        </div>
      </a>`;
  }

  function fill(gridId, ids) {
    const g = document.getElementById(gridId);
    if (!g) return;
    g.innerHTML = ids.map(id => card(byId[id])).join('');
  }

  // Sync credit balance from the server (falls back to local wallet)
  function syncBalance() {
    fetch((window.VERTEX_API || '') + '/api/credits-balance').then(r => r.json()).then((d) => {
      const el = document.querySelector('[data-credit]');
      if (el && d && (d.ok || d.configured !== false)) el.textContent = Number(d.credits || 0).toLocaleString();
    }).catch(() => {
      try {
        if (window.VortexCredits && typeof window.VortexCredits.load === 'function') {
          const el = document.querySelector('[data-credit]');
          if (el) el.textContent = Number(window.VortexCredits.load().credits || 0).toLocaleString();
        }
      } catch (_) {}
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    fill('trendingGrid', TRENDING);
    fill('latestGrid', LATEST);
    syncBalance();
  });
})();
