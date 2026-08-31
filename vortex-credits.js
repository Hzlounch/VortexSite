/**
 * Vortex Credits System v2.5 - Enhanced Web & Launcher Integration
 * Features: Wallet State, Purchase Credits, Code Export & Redeem, Cosmetics Catalog, Equip & Inventory
 */
(function (root) {
  const KEY = 'vortex_wallet_v2';
  const USED = 'vortex_used_codes_v2';
  const HISTORY = 'vortex_history_v2';
  const SECRET_V2 = 'VORTEX-CREDIT-v2-ENHANCED';

  const ITEM_CATALOG = {
    cape: { id: 'cape', title: 'Vortex Quantum Cape', cost: 400, type: 'cape', rarity: 'epic', desc: 'Signature animated cyan energy cape with pulsing trails.', icon: 'fa-solid fa-shirt', badge: 'EPIC' },
    wings: { id: 'wings', title: 'Aether Cyber Wings', cost: 650, type: 'wings', rarity: 'legendary', desc: 'Holographic cyber wings radiating neon particles on jump.', icon: 'fa-solid fa-feather-pointed', badge: 'LEGENDARY' },
    halo: { id: 'halo', title: 'Celestial Plasma Halo', cost: 500, type: 'halo', rarity: 'epic', desc: 'Floating plasma crown with dynamic color cycling.', icon: 'fa-solid fa-circle-notch', badge: 'EPIC' },
    aura: { id: 'aura', title: 'Void Rift Aura', cost: 800, type: 'aura', rarity: 'mythic', desc: 'Surrounding vortex gravitational distortion and particle vortex.', icon: 'fa-solid fa-wand-magic-sparkles', badge: 'MYTHIC' },
    plus: { id: 'plus', title: 'Vortex Plus Rank', cost: 1000, type: 'rank', rarity: 'mythic', desc: 'Unlocks custom nametag gradient, priority queues, and 2x daily credits.', icon: 'fa-solid fa-crown', badge: 'RANK' }
  };

  const ITEM_LABELS = Object.fromEntries(Object.entries(ITEM_CATALOG).map(([k, v]) => [k, v.title]));
  const ITEM_COSTS = Object.fromEntries(Object.entries(ITEM_CATALOG).map(([k, v]) => [k, v.cost]));

  function load() {
    let state = {
      credits: 250, // Default starter credits
      xp: 300,
      level: 1,
      streak: 1,
      lastDaily: 0,
      welcome: true,
      owned: [],
      equipped: {},
      linkedMc: ''
    };

    try {
      const stored = localStorage.getItem(KEY);
      if (stored) {
        state = Object.assign(state, JSON.parse(stored));
      } else {
        localStorage.setItem(KEY, JSON.stringify(state));
      }
    } catch (e) {
      console.warn('[VortexCredits] Error loading wallet:', e);
    }
    return state;
  }

  function save(wallet) {
    wallet.level = Math.max(1, Math.floor(Math.sqrt((wallet.xp || 0) / 50)) + 1);
    try {
      localStorage.setItem(KEY, JSON.stringify(wallet));
    } catch(e) {}
    
    if (typeof root.dispatchEvent === 'function') {
      root.dispatchEvent(new CustomEvent('vortex-credits', { detail: wallet }));
    }
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
    const trimmed = (list || []).slice(-50);
    try { localStorage.setItem(HISTORY, JSON.stringify(trimmed)); } catch(e) {}
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

  function buyCredits(amount, usdPrice) {
    const wallet = load();
    const cr = Number(amount) || 0;
    if (cr <= 0) return { ok: false, message: 'Invalid amount' };
    
    wallet.credits += cr;
    wallet.xp += cr;
    save(wallet);
    addTx('purchase', cr, `Purchased +${cr} CR ($${usdPrice})`);
    
    return {
      ok: true,
      amount: cr,
      message: `Successfully added +${cr} CR to your account!`,
      wallet
    };
  }

  function claimDaily() {
    const wallet = load();
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (now - (wallet.lastDaily || 0) < oneDay) {
      const remainingMs = oneDay - (now - wallet.lastDaily);
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      return { ok: false, message: `Daily reward available in ${hours}h ${mins}m.` };
    }

    const reward = 100 + (wallet.streak || 0) * 20;
    wallet.credits += reward;
    wallet.xp += 150;
    wallet.streak = (wallet.streak || 0) + 1;
    wallet.lastDaily = now;
    save(wallet);
    addTx('daily', reward, `Daily Reward (+${reward} CR)`);
    return { ok: true, amount: reward, message: `Claimed +${reward} Daily Credits! Current Streak: ${wallet.streak} Days.` };
  }

  function spend(id) {
    const wallet = load();
    const item = ITEM_CATALOG[id];
    if (!item) return { ok: false, message: 'Invalid cosmetic item.' };
    if (wallet.owned.includes(id)) return { ok: false, message: 'You already own this cosmetic!' };

    if (wallet.credits < item.cost) {
      return { ok: false, message: `Insufficient credits! You need ${item.cost - wallet.credits} more CR.` };
    }
    
    wallet.credits -= item.cost;
    wallet.xp += item.cost * 3;
    wallet.owned.push(id);
    save(wallet);
    addTx('spend', -item.cost, `Unlocked ${item.title}`);
    return { ok: true, message: `Unlocked ${item.title}!`, wallet };
  }

  function equip(id) {
    const wallet = load();
    if (!wallet.owned.includes(id)) return { ok: false, message: 'Item not owned!' };
    wallet.equipped = wallet.equipped || {};
    const item = ITEM_CATALOG[id];
    const cat = (item && item.type) || 'cosmetic';

    if (wallet.equipped[cat] === id) {
      delete wallet.equipped[cat]; // Unequip
      save(wallet);
      return { ok: true, equipped: wallet.equipped, message: `Unequipped ${item.title}` };
    } else {
      wallet.equipped[cat] = id; // Equip
      save(wallet);
      return { ok: true, equipped: wallet.equipped, message: `Equipped ${item.title}` };
    }
  }

  function exportCode(amount) {
    const wallet = load();
    const n = Math.min(wallet.credits, Math.max(1, Number(amount) || 100));
    if (wallet.credits < n) return { ok: false, message: `Insufficient credits to generate ${n} CR code.` };
    
    wallet.credits -= n;
    save(wallet);
    const id = Math.random().toString(36).slice(2, 8);
    const payload = `${n}.${id}.${Date.now()}`;
    const code = `VX2-${payload}-${hash(payload + SECRET_V2).slice(0, 6)}`;
    addTx('export', -n, `Generated Transfer Code for ${n} CR`);
    return { ok: true, code, amount: n, wallet };
  }

  function redeem(code) {
    const raw = String(code || '').trim().toUpperCase();
    const match = raw.match(/^VX2-(\d+)\.([A-Z0-9]+)\.(\d+)-([A-F0-9]+)$/i);
    
    if (!match) return { ok: false, message: 'Invalid code format. Expected format: VX2-XXX.XXX.XXX-XXXXXX' };
    const payload = `${match[1]}.${match[2].toLowerCase()}.${match[3]}`;
    
    if (hash(payload + SECRET_V2).slice(0, 6).toLowerCase() !== match[4].toLowerCase()) {
      return { ok: false, message: 'Invalid or forged transfer code.' };
    }
    
    const used = JSON.parse(localStorage.getItem(USED) || '[]');
    if (used.includes(match[2])) return { ok: false, message: 'This transfer code has already been redeemed.' };
    
    used.push(match[2]);
    try { localStorage.setItem(USED, JSON.stringify(used)); } catch(e) {}
    
    const wallet = load();
    const n = Number(match[1]);
    wallet.credits += n;
    wallet.xp += n * 2;
    save(wallet);
    addTx('redeem', n, `Redeemed Transfer Code (+${n} CR)`);
    return { ok: true, amount: n, message: `Successfully redeemed +${n} Vortex Credits!`, wallet };
  }

  function linkMc(mcUser) {
    if (!/^[A-Za-z0-9_]{3,16}$/.test(mcUser || '')) return { ok: false, message: 'Invalid Minecraft username (3-16 alphanumeric characters).' };
    const wallet = load();
    wallet.linkedMc = mcUser.trim();
    save(wallet);
    addTx('link', 50, `Linked Minecraft: ${mcUser.trim()}`);
    return { ok: true, wallet, message: `Successfully linked Minecraft account: ${mcUser.trim()}` };
  }

  root.VortexCredits = {
    load, save, buyCredits, claimDaily, spend, equip, exportCode, redeem, recentHistory, ITEM_CATALOG, ITEM_LABELS, ITEM_COSTS, linkMc
  };
})(typeof window !== 'undefined' ? window : globalThis);
