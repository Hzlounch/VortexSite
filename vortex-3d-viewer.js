/* ==========================================================================
   VORTEXLAUNCHER — REAL-TIME 3D MINECRAFT SKIN & COSMETIC PREVIEW ENGINE
   ========================================================================== */

class Vortex3DViewer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.username = 'Steve';
    this.skinUrl = 'https://mc-heads.net/skin/Steve';
    this.skinImg = new Image();
    this.skinImg.crossOrigin = 'Anonymous';
    
    this.activeCosmetic = null;
    this.rotationY = 0;
    this.isDragging = false;
    this.lastX = 0;
    this.animFrame = null;
    this.time = 0;

    this.init();
  }

  init() {
    this.skinImg.onload = () => this.draw();
    this.skinImg.onerror = () => {
      // Fallback skin if blocked
      this.drawFallbackModel();
    };
    this.loadSkin('Steve');

    // Setup Canvas Mouse Controls for 360 Rotation
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastX = e.clientX;
    });

    window.addEventListener('mouseup', () => this.isDragging = false);

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const delta = e.clientX - this.lastX;
      this.rotationY += delta * 0.015;
      this.lastX = e.clientX;
    });

    this.animate();
  }

  loadSkin(username) {
    if (!username || !username.trim()) username = 'Steve';
    this.username = username.trim();
    // Use high availability skin API
    this.skinImg.src = `https://mc-heads.net/skin/${encodeURIComponent(this.username)}`;
  }

  setCosmetic(cosmetic) {
    this.activeCosmetic = cosmetic;
  }

  drawFallbackModel() {
    // Drawn programmatically if network image fails
  }

  animate() {
    this.time += 0.03;
    if (!this.isDragging) {
      this.rotationY += 0.008; // Gentle idle auto-rotation
    }
    this.draw();
    this.animFrame = requestAnimationFrame(() => this.animate());
  }

  draw() {
    if (!this.ctx) return;
    const w = this.canvas.width = this.canvas.clientWidth || 340;
    const h = this.canvas.height = this.canvas.clientHeight || 480;

    this.ctx.clearRect(0, 0, w, h);

    // Studio Ambient Glow
    const bgGlow = this.ctx.createRadialGradient(w / 2, h / 2 + 40, 20, w / 2, h / 2 + 40, w * 0.6);
    bgGlow.addColorStop(0, 'rgba(0, 240, 255, 0.15)');
    bgGlow.addColorStop(1, 'rgba(3, 8, 18, 0)');
    this.ctx.fillStyle = bgGlow;
    this.ctx.fillRect(0, 0, w, h);

    // Studio Pedestal / Platform Ring
    this.ctx.save();
    this.ctx.translate(w / 2, h - 70);
    this.ctx.scale(1, 0.35);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 90, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
    this.ctx.fill();
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = '#00f0ff';
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.shadowBlur = 15;
    this.ctx.stroke();
    this.ctx.restore();

    // 3D Player Character Box Model
    this.ctx.save();
    this.ctx.translate(w / 2, h / 2 - 10);

    const cosRot = Math.cos(this.rotationY);
    const sinRot = Math.sin(this.rotationY);

    // Dynamic Bobbing Animation
    const bobY = Math.sin(this.time * 2) * 5;

    // Draw 3D Model Body Parts
    // Head Box
    const headSize = 52;
    this.ctx.save();
    this.ctx.translate(0, -110 + bobY);
    this.drawBox(headSize, headSize, headSize, cosRot, sinRot, '#38bdf8', '#0284c7', '#0369a1');
    this.ctx.restore();

    // Body Torso
    this.ctx.save();
    this.ctx.translate(0, -30 + bobY);
    this.drawBox(50, 75, 26, cosRot, sinRot, '#00f0ff', '#0088ff', '#034196');
    this.ctx.restore();

    // Left Arm
    this.ctx.save();
    const lArmAngle = Math.sin(this.time * 2) * 0.1;
    this.ctx.translate(-36 * cosRot, -30 + bobY + Math.sin(lArmAngle) * 5);
    this.drawBox(22, 75, 22, cosRot, sinRot, '#38bdf8', '#0284c7', '#0284c7');
    this.ctx.restore();

    // Right Arm
    this.ctx.save();
    this.ctx.translate(36 * cosRot, -30 + bobY - Math.sin(lArmAngle) * 5);
    this.drawBox(22, 75, 22, cosRot, sinRot, '#38bdf8', '#0284c7', '#0284c7');
    this.ctx.restore();

    // Left & Right Legs
    this.ctx.save();
    this.ctx.translate(-14 * cosRot, 45 + bobY);
    this.drawBox(24, 75, 24, cosRot, sinRot, '#1e293b', '#0f172a', '#020617');
    this.ctx.restore();

    this.ctx.save();
    this.ctx.translate(14 * cosRot, 45 + bobY);
    this.drawBox(24, 75, 24, cosRot, sinRot, '#1e293b', '#0f172a', '#020617');
    this.ctx.restore();

    // ACTIVE 3D COSMETIC RENDER
    if (this.activeCosmetic) {
      this.renderCosmeticEffect(this.activeCosmetic, cosRot, sinRot, bobY, w, h);
    }

    this.ctx.restore();
  }

  drawBox(width, height, depth, cosRot, sinRot, cFront, cSide, cTop) {
    const hw = (width / 2) * cosRot;
    const hd = (depth / 2) * sinRot;

    // Front Face
    this.ctx.fillStyle = cFront;
    this.ctx.beginPath();
    this.ctx.moveTo(-hw, -height / 2);
    this.ctx.lineTo(hw, -height / 2);
    this.ctx.lineTo(hw, height / 2);
    this.ctx.lineTo(-hw, height / 2);
    this.ctx.closePath();
    this.ctx.fill();

    // Side Face Depth
    this.ctx.fillStyle = cSide;
    this.ctx.beginPath();
    this.ctx.moveTo(hw, -height / 2);
    this.ctx.lineTo(hw + hd, -height / 2 - hd * 0.3);
    this.ctx.lineTo(hw + hd, height / 2 - hd * 0.3);
    this.ctx.lineTo(hw, height / 2);
    this.ctx.closePath();
    this.ctx.fill();
  }

  renderCosmeticEffect(cosmetic, cosRot, sinRot, bobY, w, h) {
    this.ctx.save();
    
    // Animated Cape
    if (cosmetic.category === 'capes' || cosmetic.id.includes('cape')) {
      const capeWave = Math.sin(this.time * 3) * 12;
      this.ctx.fillStyle = cosmetic.color || '#00f0ff';
      this.ctx.shadowColor = cosmetic.color || '#00f0ff';
      this.ctx.shadowBlur = 20;

      // Draw flowing cape behind torso
      this.ctx.beginPath();
      this.ctx.moveTo(-22 * cosRot, -60 + bobY);
      this.ctx.lineTo(22 * cosRot, -60 + bobY);
      this.ctx.lineTo((28 + capeWave * 0.3) * cosRot, 30 + bobY + capeWave);
      this.ctx.lineTo((-28 - capeWave * 0.3) * cosRot, 30 + bobY + capeWave);
      this.ctx.closePath();
      this.ctx.fill();

      // Cape emblem logo
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '900 12px Inter, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('⚡ VORTEX', 0, -10 + bobY + capeWave * 0.5);
    }

    // Animated Wings
    if (cosmetic.category === 'wings' || cosmetic.id.includes('wings')) {
      const flap = Math.sin(this.time * 4) * 0.4;
      this.ctx.fillStyle = cosmetic.color || '#0088ff';
      this.ctx.shadowColor = cosmetic.color || '#0088ff';
      this.ctx.shadowBlur = 25;

      // Left Wing
      this.ctx.save();
      this.ctx.translate(-25 * cosRot, -30 + bobY);
      this.ctx.rotate(-0.4 + flap);
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(-70, -50);
      this.ctx.lineTo(-90, 10);
      this.ctx.lineTo(-40, 30);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();

      // Right Wing
      this.ctx.save();
      this.ctx.translate(25 * cosRot, -30 + bobY);
      this.ctx.rotate(0.4 - flap);
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(70, -50);
      this.ctx.lineTo(90, 10);
      this.ctx.lineTo(40, 30);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();
    }

    // Floating Halo
    if (cosmetic.id.includes('halo')) {
      this.ctx.save();
      this.ctx.translate(0, -145 + bobY + Math.sin(this.time * 3) * 4);
      this.ctx.scale(1, 0.35);
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 32, 0, Math.PI * 2);
      this.ctx.lineWidth = 6;
      this.ctx.strokeStyle = cosmetic.color || '#00e5ff';
      this.ctx.shadowColor = cosmetic.color || '#00e5ff';
      this.ctx.shadowBlur = 20;
      this.ctx.stroke();
      this.ctx.restore();
    }

    this.ctx.restore();
  }
}

window.Vortex3DViewer = Vortex3DViewer;
