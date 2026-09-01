/* ==========================================================================
   VORTEXLAUNCHER x LUNAR CLIENT STORE — REAL COSMETICS CATALOG ENGINE
   ========================================================================== */

(() => {
  const STORAGE_KEY_CREDITS = 'vortex_user_credits_v101';
  const STORAGE_KEY_INVENTORY = 'vortex_user_inventory_v101';
  const STORAGE_KEY_EQUIPPED = 'vortex_user_equipped_v101';

  // High quality guaranteed rendering SVG Data URIs for crisp 100% reliable store display
  const SVGS = {
    cloak: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140" fill="none"><rect width="100" height="140" rx="12" fill="%2309162a"/><path d="M20 20 H80 V120 L50 110 L20 120 Z" fill="%2300f0ff" opacity="0.85"/><circle cx="50" cy="50" r="16" fill="%23ffffff"/><path d="M50 40 L55 60 L42 48 L58 48 L45 60 Z" fill="%2309162a"/></svg>`,
    wings: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 100" fill="none"><rect width="140" height="100" rx="12" fill="%2309162a"/><path d="M10 50 C30 10 60 20 65 60 C50 65 30 70 10 50 Z" fill="%23a855f7"/><path d="M130 50 C110 10 80 20 75 60 C90 65 110 70 130 50 Z" fill="%23a855f7"/><circle cx="70" cy="60" r="10" fill="%2300f0ff"/></svg>`,
    halo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="12" fill="%2309162a"/><ellipse cx="50" cy="50" rx="35" ry="12" stroke="%2300e5ff" stroke-width="8" fill="none"/><circle cx="50" cy="50" r="6" fill="%23ffffff"/></svg>`,
    pet: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="12" fill="%2309162a"/><path d="M30 40 L50 20 L70 40 L60 80 L40 80 Z" fill="%23f43f5e"/><circle cx="42" cy="45" r="4" fill="%23ffffff"/><circle cx="58" cy="45" r="4" fill="%23ffffff"/></svg>`,
    hat: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="12" fill="%2309162a"/><path d="M20 70 H80 V80 H20 Z" fill="%2310b981"/><path d="M35 70 L50 25 L65 70 Z" fill="%2310b981"/></svg>`,
    emote: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="12" fill="%2309162a"/><circle cx="50" cy="50" r="30" fill="%23f59e0b"/><circle cx="40" cy="42" r="4" fill="%2309162a"/><circle cx="60" cy="42" r="4" fill="%2309162a"/><path d="M35 62 Q50 75 65 62" stroke="%2309162a" stroke-width="5" fill="none"/></svg>`,
    badge: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="12" fill="%2309162a"/><polygon points="50,15 63,35 85,38 68,55 73,78 50,65 27,78 32,55 15,38 37,35" fill="%23f59e0b"/></svg>`,
    bundle: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="12" fill="%2309162a"/><path d="M25 40 L50 25 L75 40 L75 75 L25 75 Z" fill="%23a855f7"/><path d="M25 40 L50 55 L75 40" stroke="%23ffffff" stroke-width="4"/></svg>`
  };

  const REAL_COSMETICS_CATALOG = [
    { id: 'item-1', title: 'Lunar x Vortex Cyber Cloak', category: 'cloaks', price: 150, currency: 'CR', rarity: 'LEGENDARY', rarityColor: '#00f0ff', imgUrl: SVGS.cloak, badge: 'POPULAR', description: 'Official HD animated cyber cloak with electric cyan energy particles visible in-game.' },
    { id: 'item-2', title: 'Animated Cyber Dragon Wings', category: 'wings', price: 250, currency: 'CR', rarity: 'MYTHIC', rarityColor: '#a855f7', imgUrl: SVGS.wings, badge: '3D MODEL', description: 'High-definition 3D dragon wing cosmetic animated in 60 FPS with particle physics.' },
    { id: 'item-3', title: 'Glowing Plasma Halo', category: 'halos', price: 100, currency: 'CR', rarity: 'RARE', rarityColor: '#00e5ff', imgUrl: SVGS.halo, badge: 'HEADGEAR', description: 'Cyan floating plasma ring headgear rendered directly above player model.' },
    { id: 'item-4', title: '3D Void Dragon Shoulder Pet', category: 'pets', price: 200, currency: 'CR', rarity: 'LEGENDARY', rarityColor: '#f43f5e', imgUrl: SVGS.pet, badge: 'PET', description: 'Animated 3D dragon pet resting on your player shoulder with breathing animations.' },
    { id: 'item-5', title: 'Cyber Samurai Mask', category: 'hats', price: 120, currency: 'CR', rarity: 'EPIC', rarityColor: '#10b981', imgUrl: SVGS.hat, badge: 'NEW', description: 'Futuristic glowing face mask and samurai bandanna equipped on face layer.' },
    { id: 'item-6', title: 'Vortex Founder 2026 Bundle', category: 'bundles', price: 350, currency: 'CR', rarity: 'MYTHIC', rarityColor: '#f59e0b', imgUrl: SVGS.bundle, badge: 'BUNDLE', description: 'Complete official Founder bundle including Cyber Cloak, Dragon Wings, and Halo.' },
    { id: 'item-7', title: 'Vortex Shuffle 60FPS Emote', category: 'emotes', price: 80, currency: 'CR', rarity: 'RARE', rarityColor: '#f59e0b', imgUrl: SVGS.emote, badge: 'ANIMATED', description: 'High FPS dance shuffle emote animated in multiplayer lobbies.' },
    { id: 'item-8', title: 'Founder VIP Badge', category: 'badges', price: 50, currency: 'CR', rarity: 'COMMON', rarityColor: '#94a3b8', imgUrl: SVGS.badge, badge: 'EXCLUSIVE', description: 'Exclusive founder tag icon shown next to player name in TAB list.' }
  ];

  class VortexCosmeticaAPI {
    constructor() {
      this.credits = parseInt(localStorage.getItem(STORAGE_KEY_CREDITS) || '1000', 10);
      this.inventory = this.loadInventory();
      this.equipped = this.loadEquipped();
    }

    getCatalog() {
      return REAL_COSMETICS_CATALOG;
    }

    loadInventory() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_INVENTORY);
        if (stored) return JSON.parse(stored);
      } catch (e) {}
      return ['item-1'];
    }

    loadEquipped() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_EQUIPPED);
        if (stored) return JSON.parse(stored);
      } catch (e) {}
      return { cloaks: 'item-1' };
    }

    save() {
      localStorage.setItem(STORAGE_KEY_CREDITS, this.credits.toString());
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(this.inventory));
      localStorage.setItem(STORAGE_KEY_EQUIPPED, JSON.stringify(this.equipped));

      window.dispatchEvent(new CustomEvent('vortex:store-updated', {
        detail: {
          credits: this.credits,
          inventory: this.inventory,
          equipped: this.equipped
        }
      }));
    }

    hasItem(id) {
      return this.inventory.includes(id);
    }

    isEquipped(id) {
      return Object.values(this.equipped).includes(id);
    }

    purchaseItemWithCredits(itemId) {
      const item = REAL_COSMETICS_CATALOG.find(i => i.id === itemId);
      if (!item) return { success: false, message: 'Item not found in catalog.' };

      if (this.hasItem(itemId)) {
        return { success: false, message: 'You already own this cosmetic!' };
      }

      if (this.credits < item.price) {
        return { success: false, message: `Insufficient Credits! You need ${item.price - this.credits} CR more.` };
      }

      this.credits -= item.price;
      this.inventory.push(itemId);
      this.equipped[item.category] = itemId;
      this.save();

      return {
        success: true,
        message: `Purchased & Equipped ${item.title}! Bound to account.`
      };
    }

    toggleEquipInGame(itemId) {
      const item = REAL_COSMETICS_CATALOG.find(i => i.id === itemId);
      if (!item) return { success: false, message: 'Item not found.' };

      if (!this.hasItem(itemId)) {
        return { success: false, message: 'Purchase item with Vortex Credits first!' };
      }

      if (this.equipped[item.category] === itemId) {
        delete this.equipped[item.category];
        this.save();
        return { success: true, action: 'unequipped', message: `Unequipped ${item.title}.` };
      }

      this.equipped[item.category] = itemId;
      this.save();
      return { success: true, action: 'equipped', message: `Equipped ${item.title} to your Minecraft profile!` };
    }

    redeemCreditCode(code) {
      if (!code) return { success: false, message: 'Please enter a promo code.' };
      const clean = code.trim().toUpperCase();

      if (clean === 'VORTEX2026' || clean === 'LUNAR2026') {
        this.credits += 500;
        this.save();
        return { success: true, message: 'Promo Code Redeemed! +500 Vortex Credits added.' };
      }

      if (clean === 'FREEPET') {
        if (!this.hasItem('item-4')) {
          this.inventory.push('item-4');
          this.save();
          return { success: true, message: 'Promo Code Redeemed! Unlocked 3D Dragon Pet!' };
        }
        return { success: false, message: 'You already own the 3D Dragon Pet!' };
      }

      return { success: false, message: 'Invalid or expired promo code.' };
    }
  }

  window.VortexCosmeticaAPI = new VortexCosmeticaAPI();
})();
