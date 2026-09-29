/* VORTEX Store — cosmetic marketplace (page code only, see js/catalog.js).
   Sections: hero (static HTML), Featured, Collections, New arrivals,
   Wishlist, per-category grids (lazy). Search + filters + sort are
   instant and client-side. Purchase/ownership always verified by the
   backend (order -> /claim in Discord -> credits -> owned -> Vault).
   No fake sales/review/popularity numbers anywhere. */
import { loadIndex, loadCategory, loadAllLegacy } from './catalog.js';

(function () {
  var CATS = [
    { id: 'wings', label: 'Wings' },
    { id: 'cloaks', label: 'Capes' },
    { id: 'headwear', label: 'Headwear' },
    { id: 'pets', label: 'Pets' },
    { id: 'auras', label: 'Auras' },
    { id: 'suits', label: 'Suits' }
  ];
  var RARITY_COL = { Common: '#9CA3AF', Rare: '#38BDF8', Epic: '#C084FC', Legendary: '#FB923C', Mythic: '#F472B6' };
  var RARITY_RANK = { Common: 0, Rare: 1, Epic: 2, Legendary: 3, Mythic: 4 };
  var COLLECTIONS = [
    { tag: 'galaxy', title: 'Galaxy Collection', blurb: 'Wear the cosmos.' },
    { tag: 'dragon', title: 'Dragon Collection', blurb: 'Leathery and loud.' },
    { tag: 'void', title: 'Void Collection', blurb: 'Woven from nothing.' },
    { tag: 'fire', title: 'Fire Collection', blurb: 'Woven with ember thread.' },
    { tag: 'ice', title: 'Ice Collection', blurb: 'Glacier fresh.' },
    { tag: 'shadow', title: 'Shadow Collection', blurb: 'Melts into the dark.' }
  ];
  var PRICE_BANDS = [
    { id: 'any', label: 'Any price', test: function () { return true; } },
    { id: 'p1', label: '100 – 200', test: function (p) { return p <= 200; } },
    { id: 'p2', label: '200 – 300', test: function (p) { return p > 200 && p <= 300; } },
    { id: 'p3', label: '300 – 500', test: function (p) { return p > 300 && p <= 500; } },
    { id: 'p4', label: '500 +', test: function (p) { return p > 500; } }
  ];
  var ALL = [];
  var byCat = {};
  var byId = {};
  var state = { q: '', cat: 'all', rar: {}, price: 'any', sort: 'featured' };
  var ownedCache = {};
  var equippedCache = {};
  var account = null; // {discord, mc, uuid, coins, owned[]} when logged in

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
  function wishlist() {
    try { return JSON.parse(localStorage.getItem('vortex_favs') || '[]'); } catch (e) { return []; }
  }
  function toggleWish(id) {
    try {
      var f = wishlist();
      var i = f.indexOf(id);
      if (i >= 0) f.splice(i, 1);
      else f.push(id);
      localStorage.setItem('vortex_favs', JSON.stringify(f));
    } catch (e) {}
  }

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
  function catLabel(id) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].label;
    return id;
  }
  function tileHTML(p, cls) {
    var rcol = RARITY_COL[p.rarity] || '#9CA3AF';
    var initial = esc(((p.name || p.id || '?').trim().charAt(0) || '?').toUpperCase());
    if (p.img) {
      return '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async" width="512" height="512"' +
        ' onerror="this.outerHTML=\'<div class=&quot;' + cls + '&quot; style=&quot;color:' + rcol + '&quot;>' + initial + '</div>\'">';
    }
    return '<div class="' + cls + '" style="color:' + rcol + '">' + initial + '</div>';
  }

  function badges(p) {
    var rcol = RARITY_COL[p.rarity] || '#9CA3AF';
    var b = '<span class="prod-badge" style="border-color:' + rcol + ';color:' + rcol + '">' + esc(p.rarity) + '</span>';
    if (equippedCache[p.id]) b += '<span class="prod-badge equipped">EQUIPPED</span>';
    else if (ownedCache[p.id]) b += '<span class="prod-badge owned">OWNED</span>';
    return b;
  }

  function card(p) {
    var owned = !!ownedCache[p.id];
    var wished = wishlist().indexOf(p.id) >= 0;
    var contents = '';
    if (p.outfit) {
      var parts = [];
      for (var k in p.outfit) {
        var ref = byId[p.outfit[k]];
        parts.push(ref ? ref.name : p.outfit[k]);
      }
      contents = '<div class="prod-contents">' + parts.map(esc).join(' + ') + '</div>';
    }
    return '' +
      '<div class="prod" data-id="' + esc(p.id) + '">' +
      '<button class="prod-fav' + (wished ? ' on' : '') + '" data-wish="' + esc(p.id) + '" title="Wishlist">★</button>' +
      '<div class="prod-img" data-view="' + esc(p.id) + '">' + tileHTML(p, 'prod-letter') + badges(p) + '</div>' +
      '<div class="prod-info"><b data-view="' + esc(p.id) + '">' + esc(p.name) + '</b>' +
      '<div class="prod-cat">' + esc(catLabel(p.cat)) + '</div>' + contents +
      '<div class="prod-price">' + Number(p.price || 0).toLocaleString() + ' coins</div>' +
      '<div class="prod-actions">' +
      '<button class="btn btn-secondary sm" data-view="' + esc(p.id) + '">View</button>' +
      (owned
        ? '<button class="btn btn-secondary sm" disabled>Owned</button>'
        : '<button class="btn btn-primary sm" data-buy="' + esc(p.id) + '">Buy</button>') +
      '</div></div></div>';
  }

  function section(catId, title, sub, items) {
    if (!items.length) return '';
    return '<section class="wrap store-sec" id="' + catId + '"><div class="sec-head"><h2>' + esc(title) + '</h2><span>' +
      (sub || (items.length + ' items')) + '</span></div><div class="prod-grid">' +
      items.map(card).join('') + '</div></section>';
  }

  function sortedItems(items) {
    var arr = items.slice();
    if (state.sort === 'price-asc') arr.sort(function (a, b) { return (a.price || 0) - (b.price || 0); });
    else if (state.sort === 'price-desc') arr.sort(function (a, b) { return (b.price || 0) - (a.price || 0); });
    else if (state.sort === 'name') arr.sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
    else if (state.sort === 'newest') arr.reverse();
    else arr.sort(function (a, b) {
      return ((RARITY_RANK[b.rarity] || 0) - (RARITY_RANK[a.rarity] || 0)) || ((b.price || 0) - (a.price || 0));
    });
    return arr;
  }

  function filtered() {
    var q = state.q.trim().toLowerCase();
    var band = PRICE_BANDS.filter(function (b) { return b.id === state.price; })[0] || PRICE_BANDS[0];
    var rarActive = Object.keys(state.rar).filter(function (k) { return state.rar[k]; });
    var out = ALL.filter(function (p) {
      if (state.cat !== 'all' && p.cat !== state.cat) return false;
      if (rarActive.length && rarActive.indexOf(p.rarity) < 0) return false;
      if (!band.test(Number(p.price || 0))) return false;
      if (q) {
        var hay = ((p.name || '') + ' ' + (p.rarity || '') + ' ' + catLabel(p.cat) + ' ' + ((p.tags || []).join(' '))).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
    return sortedItems(out);
  }

  function hasFilter() {
    return state.q.trim() !== '' || state.cat !== 'all' ||
      Object.keys(state.rar).some(function (k) { return state.rar[k]; }) ||
      state.price !== 'any' || state.sort !== 'featured';
  }

  function collectionItems(tag) {
    return ALL.filter(function (p) { return (p.tags || []).indexOf(tag) >= 0; });
  }

  function paint() {
    var host = document.getElementById('storeCatalog');
    if (!host) return;
    var html = '';
    if (hasFilter()) {
      var res = filtered();
      html = '<section class="wrap store-sec" id="results"><div class="sec-head"><h2>Results</h2><span>' +
        res.length + ' items</span></div>' +
        (res.length ? '<div class="prod-grid">' + res.map(card).join('') + '</div>'
          : '<p class="empty-note">Nothing matches. Try a different search or clear the filters.</p>') + '</section>';
      host.innerHTML = html;
      return;
    }
    var wished = wishlist();
    var wishItems = ALL.filter(function (p) { return wished.indexOf(p.id) >= 0; });
    if (wishItems.length) html += section('wishlist', 'Wishlist', 'saved on this device', wishItems);
    var feat = ALL.filter(function (p) { return p.rarity === 'Mythic' || p.rarity === 'Legendary'; }).slice(0, 8);
    if (feat.length) html += section('featured', 'Featured', 'hand-picked rarities', feat);
    COLLECTIONS.forEach(function (c) {
      var items = collectionItems(c.tag);
      if (items.length >= 3) {
        var cover = null;
        for (var i = 0; i < items.length; i++) {
          if (items[i].rarity === 'Mythic' || items[i].rarity === 'Legendary') { cover = items[i]; break; }
        }
        if (!cover) cover = items[0];
        html += '<section class="wrap store-sec collection" id="col-' + c.tag + '">' +
          '<div class="collection-hero" data-view="' + esc(cover.id) + '">' +
          (cover.img ? '<img src="' + esc(cover.img) + '" alt="" loading="lazy" decoding="async">' : '') +
          '<div class="collection-hero-text"><h2>' + esc(c.title) + '</h2><p>' + esc(c.blurb) + '</p>' +
          '<span class="btn btn-secondary sm">View collection</span></div></div>' +
          '<div class="prod-grid">' + items.slice(0, 5).map(card).join('') + '</div></section>';
      }
    });
    var fresh = ALL.slice(-8).reverse();
    if (fresh.length) html += section('latest', 'New arrivals', 'recently added to the vault rotation', fresh);
    CATS.forEach(function (c) {
      var items = byCat[c.id];
      if (items === undefined) {
        html += '<section class="wrap store-sec" id="' + c.id + '" data-cat-shell="' + c.id + '"><div class="sec-head"><h2>' +
          esc(c.label) + '</h2><span>loading…</span></div></section>';
      } else {
        html += section(c.id, c.label, null, items);
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
      var label = catLabel(catId);
      var tmp = document.createElement('div');
      tmp.innerHTML = section(catId, label, null, items);
      if (tmp.firstChild) shell.replaceWith(tmp.firstChild);
      else shell.remove();
    }).catch(function () {});
  }

  function typeFeatures(p) {
    var t = p.type;
    if (t === 'WINGS') return ['Animated wing motion', 'Idle + glide poses', 'Multiplayer visible'];
    if (t === 'PET') return ['Follows you in game', 'Idle + wing animation', 'Multiplayer visible'];
    if (t === 'AURA') return ['Live particle ring', 'Moves with your player', 'Multiplayer visible'];
    if (t === 'CAPE') return ['Cloth motion', 'Multiplayer visible'];
    if (t === 'HAT') return ['Head-tracked fit', 'Multiplayer visible'];
    if (t === 'SUIT') return ['Full outfit set', 'One-click equip', 'Multiplayer visible'];
    return ['Multiplayer visible'];
  }

  function bundleMath(p) {
    if (!p.outfit) return null;
    var total = 0, missing = 0;
    var rows = [];
    for (var k in p.outfit) {
      var ref = byId[p.outfit[k]];
      if (ref) { total += Number(ref.price || 0); rows.push({ slot: k, name: ref.name, price: Number(ref.price || 0) }); }
      else { missing++; rows.push({ slot: k, name: p.outfit[k], price: 0 }); }
    }
    return { rows: rows, total: total, save: total - Number(p.price || 0), missing: missing };
  }

  function openDetail(id) {
    var p = byId[id];
    if (!p) return;
    var owned = !!ownedCache[p.id];
    var wished = wishlist().indexOf(p.id) >= 0;
    var rcol = RARITY_COL[p.rarity] || '#9CA3AF';
    var bm = bundleMath(p);
    var contents = '';
    if (bm) {
      contents = '<div class="detail-contents"><b>Bundle contents</b><ul>' +
        bm.rows.map(function (r) {
          return '<li><b>' + esc(r.slot) + '</b> — ' + esc(r.name) +
            (r.price ? ' <span>' + Number(r.price).toLocaleString() + ' coins</span>' : '') + '</li>';
        }).join('') + '</ul>' +
        (bm.missing === 0 ? '<div class="bundle-save">Separate total ' + Number(bm.total).toLocaleString() +
          ' coins — bundle saves ' + Number(Math.max(0, bm.save)).toLocaleString() + ' coins.</div>' : '') + '</div>';
    }
    var feats = typeFeatures(p).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('');
    var m = document.getElementById('storeModal');
    if (!m) {
      m = document.createElement('div');
      m.id = 'storeModal';
      m.className = 'store-modal';
      document.body.appendChild(m);
    }
    m.innerHTML = '<div class="store-modal-box wide">' +
      '<button class="store-modal-x" id="storeModalX">✕</button>' +
      '<div class="detail-stage" id="detailStage">' +
      (p.img
        ? '<img class="detail-preview" src="' + esc(p.img) + '" alt="' + esc(p.name) + '" decoding="async">'
        : '<div class="detail-letter" style="color:' + rcol + '">' + esc((p.name || '?').charAt(0)) + '</div>') +
      '</div>' +
      '<h2>' + esc(p.name) + '</h2>' +
      '<div class="detail-meta"><span style="color:' + rcol + '">' + esc(p.rarity) + '</span> · ' + esc(catLabel(p.cat)) + '</div>' +
      '<p class="detail-desc">' + esc(p.desc || 'A Vortex cosmetic, rendered live in game.') + '</p>' +
      '<ul class="detail-feats">' + feats + '</ul>' + contents +
      '<div class="detail-price">' + Number(p.price || 0).toLocaleString() + ' coins</div>' +
      '<div class="detail-actions">' +
      (owned ? '<button class="btn btn-secondary" disabled>Owned — equip it in the Vault</button>'
        : '<button class="btn btn-primary" data-buy="' + esc(p.id) + '">Buy now</button>') +
      '<button class="btn btn-secondary" data-wish="' + esc(p.id) + '">' + (wished ? '★ Wishlisted' : '☆ Wishlist') + '</button>' +
      '</div>' +
      '<button class="linklike" data-clienthow="1">How do I wear this in Minecraft?</button>' +
      '<div class="clienthow" id="clientHow" hidden><ol>' +
      '<li>Buy here, then run <b>/claim &lt;code&gt;</b> in Discord.</li>' +
      '<li>Open the Vortex Launcher and join any world or server.</li>' +
      '<li>Press the Vault key and equip it under ' + esc(catLabel(p.cat)) + '.</li>' +
      '<li>Other Vortex players see it on you automatically.</li></ol></div>' +
      '</div>';
    m.classList.add('open');
    document.getElementById('storeModalX').onclick = function () { m.classList.remove('open'); };
    m.onclick = function (e) { if (e.target === m) m.classList.remove('open'); };
    var how = m.querySelector('[data-clienthow]');
    if (how) how.onclick = function () {
      var el = document.getElementById('clientHow');
      if (el) el.hidden = !el.hidden;
    };
    var stage = document.getElementById('detailStage');
    if (stage) {
      stage.addEventListener('mousemove', function (e) {
        try {
          var r = stage.getBoundingClientRect();
          var dx = (e.clientX - r.left) / r.width - 0.5;
          var dy = (e.clientY - r.top) / r.height - 0.5;
          var img = stage.querySelector('img');
          if (img) img.style.transform = 'rotateY(' + (dx * 22).toFixed(1) + 'deg) rotateX(' + (-dy * 22).toFixed(1) + 'deg) scale(1.04)';
        } catch (err) {}
      });
      stage.addEventListener('mouseleave', function () {
        try {
          var img = stage.querySelector('img');
          if (img) img.style.transform = '';
        } catch (err) {}
      });
    }
  }

  function openInventory() {
    var m = document.getElementById('storeModal');
    if (!m) {
      m = document.createElement('div');
      m.id = 'storeModal';
      m.className = 'store-modal';
      document.body.appendChild(m);
    }
    var owned = ALL.filter(function (p) { return ownedCache[p.id]; });
    var eq = ALL.filter(function (p) { return equippedCache[p.id]; });
    var wished = ALL.filter(function (p) { return wishlist().indexOf(p.id) >= 0; });
    function mini(p) {
      return '<div class="inv-mini" data-view="' + esc(p.id) + '">' + tileHTML(p, 'prod-letter') +
        '<span>' + esc(p.name) + '</span></div>';
    }
    m.innerHTML = '<div class="store-modal-box wide">' +
      '<button class="store-modal-x" id="storeModalX">✕</button>' +
      '<h2>' + (account ? esc(account.discord.username || 'Your') + ' inventory' : 'Inventory') + '</h2>' +
      (account && account.mc
        ? '<div class="detail-meta">Minecraft: <b>' + esc(account.mc) + '</b>' +
          (account.uuid ? ' · <span>' + esc(account.uuid.slice(0, 8)) + '…</span>' : '') +
          ' · <span>' + Number(account.coins || 0).toLocaleString() + ' coins</span></div>'
        : '<p class="detail-desc">Log in with Discord and link your Minecraft account to see live inventory.</p>') +
      '<h3 class="inv-h">Equipped (' + eq.length + ')</h3>' +
      (eq.length ? '<div class="inv-grid">' + eq.map(mini).join('') + '</div>' : '<p class="empty-note">Nothing equipped — open the Vault in game.</p>') +
      '<h3 class="inv-h">Owned (' + owned.length + ')</h3>' +
      (owned.length ? '<div class="inv-grid">' + owned.map(mini).join('') + '</div>' : '<p class="empty-note">No purchases yet.</p>') +
      '<h3 class="inv-h">Wishlist (' + wished.length + ', this device)</h3>' +
      (wished.length ? '<div class="inv-grid">' + wished.map(mini).join('') + '</div>' : '<p class="empty-note">Tap ★ on any product to save it here.</p>') +
      '</div>';
    m.classList.add('open');
    document.getElementById('storeModalX').onclick = function () { m.classList.remove('open'); };
    m.onclick = function (e) { if (e.target === m) m.classList.remove('open'); };
  }

  function refreshOwned(cb) {
    ownedCache = {};
    equippedCache = {};
    var mc = mcName();
    var base = botBase();
    function done() { paint(); if (cb) cb(); }
    if (account && account.owned) {
      account.owned.forEach(function (id) { ownedCache[id] = true; });
      Object.keys(account.equipped || {}).forEach(function (slot) {
        var id = account.equipped[slot];
        if (id) equippedCache[id] = true;
      });
      done();
      return;
    }
    if (!mc || !base) { done(); return; }
    fetch(base + '/api/cosmetics/owned?mc=' + encodeURIComponent(mc) + '&uuid=', { method: 'GET' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var list = (d && d.ok && d.owned) ? d.owned : [];
        list.forEach(function (id) { ownedCache[id] = true; });
        done();
      })
      .catch(done);
  }

  function loadAccount() {
    var wrap = document.getElementById('accountWrap');
    function renderLogin() {
      if (!wrap) return;
      wrap.innerHTML = '<a class="btn btn-secondary sm" href="/api/discord-login"><i class="fa-brands fa-discord"></i> <span>Login</span></a>';
    }
    fetch('/api/me', { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('no session');
        return r.json();
      })
      .then(function (me) {
        if (!me || !me.ok) throw new Error('no session');
        var base = botBase();
        var url = base ? base + '/api/account/' + encodeURIComponent(me.id) : null;
        function withAcct(acct) {
          account = {
            discord: me,
            mc: acct && acct.linked ? acct.linked.mc : null,
            uuid: acct && acct.linked ? acct.linked.uuid : null,
            coins: (acct && typeof acct.coins === 'number') ? acct.coins : null,
            owned: (acct && acct.owned) || [],
            equipped: (acct && acct.equipped) || {}
          };
          if (account.mc) setMcName(account.mc);
          renderAccount();
          refreshOwned();
        }
        if (!url) { withAcct(null); return; }
        fetch(url).then(function (r) { return r.json(); }).then(function (a) {
          withAcct(a && a.ok ? a : null);
        }).catch(function () { withAcct(null); });
      })
      .catch(renderLogin);

    function renderAccount() {
      if (!wrap || !account) { renderLogin(); return; }
      var me = account.discord;
      var coins = (account.coins === null || account.coins === undefined)
        ? '<span title="Bot unreachable">— coins</span>'
        : '<b>' + Number(account.coins).toLocaleString() + ' coins</b>';
      wrap.innerHTML =
        '<div class="acct" id="acctBtn">' +
        (me.avatar ? '<img src="' + esc(me.avatar) + '" alt="">' : '<span class="acct-fb">' + esc((me.username || '?').charAt(0)) + '</span>') +
        '<span class="acct-name">' + esc(me.displayName || me.username || '') + '</span>' +
        '<span class="acct-coins">' + coins + '</span>' +
        '<div class="acct-menu" id="acctMenu" hidden>' +
        (account.mc ? '<div class="acct-row">Minecraft: <b>' + esc(account.mc) + '</b></div>'
          : '<div class="acct-row">Minecraft: <a href="/link-minecraft.html">link account</a></div>') +
        '<button class="acct-row linklike" data-inv="1">Inventory (' + Object.keys(ownedCache).length + ' owned)</button>' +
        '<a class="acct-row" href="/api/logout">Logout</a>' +
        '</div></div>';
      var btn = document.getElementById('acctBtn');
      var menu = document.getElementById('acctMenu');
      if (btn && menu) {
        btn.onclick = function (e) {
          if (e.target && e.target.getAttribute && e.target.getAttribute('data-inv')) { openInventory(); return; }
          menu.hidden = !menu.hidden;
        };
        document.addEventListener('click', function h(ev) {
          if (!menu.hidden && btn && !btn.contains(ev.target)) menu.hidden = true;
        });
      }
    }
  }

  function buyFlow(id) {
    var p = byId[id];
    if (!p) return;
    if (ownedCache[id]) { toast(p.name + ' is already owned.', true); return; }
    var base = botBase();
    var mc = (account && account.mc) || mcName();
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

  function openCoins() {
    var m = document.getElementById('storeModal');
    if (!m) { m = document.createElement('div'); m.id = 'storeModal'; m.className = 'store-modal'; document.body.appendChild(m); }
    var bal = (account && account.coins !== null && account.coins !== undefined)
      ? Number(account.coins).toLocaleString() + ' coins' : 'login to see balance';
    m.innerHTML = '<div class="store-modal-box">' +
      '<button class="store-modal-x" id="storeModalX">✕</button>' +
      '<h2>Vortex Coins</h2>' +
      '<p class="detail-desc">Balance: <b>' + esc(bal) + '</b></p>' +
      '<p class="detail-desc">Coins are earned with the +100 welcome bonus and Discord events. ' +
      'Sales open in our Discord — join and watch the announcements channel.</p>' +
      '<a class="btn btn-primary" href="socials.html">Join Discord</a></div>';
    m.classList.add('open');
    document.getElementById('storeModalX').onclick = function () { m.classList.remove('open'); };
    m.onclick = function (e) { if (e.target === m) m.classList.remove('open'); };
  }

  function bindToolbar() {
    var q = document.getElementById('storeSearch');
    if (q) q.addEventListener('input', function () { state.q = q.value; paint(); });
    var pills = document.getElementById('catPills');
    if (pills) pills.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-pill]') : null;
      if (!b) return;
      state.cat = b.getAttribute('data-pill');
      pills.querySelectorAll('[data-pill]').forEach(function (x) {
        x.classList.toggle('on', x === b);
      });
      paint();
      var sec = document.getElementById(state.cat === 'all' ? 'storeCatalog' : state.cat);
      if (sec && sec.scrollIntoView) { try { sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (err) {} }
    });
    document.querySelectorAll('[data-rar]').forEach(function (c) {
      c.addEventListener('change', function () {
        state.rar[c.getAttribute('data-rar')] = !!c.checked;
        paint();
      });
    });
    document.querySelectorAll('[data-price]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (r.checked) { state.price = r.getAttribute('data-price'); paint(); }
      });
    });
    var sort = document.getElementById('storeSort');
    if (sort) sort.addEventListener('change', function () { state.sort = sort.value; paint(); });
    var clear = document.getElementById('clearFilters');
    if (clear) clear.addEventListener('click', function () {
      state = { q: '', cat: 'all', rar: {}, price: 'any', sort: 'featured' };
      if (q) q.value = '';
      if (sort) sort.value = 'featured';
      document.querySelectorAll('[data-rar]').forEach(function (c) { c.checked = false; });
      var p0 = document.querySelector('[data-price="any"]');
      if (p0) p0.checked = true;
      var pill0 = document.querySelector('[data-pill="all"]');
      if (pill0) {
        document.querySelectorAll('[data-pill]').forEach(function (x) { x.classList.toggle('on', x === pill0); });
      }
      paint();
    });
  }

  function bootWithItems(items) {
    ALL = items;
    byCat = {};
    byId = {};
    items.forEach(function (p) { byId[p.id] = p; });
    CATS.forEach(function (c) {
      byCat[c.id] = items.filter(function (p) { return p.cat === c.id; });
    });
    paint();
    loadAccount();
    refreshOwned();
  }

  function boot() {
    bindToolbar();
    var heroImg = document.getElementById('heroRender');
    loadIndex().then(function (idx) {
      if (idx && idx.legacy) {
        return loadAllLegacy().then(function (items) {
          if (!items.length) throw new Error('empty');
          bootWithItems(items);
        });
      }
      return Promise.all([loadCategory('wings'), loadCategory('cloaks')]).then(function (parts) {
        var map = {};
        parts.flat().forEach(function (p) { map[p.id] = p; });
        ALL = Object.values(map);
        ALL.forEach(function (p) { byId[p.id] = p; });
        byCat = { wings: parts[0], cloaks: parts[1] };
        var gal = byId.galaxy_wings || byId.galaxy_cloak || ALL[0];
        if (heroImg && gal && gal.img) heroImg.src = gal.img;
        paint();
        loadAccount();
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
      var host = document.getElementById('storeCatalog');
      if (host) {
        host.innerHTML = '<section class="wrap store-sec"><div class="sec-head"><h2>Store unavailable</h2>' +
          '<span>Could not load catalog data. Serve the site over http(s) or deploy it.</span></div></section>';
      }
    });

    document.body.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.getAttribute) return;
      var wish = t.getAttribute('data-wish');
      if (wish) { toggleWish(wish); paint(); return; }
      var coins = t.getAttribute('data-coins');
      if (coins) { openCoins(); return; }
      var inv = t.getAttribute('data-invbtn');
      if (inv) { openInventory(); return; }
      var view = t.getAttribute('data-view');
      if (view) { openDetail(view); return; }
      var buy = t.getAttribute('data-buy');
      if (buy) { buyFlow(buy); return; }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
