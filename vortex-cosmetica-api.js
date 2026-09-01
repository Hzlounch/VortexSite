/* ==========================================================================
   VORTEXLAUNCHER — AUTHENTIC LUNAR CLIENT & MINECRAFT COSMETICS API
   ========================================================================== */

function makeSvgUrl(rawSvg) {
  // Use Base64 encoding for 100% universal browser <img> tag compatibility
  const cleaned = rawSvg.trim();
  const base64 = typeof btoa === 'function'
    ? btoa(unescape(encodeURIComponent(cleaned)))
    : Buffer.from(cleaned).toString('base64');
  return 'data:image/svg+xml;base64,' + base64;
}

const REAL_COSMETICS_CATALOG = [
  {
    id: "lunar-dragon-wings-black",
    title: "Dragon Wings (Black)",
    category: "wings",
    rarity: "MYTHIC",
    rarityColor: "#a855f7",
    price: 1900,
    tryPrice: "965.49",
    badge: "3D ANIMATED",
    description: "Authentic 3D animated dragon wings with dark obsidian scales, pitch-black feathers, and smooth flight particle animations.",
    imgUrl: makeSvgUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
        <rect width="300" height="200" fill="#070b12"/>
        <path d="M 150 140 Q 90 40 20 60 Q 70 110 120 120 Z" fill="#1e1b4b" stroke="#a855f7" stroke-width="4"/>
        <path d="M 150 140 Q 210 40 280 60 Q 230 110 180 120 Z" fill="#1e1b4b" stroke="#a855f7" stroke-width="4"/>
        <circle cx="150" cy="140" r="12" fill="#00f0ff"/>
        <text x="150" y="180" font-family="sans-serif" font-weight="900" font-size="14" fill="#a855f7" text-anchor="middle">DRAGON WINGS (BLACK)</text>
      </svg>
    `)
  },
  {
    id: "lunar-demon-wings-black",
    title: "Demon Wings (Black)",
    category: "wings",
    rarity: "LEGENDARY",
    rarityColor: "#ef4444",
    price: 1800,
    tryPrice: "914.65",
    badge: "3D SCALABLE",
    description: "Fiery black demon wings with glowing crimson veins and sharp outline geometry designed for PvP intensity.",
    imgUrl: makeSvgUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
        <rect width="300" height="200" fill="#070b12"/>
        <path d="M 150 130 L 30 30 L 70 120 L 130 130 Z" fill="#2d0606" stroke="#ef4444" stroke-width="4"/>
        <path d="M 150 130 L 270 30 L 230 120 L 170 130 Z" fill="#2d0606" stroke="#ef4444" stroke-width="4"/>
        <polygon points="150,110 140,140 160,140" fill="#ef4444"/>
        <text x="150" y="180" font-family="sans-serif" font-weight="900" font-size="14" fill="#ef4444" text-anchor="middle">DEMON WINGS (BLACK)</text>
      </svg>
    `)
  },
  {
    id: "minecon-2011-cape",
    title: "Minecon 2011 Cape",
    category: "cloaks",
    rarity: "MYTHIC",
    rarityColor: "#fbbf24",
    price: 2500,
    tryPrice: "1270.35",
    badge: "MINECON VINTAGE",
    description: "The legendary first-ever Minecon cape featuring the iconic red pickaxe on a dark slate background.",
    imgUrl: makeSvgUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
        <rect width="300" height="200" fill="#070b12"/>
        <rect x="100" y="20" width="100" height="140" rx="8" fill="#1e293b" stroke="#fbbf24" stroke-width="3"/>
        <path d="M 130 60 L 170 100 M 160 50 L 170 60 L 140 90" stroke="#ef4444" stroke-width="8" stroke-linecap="round"/>
        <text x="150" y="180" font-family="sans-serif" font-weight="900" font-size="14" fill="#fbbf24" text-anchor="middle">MINECON 2011 CAPE</text>
      </svg>
    `)
  },
  {
    id: "minecon-2012-cape",
    title: "Minecon 2012 / 2013 Cape",
    category: "cloaks",
    rarity: "LEGENDARY",
    rarityColor: "#00f0ff",
    price: 2200,
    tryPrice: "1117.90",
    badge: "CLASSIC MINECRAFT",
    description: "Authentic Minecon cape featuring the classic Golden Pickaxe and Piston emblem.",
    imgUrl: makeSvgUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
        <rect width="300" height="200" fill="#070b12"/>
        <rect x="100" y="20" width="100" height="140" rx="8" fill="#0f172a" stroke="#00f0ff" stroke-width="3"/>
        <rect x="130" y="50" width="40" height="40" fill="#fbbf24" rx="4"/>
        <path d="M 140 100 L 160 100 L 150 120 Z" fill="#00f0ff"/>
        <text x="150" y="180" font-family="sans-serif" font-weight="900" font-size="14" fill="#00f0ff" text-anchor="middle">MINECON 2012 CAPE</text>
      </svg>
    `)
  },
  {
    id: "minecon-2015-cape",
    title: "Minecon 2015 Golem Cape",
    category: "cloaks",
    rarity: "EPIC",
    rarityColor: "#3b82f6",
    price: 2000,
    tryPrice: "1016.28",
    badge: "IRON GOLEM",
    description: "Official 2015 Minecon cape featuring the Iron Golem face pattern.",
    imgUrl: makeSvgUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
        <rect width="300" height="200" fill="#070b12"/>
        <rect x="100" y="20" width="100" height="140" rx="8" fill="#334155" stroke="#3b82f6" stroke-width="3"/>
        <rect x="120" y="50" width="60" height="50" fill="#cbd5e1" rx="4"/>
        <rect x="130" y="65" width="10" height="10" fill="#ef4444"/>
        <rect x="160" y="65" width="10" height="10" fill="#ef4444"/>
        <text x="150" y="180" font-family="sans-serif" font-weight="900" font-size="14" fill="#3b82f6" text-anchor="middle">MINECON 2015 CAPE</text>
      </svg>
    `)
  },
  {
    id: "minecon-2016-cape",
    title: "Minecon 2016 Enderman Cape",
    category: "cloaks",
    rarity: "EPIC",
    rarityColor: "#a855f7",
    price: 2000,
    tryPrice: "1016.28",
    badge: "ENDERMAN",
    description: "Official 2016 Minecon cape with purple glowing Enderman eyes on deep dark purple fabric.",
    imgUrl: makeSvgUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
        <rect width="300" height="200" fill="#070b12"/>
        <rect x="100" y="20" width="100" height="140" rx="8" fill="#1e1b4b" stroke="#a855f7" stroke-width="3"/>
        <rect x="120" y="70" width="20" height="8" fill="#c084fc"/>
        <rect x="160" y="70" width="20" height="8" fill="#c084fc"/>
        <text x="150" y="180" font-family="sans-serif" font-weight="900" font-size="14" fill="#a855f7" text-anchor="middle">MINECON 2016 CAPE</text>
      </svg>
    `)
  },
  {
    id: "mojang-migrator-cape",
    title: "Mojang Migrator Cape",
    category: "cloaks",
    rarity: "RARE",
    rarityColor: "#ef4444",
    price: 1500,
    tryPrice: "762.21",
    badge: "MOJANG OFFICIAL",
    description: "The official Mojang account migration cape with bright crimson red fabric and gold accent crest.",
    imgUrl: makeSvgUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
        <rect width="300" height="200" fill="#070b12"/>
        <rect x="100" y="20" width="100" height="140" rx="8" fill="#991b1b" stroke="#ef4444" stroke-width="3"/>
        <path d="M 130 50 L 170 50 L 150 110 Z" fill="#fbbf24"/>
        <text x="150" y="180" font-family="sans-serif" font-weight="900" font-size="14" fill="#ef4444" text-anchor="middle">MIGRATOR CAPE</text>
      </svg>
    `)
  },
  {
    id: "optifine-standard-cape",
    title: "OptiFine Standard Cape (OF)",
    category: "cloaks",
    rarity: "RARE",
    rarityColor: "#10b981",
    price: 1200,
    tryPrice: "609.77",
    badge: "OPTIFINE HD",
    description: "Classic OptiFine cape featuring customisable OF banner lettering compatible with OptiFine and Sodium.",
    imgUrl: makeSvgUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
        <rect width="300" height="200" fill="#070b12"/>
        <rect x="100" y="20" width="100" height="140" rx="8" fill="#065f46" stroke="#10b981" stroke-width="3"/>
        <text x="150" y="100" font-family="sans-serif" font-weight="900" font-size="42" fill="#fff" text-anchor="middle">OF</text>
        <text x="150" y="180" font-family="sans-serif" font-weight="900" font-size="14" fill="#10b981" text-anchor="middle">OPTIFINE CAPE</text>
      </svg>
    `)
  },
  {
    id: "lunar-twerk-emote",
    title: "Twerk Dance Emote",
    category: "emotes",
    rarity: "UNCOMMON",
    rarityColor: "#38bdf8",
    price: 800,
    tryPrice: "406.51",
    badge: "60 FPS EMOTE",
    description: "Hilarious 60 FPS keyframe dance emote playable in lobbies and in-game matches.",
    imgUrl: makeSvgUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
        <rect width="300" height="200" fill="#070b12"/>
        <circle cx="150" cy="70" r="30" fill="none" stroke="#38bdf8" stroke-width="4"/>
        <path d="M 125 70 Q 150 90 175 70" stroke="#38bdf8" stroke-width="4" fill="none"/>
        <circle cx="138" cy="65" r="4" fill="#38bdf8"/>
        <circle cx="162" cy="65" r="4" fill="#38bdf8"/>
        <text x="150" y="180" font-family="sans-serif" font-weight="900" font-size="14" fill="#38bdf8" text-anchor="middle">TWERK EMOTE</text>
      </svg>
    `)
  },
  {
    id: "lunar-around-emote",
    title: "Around Dance Emote",
    category: "emotes",
    rarity: "UNCOMMON",
    rarityColor: "#38bdf8",
    price: 800,
    tryPrice: "406.51",
    badge: "60 FPS EMOTE",
    description: "360-degree spin emote with glowing ring effect.",
    imgUrl: makeSvgUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
        <rect width="300" height="200" fill="#070b12"/>
        <ellipse cx="150" cy="110" rx="60" ry="20" fill="none" stroke="#00f0ff" stroke-width="4" stroke-dasharray="8,4"/>
        <circle cx="150" cy="80" r="24" fill="#00f0ff"/>
        <text x="150" y="180" font-family="sans-serif" font-weight="900" font-size="14" fill="#00f0ff" text-anchor="middle">AROUND EMOTE</text>
      </svg>
    `)
  },
  {
    id: "lunar-darkness-bundle",
    title: "Darkness Cosmetic Bundle",
    category: "bundles",
    rarity: "MYTHIC",
    rarityColor: "#a855f7",
    price: 3200,
    tryPrice: "1626.05",
    badge: "SAVER BUNDLE",
    description: "Includes Black Dragon Wings + Minecon 2016 Cape + Dark Halo at a 30% discount.",
    imgUrl: makeSvgUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
        <rect width="300" height="200" fill="#070b12"/>
        <rect x="80" y="40" width="140" height="100" rx="12" fill="#1e1b4b" stroke="#a855f7" stroke-width="3"/>
        <text x="150" y="95" font-family="sans-serif" font-weight="900" font-size="18" fill="#00f0ff" text-anchor="middle">DARKNESS BUNDLE</text>
        <text x="150" y="120" font-family="sans-serif" font-weight="800" font-size="12" fill="#fbbf24" text-anchor="middle">3 ITEMS INCLUDED</text>
        <text x="150" y="180" font-family="sans-serif" font-weight="900" font-size="14" fill="#a855f7" text-anchor="middle">BUNDLE SAVE 30%</text>
      </svg>
    `)
  },
  {
    id: "vortex-cyber-cloak",
    title: "Vortex Cyber Cloak",
    category: "cloaks",
    rarity: "LEGENDARY",
    rarityColor: "#00f0ff",
    price: 1600,
    tryPrice: "813.02",
    badge: "VORTEX EXCLUSIVE",
    description: "Animated cyan cybernetic cloak with animated matrix streams.",
    imgUrl: makeSvgUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
        <rect width="300" height="200" fill="#070b12"/>
        <rect x="100" y="20" width="100" height="140" rx="8" fill="#032b45" stroke="#00f0ff" stroke-width="3"/>
        <path d="M 120 40 L 180 40 L 150 140 Z" fill="none" stroke="#00f0ff" stroke-width="2"/>
        <text x="150" y="180" font-family="sans-serif" font-weight="900" font-size="14" fill="#00f0ff" text-anchor="middle">CYBER CLOAK</text>
      </svg>
    `)
  }
];

class VortexCosmeticaManager {
  constructor() {
    this.storageKey = "vortex_owned_cosmetics";
    this.equippedKey = "vortex_equipped_cosmetics";

    // Default unlocked items
    this.ownedIds = new Set(JSON.parse(localStorage.getItem(this.storageKey) || '["optifine-standard-cape"]'));
    this.equippedIds = new Set(JSON.parse(localStorage.getItem(this.equippedKey) || '["optifine-standard-cape"]'));
  }

  getCatalog() {
    return REAL_COSMETICS_CATALOG;
  }

  get credits() {
    return window.VortexCredits ? window.VortexCredits.getBalance() : 1900;
  }

  hasItem(itemId) {
    return this.ownedIds.has(itemId);
  }

  isEquipped(itemId) {
    return this.equippedIds.has(itemId);
  }

  purchaseItemWithCredits(itemId) {
    const item = REAL_COSMETICS_CATALOG.find(i => i.id === itemId);
    if (!item) return { success: false, message: "Item not found!" };
    if (this.hasItem(itemId)) return { success: false, message: "You already own this cosmetic!" };

    if (!window.VortexCredits || !window.VortexCredits.spend(item.price)) {
      return { success: false, message: "Insufficient Vortex Credits (CR) balance!" };
    }

    this.ownedIds.add(itemId);
    this.equippedIds.add(itemId); // Auto-equip upon purchase
    this._save();

    window.dispatchEvent(new CustomEvent('vortex:store-updated', { detail: { itemId, action: 'purchased' } }));
    return { success: true, message: `Successfully purchased and equipped ${item.title}!` };
  }

  toggleEquipInGame(itemId) {
    if (!this.hasItem(itemId)) return { success: false, message: "Item must be unlocked first!" };

    if (this.equippedIds.has(itemId)) {
      this.equippedIds.delete(itemId);
      this._save();
      window.dispatchEvent(new CustomEvent('vortex:store-updated', { detail: { itemId, action: 'unequipped' } }));
      return { success: true, message: "Cosmetic unequipped in-game." };
    } else {
      this.equippedIds.add(itemId);
      this._save();
      window.dispatchEvent(new CustomEvent('vortex:store-updated', { detail: { itemId, action: 'equipped' } }));
      return { success: true, message: "Cosmetic equipped to your Minecraft character!" };
    }
  }

  redeemCreditCode(codeStr) {
    const clean = (codeStr || '').trim().toUpperCase();
    if (clean === "VORTEX2026") {
      if (localStorage.getItem('vortex_promo_vortex2026')) {
        return { success: false, message: "Promo code VORTEX2026 already redeemed!" };
      }
      localStorage.setItem('vortex_promo_vortex2026', 'true');
      if (window.VortexCredits) window.VortexCredits.add(1000);
      this._save();
      return { success: true, message: "+1000 Vortex Credits added to your account!" };
    } else if (clean === "MINECON") {
      if (localStorage.getItem('vortex_promo_minecon')) {
        return { success: false, message: "Promo code MINECON already redeemed!" };
      }
      localStorage.setItem('vortex_promo_minecon', 'true');
      this.ownedIds.add("minecon-2016-cape");
      this.equippedIds.add("minecon-2016-cape");
      this._save();
      return { success: true, message: "Minecon 2016 Cape unlocked for free!" };
    }
    return { success: false, message: "Invalid promo code." };
  }

  _save() {
    localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.ownedIds)));
    localStorage.setItem(this.equippedKey, JSON.stringify(Array.from(this.equippedIds)));
  }
}

window.VortexCosmeticaAPI = new VortexCosmeticaManager();
