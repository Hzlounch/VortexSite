(function (root) {
  const KEY = 'vortex_wallet_v1';
  const USED = 'vortex_used_codes_v1';
  const HISTORY = 'vortex_history_v1';
  const SECRET_V1 = 'VORTEX-CREDIT-v1';
  const SECRET_V2 = 'VORTEX-CREDIT-v2';
  const API_BASE = (root.VORTEX_BOT_URL || '').replace(/\/$/, '');
  const ITEM_LABELS = { cape: 'Vortex Cape', wings: 'Quantum Wings', plus: 'Vortex Plus' };
  const ITEM_COSTS = { cape: 400, wings: 650, plus: 900 };

  function load() {
    try {
      return Object.assign({ credits: 0, claimed: '', owned: [], welcome: false, linkedMc: '', linkedAt: 0 },
        JSON.parse(localStorage.getItem(KEY) || '{}'));
    } catch {
      return { credits: 0, claimed: '', owned: [], welcome: false, linkedMc: '', linkedAt: 0 };
    }
  }

  function save(wallet) {
    localStorage.setItem(KEY, JSON.stringify(wallet));
    root.dispatchEvent(new CustomEvent('vortex-credits', { detail: wallet }));
  }

  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY) || '[]'); } catch { return []; }
  }
  function saveHistory(list) {
    const trimmed = (list || []).slice(-50);
    localStorage.setItem(HISTORY, JSON.stringify(trimmed));
  }
  function addTx(kind, amount, label, extra) {
    const list = loadHistory();
    list.push({ kind, amount: Number(amount) || 0, label, ts: Date.now(), extra: extra || null });
    saveHistory(list);
    root.dispatchEvent(new CustomEvent('vortex-credits-tx', { detail: list.slice(-20).reverse() }));
    return list;
  }
  function recentHistory(n) { return loadHistory().slice(-(n || 10)).reverse(); }

  function hash(value) {
    let h = 2166136261;
    for (let i = 0; i < value.length; i += 1) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
    return (h >>> 0).toString(16);
  }

  function welcome() {
    const wallet = load();
    if (!wallet.welcome) {
      wallet.welcome = true;
      wallet.credits += 150;
      save(wallet);
      addTx('welcome', 150, 'Welcome bonus');
    }
    return wallet;
  }

  function daily() {
    const wallet = load();
    const day = new Date().toISOString().slice(0, 10);
    if (wallet.claimed === day) return { ok: false, message: 'Already claimed today.', wallet };
    wallet.claimed = day;
    wallet.credits += 75;
    save(wallet);
    addTx('daily', 75, 'Daily claim');
    return { ok: true, message: '+75 Vortex Credits claimed.', wallet };
  }

  function spend(id, cost) {
    const wallet = load();
    if (wallet.owned.includes(id)) return { ok: false, message: 'Already owned.', wallet };
    const price = Number(cost) || ITEM_COSTS[id] || 0;
    if (wallet.credits < price) return { ok: false, message: 'Not enough credits.', wallet };
    wallet.credits -= price;
    wallet.owned.push(id);
    save(wallet);
    addTx('spend', -price, 'Unlocked ' + (ITEM_LABELS[id] || id), { item: id });
    return { ok: true, message: 'Unlocked.', wallet };
  }

  function owned(id) { return load().owned.includes(id); }

  function exportCode(amount) {
    const wallet = load();
    const n = Math.min(wallet.credits, Math.max(0, Number(amount) || wallet.credits));
    if (n < 1) return { ok: false, message: 'No credits to send.', wallet };
    wallet.credits -= n;
    save(wallet);
    const id = Math.random().toString(36).slice(2, 8);
    const payload = `${n}.${id}.${Date.now()}`;
    const code = `VX2-${payload}-${hash(payload + SECRET_V2).slice(0, 6)}`;
    addTx('export', -n, 'Transfer code created');
    return { ok: true, code, amount: n, wallet };
  }

  function redeem(code) {
    const raw = String(code || '').trim();
    const m2 = raw.match(/^VX2-(\d+)\.([a-z0-9]+)\.(\d+)-([a-f0-9]+)$/i);
    const m1 = raw.match(/^VX1-(\d+)\.([a-z0-9]+)\.(\d+)-([a-f0-9]+)$/i);
    const match = m2 || m1;
    if (!match) return { ok: false, message: 'Invalid transfer code.', wallet: load() };
    const payload = `${match[1]}.${match[2]}.${match[3]}`;
    const secret = m2 ? SECRET_V2 : SECRET_V1;
    if (hash(payload + secret).slice(0, 6).toLowerCase() !== match[4].toLowerCase()) {
      return { ok: false, message: 'Code checksum failed.', wallet: load() };
    }
    const used = JSON.parse(localStorage.getItem(USED) || '[]');
    if (used.includes(match[2])) return { ok: false, message: 'This code was already redeemed here.', wallet: load() };
    used.push(match[2]);
    localStorage.setItem(USED, JSON.stringify(used));
    const wallet = load();
    const n = Number(match[1]);
    wallet.credits += n;
    save(wallet);
    addTx('redeem', n, 'Transfer code redeemed');
    return { ok: true, amount: n, message: `+${n} credits received.`, wallet };
  }

  async function apiFetch(verb, path, body) {
    if (!API_BASE) return { ok: false, offline: true, error: 'API not configured.' };
    try {
      const resp = await fetch(API_BASE + path, {
        method: verb,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
      return await resp.json().catch(() => ({ ok: resp.ok, status: resp.status }));
    } catch (err) {
      return { ok: false, offline: true, error: String(err && err.message || err) };
    }
  }

  async function syncFromApi(mcUser) {
    if (!mcUser) return { ok: false, error: 'No Minecraft user linked.' };
    const data = await apiFetch('GET', '/api/credits/' + encodeURIComponent(mcUser));
    if (!data || !data.ok) return { ok: false, error: (data && data.error) || 'Sync failed.' };
    const wallet = load();
    const newCredits = Math.max(wallet.credits, Number(data.balance) || 0);
    const serverOwned = Array.isArray(data.owned) ? data.owned : [];
    const mergedOwned = Array.from(new Set([...wallet.owned, ...serverOwned]));
    if (newCredits !== wallet.credits || mergedOwned.length !== wallet.owned.length) {
      wallet.credits = newCredits;
      wallet.owned = mergedOwned;
      save(wallet);
    }
    return { ok: true, wallet, remote: data };
  }

  function linkMc(mcUser) {
    if (!/^[A-Za-z0-9_]{3,16}$/.test(mcUser || '')) return { ok: false, error: 'Invalid Minecraft username.' };
    const wallet = load();
    wallet.linkedMc = mcUser.trim();
    wallet.linkedAt = Date.now();
    save(wallet);
    return { ok: true, wallet };
  }

  root.VortexCredits = {
    load, save, welcome, daily, spend, exportCode, redeem, owned,
    recentHistory, ITEM_LABELS, ITEM_COSTS, linkMc, syncFromApi, apiFetch
  };
})(typeof window !== 'undefined' ? window : globalThis);
