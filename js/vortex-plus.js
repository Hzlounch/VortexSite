/* Vortex+ entitlement client — the single entitlement reader on this site.
 *
 * Source of truth is ALWAYS the server: VortexBot wallet entitlements
 * (user.entitlements.vortex_plus). Nothing here is persisted locally, so
 * states are honest by construction:
 *   loading -> active | standard | unavailable
 * - active:      bot confirms vortex_plus (gold, unlocked)
 * - standard:    signed in, bot reachable, no plus flag (locked)
 * - unavailable: signed out | backend not configured | bot unreachable
 * Offline behavior: cached NOTHING — we re-check every load and never
 * strip or grant status without a server answer. No local file, flag, or
 * toggle can unlock Vortex+; the account chip and plus pages only render
 * what this module returns.
 */
function botBase() {
  try {
    var b = window.VORTEX_BOT_URL || localStorage.getItem('vortex_bot_url') || '';
    return String(b || '').replace(/\/$/, '');
  } catch (e) { return ''; }
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function fetchPlusStatus() {
  // Path 1 (preferred): server-side check (works with zero user config).
  try {
    var r = await fetch('/api/plus-status', { credentials: 'same-origin' });
    if (r.ok) {
      var s = await r.json();
      if (s && s.ok && s.configured !== false) {
        if (s.state === 'signed-out') {
          return { state: 'unavailable', reason: 'signed-out', plus: false };
        }
        if (s.state === 'active' || s.state === 'standard') {
          return {
            state: s.state, reason: s.state, plus: !!s.plus,
            me: s.me || {}, mc: s.mc || null,
            coins: (typeof s.coins === 'number') ? s.coins : null,
          };
        }
        // Server reachable but bot unreachable: fall through to direct check.
      }
    }
  } catch (e) { /* fall through to direct bot check */ }
  // Path 2: direct bot check (developer/local setups with a bot URL).
  var me;
  try {
    var r2 = await fetch('/api/me', { credentials: 'same-origin' });
    if (!r2.ok) return { state: 'unavailable', reason: 'signed-out', plus: false };
    me = await r2.json();
    if (!me || !me.ok) return { state: 'unavailable', reason: 'signed-out', plus: false };
  } catch (e) {
    return { state: 'unavailable', reason: 'signed-out', plus: false };
  }
  var base = botBase();
  if (!base) return { state: 'unavailable', reason: 'not-configured', plus: false, me: me };
  try {
    var a = await (await fetch(base + '/api/account/' + encodeURIComponent(me.id))).json();
    if (!a || !a.ok) return { state: 'unavailable', reason: 'bot-unreachable', plus: false, me: me };
    return {
      state: a.vortexPlus ? 'active' : 'standard',
      reason: a.vortexPlus ? 'active' : 'standard',
      plus: !!a.vortexPlus,
      me: me,
      mc: (a.linked && a.linked.mc) || null,
      coins: (typeof a.coins === 'number') ? a.coins : null,
    };
  } catch (e) {
    return { state: 'unavailable', reason: 'bot-unreachable', plus: false, me: me };
  }
}

export function statusPill(s) {
  if (!s || s.state === 'loading') {
    return '<span class="plus-state loading">Checking…</span>';
  }
  if (s.state === 'active') {
    return '<span class="plus-state on"><i class="fa-solid fa-crown"></i> Vortex+ Active</span>';
  }
  if (s.state === 'standard') {
    return '<span class="plus-state off"><i class="fa-solid fa-lock"></i> Standard — Locked</span>';
  }
  var why = s.reason === 'signed-out' ? 'Sign in to check'
    : s.reason === 'not-configured' ? 'Backend not configured'
    : 'Backend unreachable';
  return '<span class="plus-state na"><i class="fa-solid fa-circle-question"></i> Unavailable · ' + esc(why) + '</span>';
}

export function badgeHTML(s) {
  if (s && s.state === 'active') {
    return '<span class="acct-plus">Vortex+</span>';
  }
  return '';
}
