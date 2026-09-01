/**
 * Vortex Credits System v2.5 - Enhanced Web & Launcher Integration
 * Features: Daily Streak, Level & XP, Cosmetics Inventory, Gift Box, Transfer Codes
 */
(function (root) {
  const KEY = 'vortex_wallet_v2';
  const OLD_KEY = 'vortex_wallet_v1';
  const USED = 'vortex_used_codes_v2';
  const HISTORY = 'vortex_history_v2';
  const SECRET_V2 = 'VORTEX-CREDIT-v2-ENHANCED';
  const SECRET_V1 = 'VORTEX-CREDIT-v1';
  const API_BASE = (root.VORTEX_BOT_URL || '').replace(/\/$/, '');

  const ITEM_CATALOG = {
    cape: { id: 'cape', title: 'Vortex Quantum Cape', cost: 400, type: 'cape', rarity: 'epic', desc: 'Signature animated cyan energy cape with pulsing trails.' },
    wings: { id: 'wings', title: 'Aether Cyber Wings', cost: 650, type: 'wings', rarity: 'legendary', desc: 'Holographic cyber wings radiating neon particles on jump.' },
    halo: { id: 'halo', title: 'Celestial Plasma Halo', cost: 500, type: 'halo', rarity: 'epic', desc: 'Floating plasma crown with dynamic color cycling.' },
    aura: { id: 'aura', title: 'Void Rift Aura', cost: 800, type: 'aura', rarity: 'mythic', desc: 'Surrounding vortex gravitational distortion and particle vortex.' },
    plus: { id: 'plus', title: 'Vortex Plus Subscription', cost: 900, type: 'rank', rarity: 'mythic', desc: 'Unlocks all cosmetic previews, custom nametag gradient, and 2x daily credits.' }
  };

  const ITEM_LABELS = Object.fromEntries(Object.entries(ITEM_CATALOG).map(([k, v]) => [k, v.title]));
  const ITEM_COSTS = Object.fromEntries(Object.entries(ITEM_CATALOG).map(([k, v]) => [k, v.cost]));

  function load() {
    let state = {
      credits: 0,
      xp: 0,
      level: 1,
      streak: 0,
      lastDaily: 0,
      welcome: false,
      owned: [],
      equipped: {},
      mysteryBoxes: 1,
      linkedMc: '',
      linkedAt: 0
    };

    try {
      const v2 = localStorage.getItem(KEY);
      if (v2) {
        state = Object.assign(state, JSON.parse(v2));
      } else {
        const v1 = localStorage.getItem(OLD_KEY);
        if (v1) {
          const parsedV1 = JSON.parse(v1);
          state = Object.assign(state, parsedV1, { xp: (parsedV1.credits || 0) * 2, level: Math.max(1, Math.floor((parsedV1.credits || 0) / 100)) });
        }
      }
    } catch (e) {
      console.warn('[VortexCredits] Error loading wallet:', e);
    }
    return state;
  }

  function save(wallet) {
    // Recalculate level
    wallet.level = Math.max(1, Math.floor(Math.sqrt((wallet.xp || 0) / 50)) + 1);
    localStorage.setItem(KEY, JSON.stringify(wallet));
    
    // Dispatch custom event for UI reactivity
    if (typeof root.dispatchEvent === 'function') {
      root.dispatchEvent(new CustomEvent('vortex-credits', { detail: wallet }));
    }
    // BroadcastChannel sync across tabs & launcher webviews
    try {
      if (typeof root.BroadcastChannel !== 'undefined') {
        if (!root._vortexCreditChannel) root._vortexCreditChannel = new BroadcastChannel('vortex_credit_sync');
        root._vortexCreditChannel.postMessage({ type: 'WALLET_SYNC', wallet });
      }
    } catch(e) {}
  }

  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY) || '[]'); } catch { return []; }
  }

  function saveHistory(list) {
    const trimmed = (list || []).slice(-80);
    localStorage.setItem(HISTORY, JSON.stringify(trimmed));
  }

  function addTx(kind, amount, label, extra) {
    const list = loadHistory();
    const tx = { kind, amount: Number(amount) || 0, label, ts: Date.now(), extra: extra || null };
    list.push(tx);
    saveHistory(list);
    if (typeof root.dispatchEvent === 'function') {
      root.dispatchEvent(new CustomEvent('vortex-credits-tx', { detail: list.slice(-20).reverse() }));
    }
    return list;
  }

  function recentHistory(n) {
    return loadHistory().slice(-(n || 15)).reverse();
  }

  function hash(value) {
    let h = 2166136261;
    for (let i = 0; i < value.length; i += 1) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
    return (h >>> 0).toString(16);
  }

  function welcome() {
    const wallet = load();
    if (!wallet.welcome) {
      wallet.welcome = true;
      wallet.credits += 250;
      wallet.xp += 300;
      save(wallet);
      addTx('welcome', 250, 'Welcome Reward (+250 CR)');
    }
    return wallet;
  }

  function buyCredits(amount, usdPrice) {
    // In a real app, this would integrate with a payment gateway (e.g. Stripe, PayPal)
    // For now, this mocks a successful purchase
    const wallet = load();
    const cr = Number(amount) || 0;
    if (cr <= 0) return { ok: false, message: 'Invalid amount' };
    
    wallet.credits += cr;
    wallet.xp += cr;
    save(wallet);
    
    addTx('purchase', cr, `Purchased +${cr} CR for $${usdPrice}`);
    
    return {
      ok: true,
      amount: cr,
      message: `Successfully purchased ${cr} CR!`,
      wallet
    };
  }

  function spend(id, customCost) {
    const wallet = load();
    if (wallet.owned.includes(id)) return { ok: false, message: 'Item is already in your inventory.', wallet };
    const price = Number(customCost) || ITEM_COSTS[id] || 0;
    if (wallet.credits < price) return { ok: false, message: `Insufficient credits! You need ${price - wallet.credits} more CR.`, wallet };
    
    wallet.credits -= price;
    wallet.xp += price * 4;
    wallet.owned.push(id);
    save(wallet);
    addTx('spend', -price, 'Unlocked ' + (ITEM_LABELS[id] || id), { item: id });
    return { ok: true, message: `Successfully unlocked ${ITEM_LABELS[id] || id}!`, wallet };
  }

  function equip(id, category) {
    const wallet = load();
    if (!wallet.owned.includes(id)) return { ok: false, message: 'Item not owned!' };
    wallet.equipped = wallet.equipped || {};
    const cat = category || (ITEM_CATALOG[id] && ITEM_CATALOG[id].type) || 'cosmetic';
    wallet.equipped[cat] = (wallet.equipped[cat] === id) ? null : id; // toggle
    save(wallet);
    return { ok: true, equipped: wallet.equipped, wallet };
  }

  function owned(id) {
    return load().owned.includes(id);
  }

  function exportCode(amount) {
    const wallet = load();
    const n = Math.min(wallet.credits, Math.max(0, Number(amount) || wallet.credits));
    if (n < 1) return { ok: false, message: 'No credits available to export.', wallet };
    
    wallet.credits -= n;
    save(wallet);
    const id = Math.random().toString(36).slice(2, 8);
    const payload = `${n}.${id}.${Date.now()}`;
    const code = `VX2-${payload}-${hash(payload + SECRET_V2).slice(0, 6)}`;
    addTx('export', -n, `Created Transfer Code for ${n} CR`);
    return { ok: true, code, amount: n, wallet };
  }

  function redeem(code) {
    const raw = String(code || '').trim();
    const m2 = raw.match(/^VX2-(\d+)\.([a-z0-9]+)\.(\d+)-([a-f0-9]+)$/i);
    const m1 = raw.match(/^VX1-(\d+)\.([a-z0-9]+)\.(\d+)-([a-f0-9]+)$/i);
    const match = m2 || m1;
    
    if (!match) return { ok: false, message: 'Invalid format! Code must start with VX2- or VX1-', wallet: load() };
    const payload = `${match[1]}.${match[2]}.${match[3]}`;
    const secret = m2 ? SECRET_V2 : SECRET_V1;
    
    if (hash(payload + secret).slice(0, 6).toLowerCase() !== match[4].toLowerCase()) {
      return { ok: false, message: 'Security checksum validation failed.', wallet: load() };
    }
    
    const used = JSON.parse(localStorage.getItem(USED) || '[]');
    if (used.includes(match[2])) return { ok: false, message: 'This transfer code has already been redeemed!', wallet: load() };
    
    used.push(match[2]);
    localStorage.setItem(USED, JSON.stringify(used));
    
    const wallet = load();
    const n = Number(match[1]);
    wallet.credits += n;
    wallet.xp += n * 2;
    save(wallet);
    addTx('redeem', n, `Redeemed Transfer Code (+${n} CR)`);
    return { ok: true, amount: n, message: `Successfully claimed +${n} Vortex Credits!`, wallet };
  }

  function linkMc(mcUser) {
    if (!/^[A-Za-z0-9_]{3,16}$/.test(mcUser || '')) return { ok: false, error: 'Invalid Minecraft username (3-16 chars).' };
    const wallet = load();
    wallet.linkedMc = mcUser.trim();
    wallet.linkedAt = Date.now();
    save(wallet);
    addTx('link', 50, `Linked Minecraft Account: ${mcUser.trim()}`);
    return { ok: true, wallet, message: `Linked account: ${mcUser.trim()}` };
  }

  // Cross-tab sync listener
  try {
    if (typeof root.BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('vortex_credit_sync');
      channel.onmessage = (e) => {
        if (e.data && e.data.type === 'WALLET_SYNC' && typeof root.dispatchEvent === 'function') {
          root.dispatchEvent(new CustomEvent('vortex-credits', { detail: e.data.wallet }));
        }
      };
    }
  } catch(e) {}

  root.VortexCredits = {
    load, save, welcome, buyCredits, spend, equip, exportCode, redeem, owned,
    recentHistory, ITEM_CATALOG, ITEM_LABELS, ITEM_COSTS, linkMc,
    getBalance: function() { return load().credits; },
    add: function(amt) {
      const wallet = load();
      wallet.credits += Number(amt) || 0;
      save(wallet);
      return wallet.credits;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
