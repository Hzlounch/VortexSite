(function (root) {
  const KEY = 'vortex_wallet_v1';
  const USED = 'vortex_used_codes_v1';
  const SECRET = 'VORTEX-CREDIT-v1';

  function load() {
    try {
      return Object.assign({ credits: 0, claimed: '', owned: [], welcome: false }, JSON.parse(localStorage.getItem(KEY) || '{}'));
    } catch {
      return { credits: 0, claimed: '', owned: [], welcome: false };
    }
  }

  function save(wallet) {
    localStorage.setItem(KEY, JSON.stringify(wallet));
    root.dispatchEvent(new CustomEvent('vortex-credits', { detail: wallet }));
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
      wallet.credits += 150;
      save(wallet);
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
    return { ok: true, message: '+75 Vortex Credits claimed.', wallet };
  }

  function spend(id, cost) {
    const wallet = load();
    if (wallet.owned.includes(id)) return { ok: false, message: 'Already owned.', wallet };
    if (wallet.credits < cost) return { ok: false, message: 'Not enough credits.', wallet };
    wallet.credits -= cost;
    wallet.owned.push(id);
    save(wallet);
    return { ok: true, message: 'Unlocked.', wallet };
  }

  function exportCode(amount) {
    const wallet = load();
    const n = Math.min(wallet.credits, Math.max(0, Number(amount) || wallet.credits));
    if (n < 1) return { ok: false, message: 'No credits to send.', wallet };
    wallet.credits -= n;
    save(wallet);
    const id = Math.random().toString(36).slice(2, 8);
    const payload = `${n}.${id}.${Date.now()}`;
    return { ok: true, code: `VX1-${payload}-${hash(payload + SECRET).slice(0, 6)}`, amount: n, wallet };
  }

  function redeem(code) {
    const raw = String(code || '').trim();
    const match = raw.match(/^VX1-(\d+)\.([a-z0-9]+)\.(\d+)-([a-f0-9]+)$/i);
    if (!match) return { ok: false, message: 'Invalid transfer code.', wallet: load() };
    const payload = `${match[1]}.${match[2]}.${match[3]}`;
    if (hash(payload + SECRET).slice(0, 6).toLowerCase() !== match[4].toLowerCase()) {
      return { ok: false, message: 'Code checksum failed.', wallet: load() };
    }
    const used = JSON.parse(localStorage.getItem(USED) || '[]');
    if (used.includes(match[2])) return { ok: false, message: 'This code was already redeemed here.', wallet: load() };
    used.push(match[2]);
    localStorage.setItem(USED, JSON.stringify(used));
    const wallet = load();
    wallet.credits += Number(match[1]);
    save(wallet);
    return { ok: true, amount: Number(match[1]), message: `+${match[1]} credits received.`, wallet };
  }

  root.VortexCredits = { load, save, welcome, daily, spend, exportCode, redeem };
})(typeof window !== 'undefined' ? window : globalThis);
