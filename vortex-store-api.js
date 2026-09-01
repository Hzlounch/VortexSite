/* ==========================================================================
   VORTEXLAUNCHER — OFFICIAL STORE & VORTEX CREDITS TOP-UP API
   ========================================================================== */

function makeCreditPackSvg(crAmount, color, tryPrice) {
  const rawSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 180" width="300" height="180">
      <defs>
        <linearGradient id="grad_${crAmount}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#09162a" />
          <stop offset="100%" stop-color="#030812" />
        </linearGradient>
      </defs>
      <rect width="300" height="180" rx="16" fill="url(#grad_${crAmount})" stroke="${color}" stroke-width="2"/>
      <circle cx="150" cy="65" r="32" fill="rgba(255,215,0,0.1)" stroke="${color}" stroke-width="3"/>
      <text x="150" y="74" font-family="sans-serif" font-weight="900" font-size="24" fill="${color}" text-anchor="middle">CR</text>
      <text x="150" y="130" font-family="sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle">+${crAmount.toLocaleString()} CR</text>
      <text x="150" y="152" font-family="sans-serif" font-weight="800" font-size="13" fill="#fbbf24" text-anchor="middle">₺${tryPrice} TRY</text>
    </svg>
  `.trim();

  const base64 = typeof btoa === 'function'
    ? btoa(unescape(encodeURIComponent(rawSvg)))
    : Buffer.from(rawSvg).toString('base64');

  return 'data:image/svg+xml;base64,' + base64;
}

const CREDIT_PACKAGES_CATALOG = [
  {
    id: "cr-pack-250",
    title: "250 Vortex Credits",
    crAmount: 250,
    tryPrice: "49.90",
    usdPrice: "1.99",
    badge: "STARTER",
    description: "Ideal starter credit pack for small launcher purchases.",
    imgUrl: makeCreditPackSvg(250, "#38bdf8", "49.90")
  },
  {
    id: "cr-pack-500",
    title: "500 Vortex Credits",
    crAmount: 500,
    tryPrice: "89.90",
    usdPrice: "3.49",
    badge: "BASIC",
    description: "Standard credit package with bonus XP.",
    imgUrl: makeCreditPackSvg(500, "#00f0ff", "89.90")
  },
  {
    id: "cr-pack-1000",
    title: "1,000 Vortex Credits",
    crAmount: 1000,
    tryPrice: "169.90",
    usdPrice: "6.99",
    badge: "POPULAR",
    description: "Our most popular credit top-up pack with +100 bonus CR.",
    imgUrl: makeCreditPackSvg(1000, "#a855f7", "169.90")
  },
  {
    id: "cr-pack-2500",
    title: "2,500 Vortex Credits",
    crAmount: 2500,
    tryPrice: "399.90",
    usdPrice: "14.99",
    badge: "PRO PACK",
    description: "Pro top-up pack offering +300 bonus CR.",
    imgUrl: makeCreditPackSvg(2500, "#10b981", "399.90")
  },
  {
    id: "cr-pack-5000",
    title: "5,000 Vortex Credits",
    crAmount: 5000,
    tryPrice: "749.90",
    usdPrice: "29.99",
    badge: "BEST VALUE",
    description: "Best value bundle with +750 bonus CR included.",
    imgUrl: makeCreditPackSvg(5000, "#fbbf24", "749.90")
  },
  {
    id: "cr-pack-10000",
    title: "10,000 Vortex Credits",
    crAmount: 10000,
    tryPrice: "1,399.90",
    usdPrice: "54.99",
    badge: "VIP BUNDLE",
    description: "VIP credit package with +2,000 bonus CR.",
    imgUrl: makeCreditPackSvg(10000, "#f43f5e", "1,399.90")
  },
  {
    id: "cr-pack-25000",
    title: "25,000 Vortex Credits",
    crAmount: 25000,
    tryPrice: "3,299.90",
    usdPrice: "129.99",
    badge: "ULTIMATE",
    description: "Ultimate top-up bundle with +5,000 bonus CR.",
    imgUrl: makeCreditPackSvg(25000, "#ec4899", "3,299.90")
  },
  {
    id: "cr-pack-50000",
    title: "50,000 Vortex Credits",
    crAmount: 50000,
    tryPrice: "6,499.90",
    usdPrice: "249.99",
    badge: "TITAN",
    description: "Titan credit pack with +12,000 bonus CR included.",
    imgUrl: makeCreditPackSvg(50000, "#8b5cf6", "6,499.90")
  },
  {
    id: "cr-pack-100000",
    title: "100,000 Vortex Credits",
    crAmount: 100000,
    tryPrice: "11,999.90",
    usdPrice: "449.99",
    badge: "LEGENDARY WHALE",
    description: "Legendary massive credit pack with +30,000 bonus CR for top supporters.",
    imgUrl: makeCreditPackSvg(100000, "#eab308", "11,999.90")
  }
];

class VortexStoreManager {
  getCatalog() {
    return CREDIT_PACKAGES_CATALOG;
  }

  get credits() {
    return window.VortexCredits ? window.VortexCredits.getBalance() : 1900;
  }

  processRealMoneyPayment(packId, paymentMethod, customerDetails) {
    const pack = CREDIT_PACKAGES_CATALOG.find(p => p.id === packId);
    if (!pack) return { success: false, message: "Package not found!" };

    let newTotal = this.credits;
    if (window.VortexCredits && typeof window.VortexCredits.add === 'function') {
      newTotal = window.VortexCredits.add(pack.crAmount);
    }

    window.dispatchEvent(new CustomEvent('vortex:store-updated', { detail: { packId, amount: pack.crAmount, paymentMethod, newTotal } }));

    return {
      success: true,
      newTotal,
      message: `Payment Successful! +${pack.crAmount.toLocaleString()} CR added to your wallet! (Total: ${newTotal.toLocaleString()} CR)`
    };
  }

  redeemCreditCode(codeStr) {
    const clean = (codeStr || '').trim().toUpperCase();
    if (clean === "VORTEX2026") {
      if (localStorage.getItem('vortex_promo_vortex2026')) {
        return { success: false, message: "Promo code VORTEX2026 already redeemed!" };
      }
      localStorage.setItem('vortex_promo_vortex2026', 'true');
      let newTotal = this.credits;
      if (window.VortexCredits && typeof window.VortexCredits.add === 'function') {
        newTotal = window.VortexCredits.add(1000);
      }
      window.dispatchEvent(new CustomEvent('vortex:store-updated', { detail: { action: 'promo', amount: 1000 } }));
      return { success: true, message: "+1000 Vortex Credits added to your account!" };
    }
    return { success: false, message: "Invalid promo code." };
  }
}

window.VortexStoreAPI = new VortexStoreManager();
