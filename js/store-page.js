/* VORTEX Store page — loads ONLY store code (see js/catalog.js for data).
   Categories render lazily: Featured first, the rest as you scroll.
   If data/*.json cannot be fetched (file:// preview), falls back to the
   legacy cosmetics-store.js + store.js bundle. */
import { loadIndex, loadCategory, ensureLegacyShim } from './catalog.js';

(function () {
  var CATS = [
    { id: 'wings', name: 'Wings' },
    { id: 'cloaks', name: 'Cloaks' },
    { id: 'headwear', name: 'Headwear' },
    { id: 'pets', name: 'Pets' },
    { id: 'auras', name: 'Auras' },
    { id: 'bundles', name: 'Bundles' }
  ];
  var RARITY_COL = { Common: '#9CA3AF', Rare: '#38BDF8', Epic: '#C084FC', Legendary: '#FB923C', Mythic: '#F472B6' };
  var ALL = [];
  var byCat = {};

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
    var img = esc(p.img || ('cosmetics/' + p.id + '.png'));
    return '' +
      '<div class="prod" data-id="' + esc(p.id) + '">' +
      '<button class="prod-fav' + (fav ? ' on' : '') + '" data-fav="' + esc(p.id) + '" title="Favorite">★</button>' +
      '<div class="prod-img" data-view="' + esc(p.id) + '"><img src="' + img + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async" width="192" height="96">' + badge + '</div>' +
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
    return '<section class="wrap store-sec" id="' + catId + '"><div class="sec-head"><h2>' + esc(title) + '</h2><span>' +
      items.length + ' items</span></div><div class="prod-grid">' +
      items.map(card).join('') + '</div></section>';
  }

  function paint(ids) {
    var host = document.getElementById('storeCatalog');
    if (!host) return;
    var html = '';
    var favIds = favs();
    var favItems = ALL.filter(function (p) { return favIds.indexOf(p.id) >= 0; });
    if (favItems.length) html += section('favorites', 'Favorites', favItems);
    var myth = ALL.filter(function (p) { return p.rarity === 'Mythic' || p.rarity === 'Legendary'; }).slice(0, 8);
    if (myth.length) html += section('featured', 'Featured', myth);
    CATS.forEach(function (c) {
      var items = byCat[c.id];
      if (items === undefined) {
        html += '<section class="wrap store-sec" id="' + c.id + '" data-cat-shell="' + c.id + '"><div class="sec-head"><h2>' +
          esc(c.name) + '</h2><span>loading…</span></div></section>';
      } else {
        html += section(c.id, c.name.charAt(0).toUpperCase() + c.name.slice(1), items);
      }
    });
    host.innerHTML = html;
    observeShells();
  }

  function observeShells() {
    var shells;
    try {
      shells = document.querySelectorAll('[data-cat-shell]');
      if (!shells.length) return;
      if (!('IntersectionObserver' in window)) {
        shells.forEach(function (s) { fillShell(s.getAttribute('data-cat-shell')); });
        return;
      }
      if (observeShells._io) { try { observeShells._io.disconnect(); } catch (e) {} }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            io.unobserve(en.target);
            fillShell(en.target.getAttribute('data-cat-shell'));
          }
        });
      }, { rootMargin: '600px' });
      observeShells._io = io;
      shells.forEach(function (s) { io.observe(s); });
    } catch (e) {}
  }

  function fillShell(catId) {
    loadCategory(catId).then(function (items) {
      byCat[catId] = items;
      var shell = document.querySelector('[data-cat-shell="' + catId + '"]');
      if (!shell) { paint(); return; }
      var tmp = document.createElement('div');
      var title = catId.charAt(0).toUpperCase() + catId.slice(1);
      tmp.innerHTML = section(catId, title, items);
      if (tmp.firstChild) shell.replaceWith(tmp.firstChild);
      else shell.remove();
    }).catch(function () {});
  }

  function openDetail(id) {
    var p = null;
    for (var i = 0; i < ALL.length; i++) if (ALL[i].id === id) p = ALL[i];
    if (!p) return;
    var owned = !!ownedCache[p.id];
    var rcol = RARITY_COL[p.rarity] || '#9CA3AF';
    var contents = '';
    if (p.outfit) {
      var parts = [];
      for (var k in p.outfit) parts.push('<li><b>' + esc(k) + '</b> — ' + esc(p.outfit[k]) + '</li>');
      contents = '<div class="detail-contents"><b>Bundle contents</b><ul>' + parts.join('') + '</ul></div>';
    }
    var img = esc(p.img || ('cosmetics/' + p.id + '.png'));
    var m = document.getElementById('storeModal');
    if (!m) {
      m = document.createElement('div');
      m.id = 'storeModal';
      m.className = 'store-modal';
      document.body.appendChild(m);
    }
    m.innerHTML = '<div class="store-modal-box">' +
      '<button class="store-modal-x" id="storeModalX">✕</button>' +
      '<img class="detail-img" src="' + img + '" alt="' + esc(p.name) + '" decoding="async">' +
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
        list.forEach(function (id) { ownedCache[id] = true; });
        paint();
        if (cb) cb();
      })
      .catch(function () { if (cb) cb(); });
  }

  function buyFlow(id) {
    var p = null;
    for (var i = 0; i < ALL.length; i++) if (ALL[i].id === id) p = ALL[i];
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

  function bootWithItems(items) {
    ALL = items;
    byCat = {};
    CATS.forEach(function (c) {
      byCat[c.id] = items.filter(function (p) { return p.cat === c.id; });
    });
    // Above-the-fold first: paint featured + first categories now, rest on scroll.
    paint();
    refreshOwned();
  }

  function boot() {
    loadIndex().then(function (idx) {
      if (idx && idx.legacy) {
        // No data/*.json reachable (file://): use the legacy bundle instead.
        return ensureLegacyShim().then(function () {
          return new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = 'store.js';
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
          });
        });
      }
      // Featured needs cross-category data: load smallest useful set first.
      return Promise.all([loadCategory('wings'), loadCategory('cloaks')]).then(function (parts) {
        var map = {};
        parts.flat().forEach(function (p) { map[p.id] = p; });
        // prime featured from these two, then fill the rest lazily
        ALL = Object.values(map);
        byCat = { wings: parts[0], cloaks: parts[1] };
        paint();
        return Promise.all(CATS.filter(function (c) { return c.id !== 'wings' && c.id !== 'cloaks'; })
          .map(function (c) { return loadCategory(c.id); })).then(function (rest) {
            var all = ALL.slice();
            rest.flat().forEach(function (p) {
              if (!all.find(function (q) { return q.id === p.id; })) all.push(p);
            });
            bootWithItems(all);
          });
      });
    }).catch(function () {
      ensureLegacyShim().then(function () {
        var s = document.createElement('script');
        s.src = 'store.js';
        document.head.appendChild(s);
      });
    });

    document.body.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.getAttribute) return;
      var fav = t.getAttribute('data-fav');
      if (fav) { toggleFav(fav); paint(); return; }
      var view = t.getAttribute('data-view');
      if (view) { openDetail(view); return; }
      var buy = t.getAttribute('data-buy');
      if (buy) { buyFlow(buy); return; }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
