/* ==========================================================================
   VORTEXLAUNCHER — OFFICIAL LAUNCHER STORE & PACKAGES API
   ========================================================================== */

function makePackageSvg(title, iconColor, bgGradStart, bgGradEnd, subtitle) {
  const rawSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 180" width="300" height="180">
      <defs>
        <linearGradient id="grad_${title.replace(/\s+/g, '')}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgGradStart}" />
          <stop offset="100%" stop-color="${bgGradEnd}" />
        </linearGradient>
      </defs>
      <rect width="300" height="180" rx="16" fill="url(#grad_${title.replace(/\s+/g, '')})"/>
      <circle cx="150" cy="70" r="35" fill="rgba(255,255,255,0.08)" stroke="${iconColor}" stroke-width="3"/>
      <text x="150" y="78" font-family="sans-serif" font-weight="900" font-size="28" fill="${iconColor}" text-anchor="middle">VX</text>
      <text x="150" y="135" font-family="sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">${title.toUpperCase()}</text>
      <text x="150" y="155" font-family="sans-serif" font-weight="700" font-size="11" fill="rgba(255,255,255,0.7)" text-anchor="middle">${subtitle.toUpperCase()}</text>
    </svg>
  `.trim();

  const base64 = typeof btoa === 'function'
    ? btoa(unescape(encodeURIComponent(rawSvg)))
    : Buffer.from(rawSvg).toString('base64');

  return 'data:image/svg+xml;base64,' + base64;
}

const STORE_PACKAGES_CATALOG = [
  {
    id: "vortex-rank-vip",
    title: "Vortex VIP Pass",
    category: "ranks",
    price: 500,
    tryPrice: "249.90",
    badge: "RANK",
    description: "Unlocks VIP launcher badge, priority chunk loading queue, exclusive VIP animated name tag, and +25% XP multiplier.",
    imgUrl: makePackageSvg("Vortex VIP Pass", "#38bdf8", "#0f172a", "#0284c7", "Lifetime Rank Access")
  },
  {
    id: "vortex-rank-mvp",
    title: "Vortex MVP+ Subscription",
    category: "ranks",
    price: 1200,
    tryPrice: "599.90",
    badge: "POPULAR",
    description: "Includes all VIP perks + Custom Animated Client Title, Dedicated Multi-threading JVM Profile, and Unlimited Cloud Settings Backups.",
    imgUrl: makePackageSvg("Vortex MVP+ Pass", "#a855f7", "#1e1b4b", "#7e22ce", "Premium Subscription")
  },
  {
    id: "vortex-fps-booster-pro",
    title: "FPS Booster Pro Extension",
    category: "features",
    price: 800,
    tryPrice: "399.90",
    badge: "FEATURE",
    description: "Advanced GPU memory pipeline, custom Sodium/Iris shader optimizers, and low-latency tick processing engine.",
    imgUrl: makePackageSvg("FPS Booster Pro", "#10b981", "#064e3b", "#059669", "Performance Module")
  },
  {
    id: "vortex-badge-founder",
    title: "Founder Client Badge",
    category: "badges",
    price: 1500,
    tryPrice: "749.90",
    badge: "EXCLUSIVE",
    description: "Exclusive glowing Founder shield badge displayed next to your username across all Vortex Client lobbies.",
    imgUrl: makePackageSvg("Founder Badge", "#fbbf24", "#451a03", "#d97706", "Limited Collector Badge")
  },
  {
    id: "vortex-credits-starter",
    title: "1,000 Vortex Credits",
    category: "credits",
    price: 400,
    tryPrice: "199.90",
    badge: "CREDITS",
    description: "Instant top-up of 1,000 Vortex Credits (CR) to spend on any launcher upgrades or future perks.",
    imgUrl: makePackageSvg("1000 CR Pack", "#00f0ff", "#082f49", "#0284c7", "+1000 Credits Balance")
  },
  {
    id: "vortex-credits-mega",
    title: "5,000 Vortex Credits",
    category: "credits",
    price: 1800,
    tryPrice: "899.90",
    badge: "BEST VALUE",
    description: "Mega top-up bundle with 5,000 Vortex Credits (CR) + 500 bonus CR included.",
    imgUrl: makePackageSvg("5000 CR Mega Pack", "#f43f5e", "#4c0519", "#e11d48", "+5500 Total Credits")
  }
];

class VortexStoreManager {
  constructor() {
    this.storageKey = "vortex_owned_packages";
  }

  getCatalog() {
    return STORE_PACKAGES_CATALOG;
  }

  get credits() {
    return window.VortexCredits ? window.VortexCredits.getBalance() : 1900;
  }

  hasPackage(pkgId) {
    const owned = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    return owned.includes(pkgId);
  }

  purchasePackage(pkgId) {
    const pkg = STORE_PACKAGES_CATALOG.find(p => p.id === pkgId);
    if (!pkg) return { success: false, message: "Package not found!" };
    if (this.hasPackage(pkgId)) return { success: false, message: "You already own this package!" };

    if (!window.VortexCredits || !window.VortexCredits.spend(pkg.price)) {
      return { success: false, message: "Insufficient Vortex Credits (CR) balance!" };
    }

    const owned = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    owned.push(pkgId);
    localStorage.setItem(this.storageKey, JSON.stringify(owned));

    window.dispatchEvent(new CustomEvent('vortex:store-updated', { detail: { pkgId, action: 'purchased' } }));
    return { success: true, message: `Successfully purchased ${pkg.title}!` };
  }

  redeemCreditCode(codeStr) {
    const clean = (codeStr || '').trim().toUpperCase();
    if (clean === "VORTEX2026") {
      if (localStorage.getItem('vortex_promo_vortex2026')) {
        return { success: false, message: "Promo code VORTEX2026 already redeemed!" };
      }
      localStorage.setItem('vortex_promo_vortex2026', 'true');
      if (window.VortexCredits) window.VortexCredits.add(1000);
      return { success: true, message: "+1000 Vortex Credits added to your account!" };
    }
    return { success: false, message: "Invalid promo code." };
  }
}

window.VortexStoreAPI = new VortexStoreManager();
