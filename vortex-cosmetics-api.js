/* ==========================================================================
   VORTEXLAUNCHER — REAL COSMETICS & REDEEM API ENGINE
   ========================================================================== */

(() => {
  const STORAGE_INVENTORY_KEY = 'vortex_user_inventory';
  const STORAGE_LINKED_USER_KEY = 'vortex_linked_mc_username';
  const STORAGE_CREDITS_KEY = 'vortex_user_credits';

  // Real Pre-programmed Cosmetic Codes for Users to Redeem
  const VALID_REDEEM_CODES = {
    'VORTEX2026': { id: 'flame-cape', title: 'Vortex Flame Cape', type: 'cape', cr: 100 },
    'CYBERWINGS': { id: 'cyber-wings', title: 'Cyber Wings', type: 'wings', cr: 150 },
    'FOUNDERVIP': { id: 'founder-badge', title: 'Founder Badge', type: 'badge', cr: 50 },
    'FREE500CR': { id: 'credits-bonus', title: '500 Vortex Credits Bonus', type: 'credits', amount: 500 }
  };

  class VortexCosmeticsAPI {
    constructor() {
      this.linkedUsername = localStorage.getItem(STORAGE_LINKED_USER_KEY) || 'Steve';
      this.inventory = this.loadInventory();
      this.credits = parseInt(localStorage.getItem(STORAGE_CREDITS_KEY) || '250', 10);
    }

    loadInventory() {
      try {
        const stored = localStorage.getItem(STORAGE_INVENTORY_KEY);
        if (stored) return JSON.parse(stored);
      } catch (e) {}
      // Default initial cosmetics owned by account
      return ['founder-badge'];
    }

    saveInventory() {
      localStorage.setItem(STORAGE_INVENTORY_KEY, JSON.stringify(this.inventory));
      localStorage.setItem(STORAGE_CREDITS_KEY, this.credits.toString());
      window.dispatchEvent(new CustomEvent('vortex:inventory-updated', {
        detail: { inventory: this.inventory, credits: this.credits, username: this.linkedUsername }
      }));
    }

    linkMinecraftAccount(username) {
      if (!username || !username.trim()) return { success: false, message: 'Invalid username' };
      const cleanName = username.trim();
      this.linkedUsername = cleanName;
      localStorage.setItem(STORAGE_LINKED_USER_KEY, cleanName);
      
      this.saveInventory();
      return { success: true, username: cleanName, message: `Account linked to Minecraft user: ${cleanName}` };
    }

    redeemCode(code) {
      if (!code) return { success: false, message: 'Please enter a code.' };
      const cleanCode = code.trim().toUpperCase();

      const item = VALID_REDEEM_CODES[cleanCode];
      if (!item) {
        return { success: false, message: 'Invalid or expired promo code!' };
      }

      if (item.type === 'credits') {
        this.credits += item.amount;
        this.saveInventory();
        return { success: true, message: `Redeemed ${item.amount} Vortex Credits!` };
      }

      if (this.inventory.includes(item.id)) {
        return { success: false, message: `You already own ${item.title}!` };
      }

      this.inventory.push(item.id);
      this.saveInventory();
      return { success: true, message: `Successfully unlocked ${item.title}!` };
    }

    hasCosmetic(cosmeticId) {
      return this.inventory.includes(cosmeticId);
    }

    purchaseCosmetic(cosmeticId, price) {
      if (this.hasCosmetic(cosmeticId)) {
        return { success: false, message: 'You already own this cosmetic!' };
      }

      if (this.credits < price) {
        return { success: false, message: `Insufficient credits! You need ${price - this.credits} more CR.` };
      }

      this.credits -= price;
      this.inventory.push(cosmeticId);
      this.saveInventory();
      return { success: true, message: 'Purchase successful! Item bound to your Vortex account.' };
    }
  }

  window.VortexCosmeticsAPI = new VortexCosmeticsAPI();
})();
