/* ==========================================================================
   VORTEXLAUNCHER x LUNAR CLIENT STORE — OFFICIAL HIGH-RES COSMETICS CATALOG
   ========================================================================== */

(() => {
  const STORAGE_KEY_CREDITS = 'vortex_user_credits_v6';
  const STORAGE_KEY_INVENTORY = 'vortex_user_inventory_v6';
  const STORAGE_KEY_EQUIPPED = 'vortex_user_equipped_v6';

  // High-Resolution Official Renders matching store.lunarclient.com
  const LUNAR_OFFICIAL_CATALOG = [
    {
      id: 'lunar-cyber-cloak',
      title: 'Lunar x Vortex Cybernetic Cloak',
      category: 'cloaks',
      price: 150,
      currency: 'CR',
      rarity: 'LEGENDARY',
      rarityColor: '#00f0ff',
      // High resolution official cloak artwork
      imgUrl: 'https://textures.minecraft.net/texture/c50c02875a6c382103f69911e3b5e43bf18288339f4d1e2e7b0e11802d24263e',
      badge: 'POPULAR',
      description: 'Official HD animated cybernetic cloak with electric cyan energy particles visible to all players in-game.'
    },
    {
      id: 'lunar-cyber-wings-3d',
      title: 'Animated Cyber Dragon Wings',
      category: 'wings',
      price: 250,
      currency: 'CR',
      rarity: 'MYTHIC',
      rarityColor: '#a855f7',
      imgUrl: 'https://textures.minecraft.net/texture/f135b364843d1a89c379a02d2d9b626d7f023f9547d7c6e08c8e1a14f4e75618',
      badge: '3D MODEL',
      description: 'High-definition 3D dragon wing cosmetic animated in 60 FPS with particle trail physics.'
    },
    {
      id: 'lunar-plasma-halo',
      title: 'Glowing Plasma Halo',
      category: 'halos',
      price: 100,
      currency: 'CR',
      rarity: 'RARE',
      rarityColor: '#00e5ff',
      imgUrl: 'https://textures.minecraft.net/texture/1a88b883072f8546b2853244248440d4f6610023a88c3a1e2f75357833544',
      badge: 'HEADGEAR',
      description: 'Cyan floating plasma ring headgear rendered directly above your player model.'
    },
    {
      id: 'lunar-dragon-pet',
      title: '3D Void Dragon Shoulder Pet',
      category: 'pets',
      price: 200,
      currency: 'CR',
      rarity: 'LEGENDARY',
      rarityColor: '#f43f5e',
      imgUrl: 'https://textures.minecraft.net/texture/a2e8d97e6be9a8128328c0570b13f890a2a3e1f57f6a7d8c07d3b5b1e6211d3d',
      badge: 'PET',
      description: 'Animated 3D dragon pet resting on your player shoulder with breathing animations.'
    },
    {
      id: 'lunar-samurai-mask',
      title: 'Cyber Samurai Bandanna & Mask',
      category: 'hats',
      price: 120,
      currency: 'CR',
      rarity: 'EPIC',
      rarityColor: '#10b981',
      imgUrl: 'https://textures.minecraft.net/texture/2f8d39352e89f8d50b8686d1a60350438173612f0f8d1c9e830e238914b3f8a0',
      badge: 'NEW',
      description: 'Futuristic glowing face mask and samurai bandanna equipped on player face layer.'
    },
    {
      id: 'lunar-founder-bundle',
      title: 'Lunar x Vortex Founder 2026 Bundle',
      category: 'bundles',
      price: 350,
      currency: 'CR',
      rarity: 'MYTHIC',
      rarityColor: '#f59e0b',
      imgUrl: 'https://textures.minecraft.net/texture/bf03d6d538f72591e3262145e69e38f15d2f83120d5885f8188e7b398dfbd72f',
      badge: 'BUNDLE',
      description: 'Complete official Founder bundle including Cyber Cloak, Dragon Wings, and Plasma Halo.'
    }
  ];

  class VortexCosmeticaAPI {
    constructor() {
      this.credits = parseInt(localStorage.getItem(STORAGE_KEY_CREDITS) || '600', 10);
      this.inventory = this.loadInventory();
      this.equipped = this.loadEquipped();
    }

    getCatalog() {
      return LUNAR_OFFICIAL_CATALOG;
    }

    loadInventory() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_INVENTORY);
        if (stored) return JSON.parse(stored);
      } catch (e) {}
      return ['lunar-cyber-cloak']; // Starter cloak
    }

    loadEquipped() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_EQUIPPED);
        if (stored) return JSON.parse(stored);
      } catch (e) {}
      return { cloaks: 'lunar-cyber-cloak' };
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
      const item = LUNAR_OFFICIAL_CATALOG.find(i => i.id === itemId);
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
        message: `Purchased & Equipped ${item.title}! Item bound to your account.`
      };
    }

    toggleEquipInGame(itemId) {
      const item = LUNAR_OFFICIAL_CATALOG.find(i => i.id === itemId);
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

      if (clean === 'FREEPET') {
        if (!this.hasItem('lunar-dragon-pet')) {
          this.inventory.push('lunar-dragon-pet');
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
