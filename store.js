/* VORTEX Store — real catalog (cosmetics-store.js), real credits purchase via bot. */
(function () {
  var CATALOG = [];
  try {
    if (typeof COSMETICS_STORE !== 'undefined' && COSMETICS_STORE && COSMETICS_STORE.items) {
      CATALOG = COSMETICS_STORE.items;
    }
  } catch (e) {}
  var CATS = [
    { id: 'wings', name: 'Wings' },
    { id: 'cloaks', name: 'Cloaks' },
    { id: 'headwear', name: 'Headwear' },
    { id: 'pets', name: 'Pets' },
    { id: 'auras', name: 'Auras' },
    { id: 'bundles', name: 'Bundles' }
  ];
  var RARITY_COL = { Common: '#9CA3AF', Rare: '#38BDF8', Epic: '#C084FC', Legendary: '#FB923C', Mythic: '#F472B6' };

  function botBase() {
    try {
      var b = window.VORTEX_BOT_URL || localStorage.getItem('vortex_bot_url') || '';
      return String(b || '').replace(/\/$/, '');
    } catch (e) { return ''; }
  }
  function mcName() {
    try { return localStorage.getItem('vortex_mc') || ''; } catch (e) { return ''; }
  }
  function setMcName(v) {
    try { localStorage.setItem('vortex_mc', v); } catch (e) {}
  }
  function favs() {
    try { return JSON.parse(localStorage.getItem('vortex_favs') || '[]'); } catch (e) { return []; }
  }
  function toggleFav(id) {
    try {
      var f = favs();
      var i = f.indexOf(id);
      if (i >= 0) f.splice(i, 1);
      else f.push(id);
      localStorage.setItem('vortex_favs', JSON.stringify(f));
    } catch (e) {}
  }
  var ownedCache = {};
  var ownedAt = 0;

  function toast(msg, ok) {
    try {
      var t = document.getElementById('storeToast');
      if (!t) {
        t = document.createElement('div');
        t.id = 'storeToast';
        t.className = 'store-toast';
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.className = 'store-toast show ' + (ok === false ? 'err' : 'ok');
      clearTimeout(t._tm);
      t._tm = setTimeout(function () { t.className = 'store-toast'; }, 4200);
    } catch (e) {}
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function card(p) {
    var owned = !!ownedCache[p.id];
    var fav = favs().indexOf(p.id) >= 0;
    var rcol = RARITY_COL[p.rarity] || '#9CA3AF';
    var badge = '<span class="prod-badge" style="border-color:' + rcol + ';color:' + rcol + '">' + esc(p.rarity) + '</span>';
    if (owned) badge += '<span class="prod-badge owned">OWNED</span>';
    var contents = '';
    if (p.outfit) {
      var parts = [];
      for (var k in p.outfit) parts.push(p.outfit[k]);
      contents = '<div class="prod-contents">' + parts.map(esc).join(' + ') + '</div>';
    }
    return '' +
      '<div class="prod" data-id="' + esc(p.id) + '">' +
      '<button class="prod-fav' + (fav ? ' on' : '') + '" data-fav="' + esc(p.id) + '" title="Favorite">★</button>' +
      '<div class="prod-img" data-view="' + esc(p.id) + '"><img src="cosmetics/' + esc(p.id) + '.png" alt="' + esc(p.name) + '" loading="lazy">' + badge + '</div>' +
      '<div class="prod-info"><b data-view="' + esc(p.id) + '">' + esc(p.name) + '</b>' +
      '<div class="prod-cat">' + esc(p.cat) + '</div>' + contents +
      '<div class="prod-price">' + Number(p.price || 0).toLocaleString() + ' coins</div>' +
      (owned
        ? '<button class="btn btn-secondary sm" disabled>OWNED</button>'
        : '<button class="btn btn-primary sm" data-buy="' + esc(p.id) + '">Buy</button>') +
      '</div></div>';
  }

  function section(catId, title, items) {
    if (!items.length) return '';
    return '<section class="wrap store-sec" id="sec-' + catId + '"><div class="sec-head"><h2>' + esc(title) + '</h2><span>' +
      items.length + ' items</span></div><div class="prod-grid">' +
      items.map(card).join('') + '</div></section>';
  }

  function renderCatalog() {
    var host = document.getElementById('storeCatalog');
    if (!host) return;
    var html = '';
    var myth = CATALOG.filter(function (p) { return p.rarity === 'Mythic' || p.rarity === 'Legendary'; }).slice(0, 8);
    if (myth.length) html += section('featured', 'Featured', myth);
    CATS.forEach(function (c) {
      html += section(c.id, c.name.charAt(0).toUpperCase() + c.name.slice(1), CATALOG.filter(function (p) { return p.cat === c.id; }));
    });
    var favIds = favs();
    var favItems = CATALOG.filter(function (p) { return favIds.indexOf(p.id) >= 0; });
    if (favItems.length) html = section('favorites', 'Favorites', favItems) + html;
    host.innerHTML = html;
  }

  function openDetail(id) {
    var p = null;
    for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].id === id) p = CATALOG[i];
    if (!p) return;
    var owned = !!ownedCache[p.id];
    var rcol = RARITY_COL[p.rarity] || '#9CA3AF';
    var contents = '';
    if (p.outfit) {
      var parts = [];
      for (var k in p.outfit) parts.push('<li><b>' + esc(k) + '</b> — ' + esc(p.outfit[k]) + '</li>');
      contents = '<div class="detail-contents"><b>Bundle contents</b><ul>' + parts.join('') + '</ul></div>';
    }
    var m = document.getElementById('storeModal');
    if (!m) {
      m = document.createElement('div');
      m.id = 'storeModal';
      m.className = 'store-modal';
      document.body.appendChild(m);
    }
    m.innerHTML = '<div class="store-modal-box">' +
      '<button class="store-modal-x" id="storeModalX">✕</button>' +
      '<img class="detail-img" src="cosmetics/' + esc(p.id) + '.png" alt="' + esc(p.name) + '">' +
      '<h2>' + esc(p.name) + '</h2>' +
      '<div class="detail-meta"><span style="color:' + rcol + '">' + esc(p.rarity) + '</span> · ' + esc(p.cat) + '</div>' +
      '<p class="detail-desc">' + esc(p.desc || 'A Vortex cosmetic, rendered live in game.') + '</p>' + contents +
      '<div class="detail-price">' + Number(p.price || 0).toLocaleString() + ' coins</div>' +
      (owned ? '<button class="btn btn-secondary" disabled>OWNED — find it in your Vault</button>'
        : '<button class="btn btn-primary" data-buy="' + esc(p.id) + '">BUY NOW</button>') +
      '</div>';
    m.classList.add('open');
    var x = document.getElementById('storeModalX');
    if (x) x.onclick = function () { m.classList.remove('open'); };
    m.onclick = function (e) { if (e.target === m) m.classList.remove('open'); };
  }

  function refreshOwned(cb) {
    var mc = mcName();
    var base = botBase();
    if (!mc || !base) { if (cb) cb(); return; }
    fetch(base + '/api/cosmetics/owned?mc=' + encodeURIComponent(mc) + '&uuid=', { method: 'GET' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        ownedCache = {};
        var list = (d && d.ok && d.owned) ? d.owned : [];
        // beta: every catalog item is equippable locally; server truth still marks real ownership
        list.forEach(function (id) { ownedCache[id] = true; });
        ownedAt = Date.now();
        renderCatalog();
        if (cb) cb();
      })
      .catch(function () { if (cb) cb(); });
  }

  function buyFlow(id) {
    var p = null;
    for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].id === id) p = CATALOG[i];
    if (!p) return;
    if (ownedCache[id]) { toast(p.name + ' is already owned.', true); return; }
    var base = botBase();
    var mc = mcName();
    if (!base) {
      var nb = prompt('Bot API URL (same as launcher Settings, e.g. http://127.0.0.1:8080):', '');
      if (!nb) return;
      try { localStorage.setItem('vortex_bot_url', String(nb).replace(/\/$/, '')); } catch (e) {}
      base = botBase();
    }
    if (!mc) {
      mc = prompt('Minecraft username (must match your linked account):', '') || '';
      mc = mc.trim();
      if (!/^[A-Za-z0-9_]{3,16}$/.test(mc)) { toast('Enter a valid Minecraft username.', false); return; }
      setMcName(mc);
    }
    fetch(base + '/api/store/order', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mc: mc, id: id })
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.ok) { toast((d && d.error) || 'Order failed.', false); return; }
        var m = document.getElementById('storeModal');
        if (!m) { m = document.createElement('div'); m.id = 'storeModal'; m.className = 'store-modal'; document.body.appendChild(m); }
        m.innerHTML = '<div class="store-modal-box">' +
          '<button class="store-modal-x" id="storeModalX">✕</button>' +
          '<h2>Complete purchase</h2>' +
          '<p class="detail-desc">' + esc(p.name) + ' — <b>' + Number(d.price).toLocaleString() + ' coins</b></p>' +
          '<div class="order-code">' + esc(d.code) + '</div>' +
          '<p class="detail-desc">In Discord, run:<br><b>/claim ' + esc(d.code) + '</b><br>Coins leave your balance only there. Code expires in 5 minutes.</p>' +
          '<button class="btn btn-secondary" id="orderDone">Done</button></div>';
        m.classList.add('open');
        document.getElementById('storeModalX').onclick = function () { m.classList.remove('open'); refreshOwned(); };
        document.getElementById('orderDone').onclick = function () { m.classList.remove('open'); refreshOwned(); };
        toast('Order created — claim it in Discord.', true);
      })
      .catch(function () { toast('Bot unreachable. Check the Bot API URL.', false); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderCatalog();
    refreshOwned();
    document.body.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.getAttribute) return;
      var fav = t.getAttribute('data-fav');
      if (fav) { toggleFav(fav); renderCatalog(); return; }
      var view = t.getAttribute('data-view');
      if (view) { openDetail(view); return; }
      var buy = t.getAttribute('data-buy');
      if (buy) { buyFlow(buy); return; }
    });
  });
})();
