/* VORTEX CAPES — capes-only cosmetic marketplace (page code, see js/catalog.js).
   Active catalog: data/cosmetics/capes.json ONLY (15 starter capes).
   Archived categories (wings, pets, auras, suits, headwear, ...) live in
   data/archive/ + their old renders stay on disk, but NOTHING outside
   capes is listed, searched, or sold here.
   Images ALWAYS come from product.img (never built from ids). A missing
   asset shows "Preview unavailable" — never a letter placeholder.
   Purchase/ownership is always verified by the backend (order -> /claim
   in Discord -> credits -> owned -> Vault). No fake sales, no fake confirmations, no popularity numbers anywhere. */
import { loadIndex, loadCategory, loadAllLegacy } from './catalog.js';

(function () {
  var RARITY_COL = { Common: '#9CA3AF', Rare: '#38BDF8', Epic: '#C084FC', Legendary: '#FB923C', Mythic: '#F472B6' };
  var RARITY_RANK = { Common: 0, Rare: 1, Epic: 2, Legendary: 3, Mythic: 4 };
  var PRICE_BANDS = [    { id: 'any', label: 'Any price', test: function () { return true; } },
    { id: 'p1', label: '100 – 200', test: function (p) { return p <= 200; } },
    { id: 'p2', label: '200 – 300', test: function (p) { return p > 200 && p <= 300; } },
    { id: 'p3', label: '300 – 500', test: function (p) { return p > 300 && p <= 500; } },
    { id: 'p4', label: '500 +', test: function (p) { return p > 500; } }
  ];
  var THEMES = [
    { id: 'galaxy', label: 'Galaxy', match: ['galaxy', 'cosmic', 'nebula', 'astral'] },
    { id: 'fire', label: 'Fire', match: ['fire', 'flame', 'ember', 'lava', 'magma', 'inferno'] },
    { id: 'ice', label: 'Ice', match: ['ice', 'frost', 'frozen', 'glacier', 'snow', 'winter'] },
    { id: 'void', label: 'Void', match: ['void', 'abyss', 'ender', 'rift'] },
    { id: 'cyber', label: 'Cyber', match: ['cyber', 'circuit', 'pulse', 'neon'] },
    { id: 'celestial', label: 'Celestial', match: ['celestial', 'aurora', 'eclipse', 'corona', 'stars', 'moon', 'constellation', 'lights', 'northern'] },
    { id: 'nature', label: 'Nature', match: ['forest', 'moss', 'nature', 'flower', 'ocean', 'tide'] },
    { id: 'shadow', label: 'Shadow', match: ['shadow', 'phantom', 'ghost', 'wisp', 'dark', 'midnight'] },
    { id: 'royal', label: 'Royal', match: ['royal', 'gold', 'crown', 'obsidian'] },
    { id: 'crystal', label: 'Crystal', match: ['crystal', 'gem', 'nova', 'star'] },
    { id: 'storm', label: 'Storm', match: ['storm', 'thunder', 'lightning', 'rain'] }
  ];
  function themeMatch(p, themeId) {
    if (themeId === 'all') return true;
    if (p.theme === themeId) return true;
    var tags = p.tags || [];
    for (var i = 0; i < THEMES.length; i++) {
      if (THEMES[i].id !== themeId) continue;
      for (var j = 0; j < tags.length; j++) {
        if (THEMES[i].match.indexOf(tags[j]) >= 0) return true;
      }
      return false;
    }
    return true;
  }
  var ALL = [];
  var byId = {};
  var state = { q: '', plusOnly: false, rar: {}, price: 'any', sort: 'featured', theme: 'all', animatedOnly: false };
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
  function tileHTML(p) {
    // Image ALWAYS comes from p.img (catalog truth). Never construct paths
    // from p.id. If the asset is genuinely missing/broken, show a clean
    // "Preview unavailable" state — never a letter placeholder.
    if (p.img) {
      return '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + ' cape render" loading="lazy" decoding="async" width="768" height="768"' +
        ' onerror="this.outerHTML=\'<div class=&quot;prod-unavailable&quot;><span>Preview<br>unavailable</span></div>\';' +
        'if(window.console&&console.warn)console.warn(&quot;[store] missing asset: ' + esc(p.img) + '&quot;)">';
    }
    return '<div class="prod-unavailable"><span>Preview<br>unavailable</span></div>';
  }

  function themeLabel(id) {
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i].label;
    return id;
  }

  function badges(p) {
    var b = '<span class="prod-badge rarity-' + esc(p.rarity) + '">' + esc(p.rarity) + '</span>';
    if (p.animated) b += '<span class="prod-badge anim">✦ Animated</span>';
    if (p.vortexPlus) b += '<span class="prod-badge plus">Vortex+</span>';
    if (equippedCache[p.id]) b += '<span class="prod-badge equipped">EQUIPPED</span>';
    else if (ownedCache[p.id]) b += '<span class="prod-badge owned">OWNED</span>';
    return '<span class="prod-badges">' + b + '</span>';
  }

  function card(p) {
    var owned = !!ownedCache[p.id];
    var wished = wishlist().indexOf(p.id) >= 0;
    return '' +
      '<div class="prod" data-id="' + esc(p.id) + '">' +
      '<button class="prod-fav' + (wished ? ' on' : '') + '" data-wish="' + esc(p.id) + '" title="Save to wishlist" aria-label="Save to wishlist">★</button>' +
      '<div class="prod-img" data-view="' + esc(p.id) + '">' + tileHTML(p) + badges(p) + '</div>' +
      '<div class="prod-info"><b data-view="' + esc(p.id) + '">' + esc(p.name) + '</b>' +
      '<div class="prod-cat">Cape · ' + esc(themeLabel(p.theme)) + '</div>' +
      '<div class="prod-desc">' + esc(p.desc || '') + '</div>' +
      '<div class="prod-price">' + Number(p.price || 0).toLocaleString() + ' coins</div>' +
      '<div class="prod-actions">' +
      '<button class="btn btn-secondary sm" data-view="' + esc(p.id) + '">View</button>' +
      (owned
        ? '<button class="btn btn-secondary sm" disabled>Owned</button>'
        : '<button class="btn btn-primary sm" data-buy="' + esc(p.id) + '">Buy</button>') +
      '</div></div></div>';
  }

  function featureCard(p) {
    var owned = !!ownedCache[p.id];
    return '' +
      '<div class="cape-feature" data-id="' + esc(p.id) + '">' +
      '<div data-view="' + esc(p.id) + '">' + tileHTML(p) + '</div>' +
      '<div><span class="prod-badge rarity-' + esc(p.rarity) + '">' + esc(p.rarity) + ' · Flagship</span>' +
      '<h2>' + esc(p.name) + '</h2>' +
      '<p>' + esc(p.desc || '') + ' Custom cape built for the Vortex client.</p>' +
      '<div class="detail-price">' + Number(p.price || 0).toLocaleString() + ' coins</div>' +
      '<div class="cape-feature-actions">' +
      '<button class="btn btn-secondary" data-view="' + esc(p.id) + '">View details</button>' +
      (owned
        ? '<button class="btn btn-secondary" disabled>Owned — equip it in the Vault</button>'
        : '<button class="btn btn-primary" data-buy="' + esc(p.id) + '">Buy now</button>') +
      '</div></div></div>';
  }

  function section(id, title, sub, inner) {
    return '<section class="wrap store-sec" id="' + id + '"><div class="sec-head"><h2>' + esc(title) + '</h2><span>' +
      esc(sub) + '</span></div>' + inner + '</section>';
  }

  function sortedItems(items) {
    var arr = items.slice();
    if (state.sort === 'price-asc') arr.sort(function (a, b) { return (a.price || 0) - (b.price || 0); });
    else if (state.sort === 'price-desc') arr.sort(function (a, b) { return (b.price || 0) - (a.price || 0); });
    else if (state.sort === 'name') arr.sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
    else if (state.sort === 'newest') arr.sort(function (a, b) { return ((b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)) || ((b.price || 0) - (a.price || 0)); });
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
      if (p.cat !== 'capes') return false;
      if (rarActive.length && rarActive.indexOf(p.rarity) < 0) return false;
      if (!band.test(Number(p.price || 0))) return false;
      if (!themeMatch(p, state.theme)) return false;
      if (state.animatedOnly && !p.animated) return false;
      if (state.plusOnly && !p.vortexPlus) return false;
      if (q) {
        var hay = ((p.name || '') + ' ' + (p.desc || '') + ' ' + (p.rarity || '') +
          ' cape ' + themeLabel(p.theme) + ' ' + ((p.tags || []).join(' '))).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
    return sortedItems(out);
  }

  function hasFilter() {
    return state.q.trim() !== '' || state.plusOnly ||
      Object.keys(state.rar).some(function (k) { return state.rar[k]; }) ||
      state.price !== 'any' || state.sort !== 'featured' ||
      state.theme !== 'all' || state.animatedOnly;
  }

  function paint() {
    var host = document.getElementById('storeCatalog');
    if (!host) return;
    var html = '';
    if (hasFilter()) {
      var res = filtered();
      html = section('results', 'Results', res.length + ' capes',
        (res.length ? '<div class="prod-grid">' + res.map(card).join('') + '</div>'
          : '<p class="empty-note">Nothing matches. Try a different search or clear the filters.</p>'));
      host.innerHTML = html;
      return;
    }
    var wished = wishlist();
    var wishItems = ALL.filter(function (p) { return wished.indexOf(p.id) >= 0; });
    if (wishItems.length) {
      html += section('wishlist', 'Wishlist', 'saved on this device — not server ownership',
        '<div class="prod-grid">' + wishItems.map(card).join('') + '</div>');
    }
    var flagship = byId['eclipse-cape'] || ALL[0];
    if (flagship) {
      html += '<div class="wrap" id="featured">' + featureCard(flagship) + '</div>';
    }
    var fresh = ALL.filter(function (p) { return p.isNew && p.id !== 'eclipse-cape'; });
    if (fresh.length) {
      html += section('new', 'New Capes', 'fresh vault arrivals',
        '<div class="prod-grid">' + sortedItems(fresh).map(card).join('') + '</div>');
    }
    html += section('all-capes', 'All Capes', ALL.length + ' original Vortex designs',
      '<div class="prod-grid">' + sortedItems(ALL).map(card).join('') + '</div>');
    host.innerHTML = html;
  }

  function openDetail(id) {
    var p = byId[id];
    if (!p) return;
    var owned = !!ownedCache[p.id];
    var wished = wishlist().indexOf(p.id) >= 0;
    var feats = (p.features && p.features.length ? p.features : ['Cloth motion', 'Multiplayer visible'])
      .map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('');
    if (p.animated && feats.indexOf('Animated') < 0) feats += '<li>Animated in the client</li>';
    var plusRow = p.vortexPlus
      ? '<div class="detail-meta"><span style="color:#FFD97D">Vortex+ exclusive cape</span></div>'
      : '';
    var m = document.getElementById('storeModal');
    if (!m) {
      m = document.createElement('div');
      m.id = 'storeModal';
      m.className = 'store-modal';
      document.body.appendChild(m);
    }
    // Product visual: the cape worn on the blocky player render (same
    // camera/lighting for every cape). No fake "interactive 3D model" —
    // the live Vault preview lives in the Vortex client.
    // Main product visual: the player render (never the raw texture).
    // A secondary "View texture" toggle shows the raw client texture.
    var texToggle = p.texture
      ? '<button class="linklike" data-textoggle="1">View texture</button>' +
        '<div class="texview" id="texView" hidden>' +
        '<img src="' + esc(p.texture) + '" alt="' + esc(p.name) + ' raw cape texture" loading="lazy" decoding="async">' +
        '<small>Raw cape texture — the client asset. Main preview above is the worn render.</small></div>'
      : '';
    m.innerHTML = '<div class="store-modal-box wide">' +
      '<button class="store-modal-x" id="storeModalX">✕</button>' +
      '<div class="detail-stage">' +
      (p.img
        ? '<img class="detail-preview" src="' + esc(p.img) + '" alt="' + esc(p.name) + ' cape render" decoding="async" fetchpriority="high"' +
          ' onerror="this.outerHTML=\'<div class=&quot;detail-unavailable&quot;><span>Preview<br>unavailable</span></div>\'">'
        : '<div class="detail-unavailable"><span>Preview<br>unavailable</span></div>') +
      '</div>' + texToggle +
      '<h2>' + esc(p.name) + '</h2>' +
      '<div class="detail-meta"><span class="prod-badge rarity-' + esc(p.rarity) + '" style="position:static">' + esc(p.rarity) + '</span> · Cape · ' + esc(themeLabel(p.theme)) + '</div>' +
      '<p class="detail-desc">' + esc(p.desc || 'A Vortex cape, rendered for the store.') + '</p>' +
      '<ul class="detail-feats">' + feats + '</ul>' + plusRow +
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
      '<li>Press the Vault key and equip it under Capes.</li>' +
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
    var texBtn = m.querySelector('[data-textoggle]');
    if (texBtn) texBtn.onclick = function () {
      var el = document.getElementById('texView');
      if (el) {
        el.hidden = !el.hidden;
        texBtn.textContent = el.hidden ? 'View texture' : 'Hide texture';
      }
    };
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
      return '<div class="inv-mini" data-view="' + esc(p.id) + '">' + tileHTML(p) +
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
      '<h3 class="inv-h">Wishlist (' + wished.length + ', this device only)</h3>' +
      (wished.length ? '<div class="inv-grid">' + wished.map(mini).join('') + '</div>' : '<p class="empty-note">Tap ★ on any cape to save it here.</p>') +
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
            vortexPlus: !!(acct && acct.vortexPlus),
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
        (me.avatar ? '<img src="' + esc(me.avatar) + '" alt="">' : '<span class="acct-fb">V</span>') +
        '<span class="acct-name">' + esc(me.displayName || me.username || '') + '</span>' +
        (account.vortexPlus ? '<span class="acct-plus">Vortex+</span>' : '') +
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

  function syncPills() {
    var pills = document.getElementById('catPills');
    if (!pills) return;
    pills.querySelectorAll('[data-pill]').forEach(function (x) {
      var v = x.getAttribute('data-pill');
      x.classList.toggle('on', v === 'all' ? !state.plusOnly : !!state.plusOnly);
    });
    var plusOnly = document.getElementById('plusOnly');
    if (plusOnly) plusOnly.checked = !!state.plusOnly;
  }

  function bindToolbar() {
    var q = document.getElementById('storeSearch');
    if (q) q.addEventListener('input', function () { state.q = q.value; paint(); });
    var pills = document.getElementById('catPills');
    if (pills) pills.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-pill]') : null;
      if (!b) return;
      state.plusOnly = b.getAttribute('data-pill') === 'plus';
      syncPills();
      paint();
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
    var theme = document.getElementById('themeSel');
    if (theme) theme.addEventListener('change', function () { state.theme = theme.value; paint(); });
    var animOnly = document.getElementById('animOnly');
    if (animOnly) animOnly.addEventListener('change', function () { state.animatedOnly = !!animOnly.checked; paint(); });
    var plusOnly = document.getElementById('plusOnly');
    if (plusOnly) plusOnly.addEventListener('change', function () { state.plusOnly = !!plusOnly.checked; syncPills(); paint(); });
    var clear = document.getElementById('clearFilters');
    if (clear) clear.addEventListener('click', function () {
      state = { q: '', plusOnly: false, rar: {}, price: 'any', sort: 'featured', theme: 'all', animatedOnly: false };
      if (q) q.value = '';
      if (sort) sort.value = 'featured';
      if (theme) theme.value = 'all';
      if (animOnly) animOnly.checked = false;
      if (plusOnly) plusOnly.checked = false;
      document.querySelectorAll('[data-rar]').forEach(function (c) { c.checked = false; });
      var p0 = document.querySelector('[data-price="any"]');
      if (p0) p0.checked = true;
      syncPills();
      paint();
    });
  }

  function bootWithItems(items) {
    ALL = items.filter(function (p) { return p.cat === 'capes'; });
    byId = {};
    ALL.forEach(function (p) { byId[p.id] = p; });
    paint();
    loadAccount();
    refreshOwned();
  }

  function boot() {
    bindToolbar();
    loadIndex().then(function (idx) {
      if (idx && idx.legacy) {
        return loadAllLegacy().then(function (items) {
          if (!items.length) throw new Error('empty');
          bootWithItems(items);
        });
      }
      return loadCategory('capes').then(function (items) {
        if (!items.length) throw new Error('empty');
        bootWithItems(items);
      });
    }).catch(function () {
      var host = document.getElementById('storeCatalog');
      if (host) {
        host.innerHTML = '<section class="wrap store-sec"><div class="sec-head"><h2>Store unavailable</h2>' +
          '<span>Could not load the cape catalog. Serve the site over http(s) or deploy it.</span></div></section>';
      }
    });

    document.body.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.getAttribute) return;
      var wish = t.getAttribute('data-wish');
      if (wish) { toggleWish(wish); paint(); return; }
      var coins = t.getAttribute('data-coins');
      if (coins) { openCoins(); return; }
      var view = t.getAttribute('data-view');
      // plus-minis and feature tiles carry data-view on a wrapper div;
      // clicks on their children (img/b/small) bubble up with no data-view,
      // so walk up to the nearest [data-view].
      if (!view && t.closest) {
        var up = t.closest('[data-view]');
        if (up) view = up.getAttribute('data-view');
      }
      if (view) { openDetail(view); return; }
      var buy = t.getAttribute('data-buy');
      if (buy) { buyFlow(buy); return; }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
