/* ==========================================================================
   VORTEXLAUNCHER x COSMETICA.CC — HIGH-END COSMETICS & CREDITS API ENGINE
   Integrated with Lunar Client Store styling & smooth Toast notifications
   ========================================================================== */

(() => {
  const STORAGE_KEY_CREDITS = 'vortex_user_credits_v5';
  const STORAGE_KEY_INVENTORY = 'vortex_user_inventory_v5';
  const STORAGE_KEY_EQUIPPED = 'vortex_user_equipped_v5';

  // High-End Rendered Lunar-Style Cosmetics Catalog
  const LUNAR_STYLE_CATALOG = [
    {
      id: 'vortex-cyber-flame-cape',
      title: 'Vortex HD Cyber Flame Cape',
      category: 'capes',
      price: 150,
      currency: 'CR',
      rarity: 'LEGENDARY',
      rarityColor: '#00f0ff',
      icon: 'fa-shield-halved',
      badge: 'FEATURED',
      previewBg: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(0, 136, 255, 0.1))',
      description: 'Official HD animated cyber flame cape injected into Vortex Client across all Minecraft versions.'
    },
    {
      id: 'vortex-cyber-wings-3d',
      title: '3D Cybernetic Dragon Wings',
      category: 'wings',
      price: 250,
      currency: 'CR',
      rarity: 'MYTHIC',
      rarityColor: '#a855f7',
      icon: 'fa-dragon',
      badge: '3D MODEL',
      previewBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.1))',
      description: 'Fully animated 3D cyber wings rendered in-game with dynamic particle emission trails.'
    },
    {
      id: 'vortex-plasma-halo',
      title: 'Floating Plasma Halo',
      category: 'halos',
      price: 100,
      currency: 'CR',
      rarity: 'RARE',
      rarityColor: '#00e5ff',
      icon: 'fa-ring',
      badge: 'HEADGEAR',
      previewBg: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(16, 185, 129, 0.1))',
      description: 'Glowing plasma ring floating above player head in all Minecraft multiplayer servers.'
    },
    {
      id: 'vortex-shuffle-emote',
      title: 'Vortex Shuffle 60FPS Emote',
      category: 'emotes',
      price: 80,
      currency: 'CR',
      rarity: 'RARE',
      rarityColor: '#f59e0b',
      icon: 'fa-masks-theater',
      badge: 'ANIMATED',
      previewBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.1))',
      description: 'Custom dance shuffle emote animated in high 60 FPS for lobby flex.'
    },
    {
      id: 'vortex-samurai-bandanna',
      title: 'Cyber Samurai Bandanna Mask',
      category: 'hats',
      price: 120,
      currency: 'CR',
      rarity: 'EPIC',
      rarityColor: '#10b981',
      icon: 'fa-mask',
      badge: 'NEW',
      previewBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(0, 240, 255, 0.1))',
      description: 'Cyan glowing samurai face mask bandanna equipped on player skin head.'
    },
    {
      id: 'vortex-founder-bundle',
      title: 'Vortex Founder 2026 Cosmetic Bundle',
      category: 'bundles',
      price: 350,
      currency: 'CR',
      rarity: 'MYTHIC',
      rarityColor: '#f43f5e',
      icon: 'fa-box-open',
      badge: 'BUNDLE',
      previewBg: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2), rgba(168, 85, 247, 0.1))',
      description: 'Complete Founder bundle including Founder Cape, Cyber Wings, and Plasma Halo.'
    }
  ];

  class VortexCosmeticaAPI {
    constructor() {
      this.credits = parseInt(localStorage.getItem(STORAGE_KEY_CREDITS) || '500', 10);
      this.inventory = this.loadInventory();
      this.equipped = this.loadEquipped();
    }

    getCatalog() {
      return LUNAR_STYLE_CATALOG;
    }

    loadInventory() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_INVENTORY);
        if (stored) return JSON.parse(stored);
      } catch (e) {}
      return ['vortex-cyber-flame-cape']; // Default owned cape
    }

    loadEquipped() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_EQUIPPED);
        if (stored) return JSON.parse(stored);
      } catch (e) {}
      return { capes: 'vortex-cyber-flame-cape' };
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
      const item = LUNAR_STYLE_CATALOG.find(i => i.id === itemId);
      if (!item) return { success: false, message: 'Item not found in store.' };

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
        message: `Purchased & Equipped ${item.title}! Added to your inventory.`
      };
    }

    toggleEquipInGame(itemId) {
      const item = LUNAR_STYLE_CATALOG.find(i => i.id === itemId);
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
        this.credits += 300;
        this.save();
        return { success: true, message: 'Promo Code Redeemed! +300 Vortex Credits added.' };
      }

      if (clean === 'FREEWINGS') {
        if (!this.hasItem('vortex-cyber-wings-3d')) {
          this.inventory.push('vortex-cyber-wings-3d');
          this.save();
          return { success: true, message: 'Promo Code Redeemed! Unlocked 3D Cyber Wings!' };
        }
        return { success: false, message: 'You already own the 3D Cyber Wings!' };
      }

      return { success: false, message: 'Invalid or expired promo code.' };
    }
  }

  window.VortexCosmeticaAPI = new VortexCosmeticaAPI();
})();
