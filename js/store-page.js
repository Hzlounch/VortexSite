/* VORTEX STORE — Vortex+ status + Coins only. No products, no collections,
   no catalog, no grids. Balances, history and redemption are read from
   (or written through) the real backend; every failure shows an honest
   state instead of demo numbers. Entitlement reads go through
   js/vortex-plus.js (server truth, never local flags). */
import { fetchPlusStatus, statusPill, badgeHTML } from './vortex-plus.js';

(function () {
  var account = null; // {me, mc, coins, plus} or null
  var plusState = { state: 'loading', plus: false };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

  function fmtCoins(n) {
    return Number(n || 0).toLocaleString();
  }

  function paintBalances() {
    var label, sub;
    if (!account) {
      label = '—';
      sub = 'Sign in with Discord to see your real balance.';
    } else if (account.coins === null || account.coins === undefined) {
      label = '—';
      sub = 'Balance unavailable — the coin service is unreachable right now.';
    } else {
      label = fmtCoins(account.coins);
      sub = 'Live balance from your Vortex wallet' +
        (account.mc ? ' · ' + account.mc : ' · link Minecraft to earn the welcome bonus') + '.';
    }
    document.querySelectorAll('[data-credit]').forEach(function (el) { el.textContent = label; });
    var big = document.getElementById('coinBig');
    if (big) big.textContent = label;
    var note = document.getElementById('coinNote');
    if (note) note.textContent = sub;
    var pill = document.getElementById('plusState');
    if (pill) pill.innerHTML = statusPill(plusState);
  }

  function loadAccount() {
    var wrap = document.getElementById('accountWrap');
    function renderLogin() {
      account = null;
      plusState = { state: 'unavailable', reason: 'signed-out', plus: false };
      if (wrap) {
        wrap.innerHTML = '<a class="btn btn-secondary sm" href="/api/discord-login"><i class="fa-brands fa-discord"></i> <span>Login</span></a>';
      }
      paintBalances();
    }
    paintBalances();
    fetchPlusStatus().then(function (s) {
      plusState = s;
      if (s.state === 'unavailable' && s.reason === 'signed-out') { renderLogin(); return; }
      var me = s.me || {};
      account = {
        me: me,
        mc: s.mc || null,
        coins: (s.coins === null || s.coins === undefined) ? null : s.coins,
        plus: !!s.plus,
      };
      renderAccount();
      paintBalances();
    }).catch(renderLogin);

    function renderAccount() {
      if (!wrap || !account) { renderLogin(); return; }
      var me = account.me || {};
      var coins = (account.coins === null || account.coins === undefined)
        ? '<span title="Coin service unreachable">— coins</span>'
        : '<b>' + fmtCoins(account.coins) + ' coins</b>';
      wrap.innerHTML =
        '<div class="acct" id="acctBtn">' +
        (me.avatar ? '<img src="' + esc(me.avatar) + '" alt="">' : '<span class="acct-fb">V</span>') +
        '<span class="acct-name">' + esc(me.displayName || me.username || '') + '</span>' +
        badgeHTML(plusState) +
        '<span class="acct-coins">' + coins + '</span>' +
        '<div class="acct-menu" id="acctMenu" hidden>' +
        (account.mc ? '<div class="acct-row">Minecraft: <b>' + esc(account.mc) + '</b></div>'
          : '<div class="acct-row">Minecraft: <a href="/link-minecraft.html">link account</a></div>') +
        '<div class="acct-row">Vortex+: <b>' + (plusState.state === 'active' ? 'Active' : 'Standard') + '</b></div>' +
        '<a class="acct-row" href="/api/logout">Logout</a>' +
        '</div></div>';
      var btn = document.getElementById('acctBtn');
      var menu = document.getElementById('acctMenu');
      if (btn && menu) {
        btn.onclick = function () { menu.hidden = !menu.hidden; };
        document.addEventListener('click', function h(ev) {
          if (!menu.hidden && btn && !btn.contains(ev.target)) menu.hidden = true;
        });
      }
    }
  }

  function modalShell(inner) {
    var m = document.getElementById('storeModal');
    if (!m) {
      m = document.createElement('div');
      m.id = 'storeModal';
      m.className = 'store-modal';
      document.body.appendChild(m);
    }
    m.innerHTML = '<div class="store-modal-box">' +
      '<button class="store-modal-x" id="storeModalX">✕</button>' + inner + '</div>';
    m.classList.add('open');
    document.getElementById('storeModalX').onclick = function () { m.classList.remove('open'); };
    m.onclick = function (e) { if (e.target === m) m.classList.remove('open'); };
    return m;
  }

  function historyHTML(rows) {
    if (!rows.length) {
      return '<p class="empty-note">No coin activity yet. Link your account to claim the +100 welcome bonus.</p>';
    }
    return '<ul class="tx-list">' + rows.map(function (h) {
      var amt = Number(h.amount || 0);
      var cls = amt < 0 ? 'neg' : 'pos';
      var when = '';
      try { when = h.at ? new Date(h.at).toLocaleString() : ''; } catch (e) {}
      return '<li><span class="tx-amt ' + cls + '">' + (amt > 0 ? '+' : '') + fmtCoins(amt) + '</span>' +
        '<span class="tx-note">' + esc(h.note || 'Coin activity') + '</span>' +
        (when ? '<span class="tx-when">' + esc(when) + '</span>' : '') + '</li>';
    }).join('') + '</ul>';
  }

  function openCoins() {
    var bal = (account && account.coins !== null && account.coins !== undefined)
      ? fmtCoins(account.coins) + ' coins' : 'sign in to see balance';
    var m = modalShell(
      '<h2>Vortex Coins</h2>' +
      '<p class="detail-desc">Balance: <b>' + esc(bal) + '</b></p>' +
      '<p class="detail-desc">Earn coins with the <b>+100 verified-link bonus</b>, Discord events and gift codes. ' +
      'Direct coin purchases are <b>coming soon</b> — nothing is charged here.</p>' +
      '<div class="redeem-row"><input id="redeemCode" type="text" placeholder="Gift code (e.g. VX2-…)" autocomplete="off" aria-label="Gift code">' +
      '<button class="btn btn-primary sm" id="redeemBtn" type="button">Redeem</button></div>' +
      '<p class="detail-desc" id="redeemMsg" role="status"></p>' +
      '<h3 class="inv-h">Recent activity</h3><div id="coinHistory"><p class="empty-note">Loading…</p></div>' +
      '<a class="btn btn-secondary sm" href="socials.html" style="margin-top:10px">Join Discord</a>');
    var btn = document.getElementById('redeemBtn');
    var inp = document.getElementById('redeemCode');
    var msg = document.getElementById('redeemMsg');
    function say(t, ok) {
      if (msg) { msg.textContent = t; msg.style.color = ok ? '#4ADE80' : '#F87171'; }
      if (ok) toast(t, true); else if (t) toast(t, false);
    }
    if (btn) btn.onclick = function () {
      var code = inp && inp.value ? inp.value.trim() : '';
      if (!code) { say('Enter a gift code first.', false); return; }
      btn.disabled = true;
      say('Redeeming…', true);
      fetch('/api/credits-redeem', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', body: JSON.stringify({ code: code }),
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          btn.disabled = false;
          if (d && d.ok) {
            say((d.message || 'Code redeemed.') + ' Balance updated below.', true);
            loadAccount();
            loadHistory();
          } else {
            say((d && (d.message || d.error)) || 'Redemption failed.', false);
          }
        })
        .catch(function () { btn.disabled = false; say('Redemption service unreachable.', false); });
    };
    loadHistory();
  }

  function loadHistory() {
    var host = document.getElementById('coinHistory');
    if (!host) return;
    fetch('/api/credits-history', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || d.ok !== true) { host.innerHTML = '<p class="empty-note">Activity unavailable right now.</p>'; return; }
        if (d.configured === false) { host.innerHTML = '<p class="empty-note">Activity unavailable — the coin service is not configured.</p>'; return; }
        if (d.linked === false) { host.innerHTML = '<p class="empty-note"><a href="/link-minecraft.html">Link your Minecraft account</a> to see coin activity.</p>'; return; }
        host.innerHTML = historyHTML(d.history || []);
      })
      .catch(function () { host.innerHTML = '<p class="empty-note">Activity unavailable right now.</p>'; });
  }

  function boot() {
    loadAccount();
    loadHistory();
    document.body.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.getAttribute) return;
      var coins = t.getAttribute('data-coins');
      if (coins) { openCoins(); return; }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
