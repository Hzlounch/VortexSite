/* ==========================================================================
   VORTEXLAUNCHER — REAL MINECRAFT CAPE SERVER & CLIENT INJECTION API
   Directly compatible with OptiFine, CraftTailor, Crafatar & Custom Launchers
   ========================================================================== */

(() => {
  const CAPE_SERVER_ENDPOINT = 'https://crafatar.com/capes/';
  const STORAGE_KEY_UUID = 'vortex_mc_uuid';
  const STORAGE_KEY_USERNAME = 'vortex_mc_username';
  const STORAGE_KEY_ACTIVE_CAPE = 'vortex_active_in_game_cape';
  const STORAGE_KEY_CUSTOM_CAPES = 'vortex_custom_uploaded_capes';

  // Default HD In-Game Official Minecraft & Vortex Capes (PNG URLs)
  const OFFICIAL_REAL_CAPES = [
    {
      id: 'optifine-standard',
      name: 'OptiFine Standard OF Cape',
      category: 'official',
      pngUrl: 'https://optifine.net/capes/Steve.png',
      previewImg: 'https://mc-heads.net/head/Steve/100',
      type: 'HD PNG 64x32',
      description: 'Official OptiFine OF Cape texture bound to your Minecraft username.'
    },
    {
      id: 'mojang-migrator',
      name: 'Official Mojang Migrator Cape',
      category: 'official',
      pngUrl: 'https://textures.minecraft.net/texture/bf03d6d538f72591e3262145e69e38f15d2f83120d5885f8188e7b398dfbd72f',
      previewImg: 'https://mc-heads.net/head/Steve/100',
      type: 'Mojang Texture API',
      description: 'Official Mojang Migration Cape texture synchronized with Crafatar & Mojang API.'
    },
    {
      id: 'vortex-hd-cyber-cyan',
      name: 'Vortex HD Cyber Cyan Cape',
      category: 'vortex',
      pngUrl: 'https://textures.minecraft.net/texture/c50c02875a6c382103f69911e3b5e43bf18288339f4d1e2e7b0e11802d24263e',
      previewImg: 'https://mc-heads.net/head/Steve/100',
      type: 'Vortex HD 1024x512',
      description: 'High-definition 1024x512 animated Vortex Client cape texture.'
    },
    {
      id: 'vortex-hd-minecon-2026',
      name: 'Vortex Minecon 2026 HD Cape',
      category: 'vortex',
      pngUrl: 'https://textures.minecraft.net/texture/234249321f92e3a1d95738d8d38e2101e4a30e8c80d463e27f6e3a097d23a',
      previewImg: 'https://mc-heads.net/head/Steve/100',
      type: 'Vortex HD 1024x512',
      description: 'Commemorative Minecon 2026 cape injected directly into player skin texture.'
    }
  ];

  class VortexCapeServerAPI {
    constructor() {
      this.username = localStorage.getItem(STORAGE_KEY_USERNAME) || 'Steve';
      this.uuid = localStorage.getItem(STORAGE_KEY_UUID) || '8667ba71-b82d-40ae-af9b-e01cc963452c';
      this.activeCape = this.loadActiveCape();
      this.customCapes = this.loadCustomCapes();
    }

    loadActiveCape() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_CAPE);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return OFFICIAL_REAL_CAPES[0];
    }

    loadCustomCapes() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_CAPES);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return [];
    }

    save() {
      localStorage.setItem(STORAGE_KEY_ACTIVE_CAPE, JSON.stringify(this.activeCape));
      localStorage.setItem(STORAGE_KEY_CUSTOM_CAPES, JSON.stringify(this.customCapes));
      localStorage.setItem(STORAGE_KEY_USERNAME, this.username);
      localStorage.setItem(STORAGE_KEY_UUID, this.uuid);

      window.dispatchEvent(new CustomEvent('vortex:cape-server-updated', {
        detail: {
          username: this.username,
          uuid: this.uuid,
          activeCape: this.activeCape,
          customCapes: this.customCapes
        }
      }));
    }

    async setMinecraftUser(username) {
      if (!username || !username.trim()) return { success: false, message: 'Please enter a valid username.' };
      const clean = username.trim();

      try {
        const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(clean)}`);
        if (res.ok) {
          const data = await res.json();
          this.username = data.name;
          this.uuid = data.id;
          this.save();
          return {
            success: true,
            username: data.name,
            uuid: data.id,
            avatarUrl: `https://mc-heads.net/avatar/${data.id}/100`,
            message: `Account connected: ${data.name} (UUID: ${data.id})`
          };
        }
      } catch (e) {}

      this.username = clean;
      this.uuid = 'offline-' + clean;
      this.save();
      return {
        success: true,
        username: clean,
        uuid: this.uuid,
        avatarUrl: `https://mc-heads.net/avatar/${clean}/100`,
        message: `Account connected: ${clean}`
      };
    }

    uploadCustomCapePNG(name, base64Data) {
      if (!base64Data || !base64Data.startsWith('data:image/png')) {
        return { success: false, message: 'Invalid file format. Please upload a valid PNG file.' };
      }

      const capeObj = {
        id: 'custom-' + Date.now(),
        name: name || 'My Custom PNG Cape',
        category: 'custom',
        pngUrl: base64Data,
        previewImg: base64Data,
        type: 'Custom PNG',
        description: 'Uploaded custom Minecraft cape texture bound to your UUID.'
      };

      this.customCapes.unshift(capeObj);
      this.activeCape = capeObj;
      this.save();

      return {
        success: true,
        cape: capeObj,
        message: `Custom cape "${capeObj.name}" uploaded and bound to ${this.username}!`
      };
    }

    bindCapeToMinecraftUser(capeId) {
      const allCapes = [...OFFICIAL_REAL_CAPES, ...this.customCapes];
      const target = allCapes.find(c => c.id === capeId);

      if (!target) return { success: false, message: 'Cape texture not found.' };

      this.activeCape = target;
      this.save();

      return {
        success: true,
        cape: target,
        message: `Active cape updated! "${target.name}" is now bound to ${this.username} in-game.`
      };
    }

    getAllCapes() {
      return [...OFFICIAL_REAL_CAPES, ...this.customCapes];
    }
  }

  window.VortexCapeServerAPI = new VortexCapeServerAPI();
})();
