/* ==========================================================================
   VORTEXLAUNCHER — REAL CAPE RENDERER & PNG UPLOADER COMPONENT
   ========================================================================== */

class VortexCapeUploader {
  constructor(dropzoneId, fileInputId, previewContainerId) {
    this.dropzone = document.getElementById(dropzoneId);
    this.fileInput = document.getElementById(fileInputId);
    this.previewContainer = document.getElementById(previewContainerId);

    if (!this.dropzone || !this.fileInput) return;
    this.init();
  }

  init() {
    this.dropzone.addEventListener('click', () => this.fileInput.click());

    this.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropzone.style.borderColor = 'var(--primary)';
      this.dropzone.style.background = 'rgba(0, 240, 255, 0.15)';
    });

    this.dropzone.addEventListener('dragleave', () => {
      this.dropzone.style.borderColor = 'rgba(0, 240, 255, 0.3)';
      this.dropzone.style.background = 'rgba(3, 8, 18, 0.6)';
    });

    this.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropzone.style.borderColor = 'rgba(0, 240, 255, 0.3)';
      this.dropzone.style.background = 'rgba(3, 8, 18, 0.6)';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.handleFile(e.dataTransfer.files[0]);
      }
    });

    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleFile(e.target.files[0]);
      }
    });
  }

  handleFile(file) {
    if (!file.type.includes('png')) {
      alert('Error: Please upload a valid PNG Minecraft cape texture file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      const api = window.VortexCapeServerAPI;
      if (api) {
        const result = api.uploadCustomCapePNG(file.name.replace('.png', ''), base64Data);
        alert(result.message);
        if (result.success && window.renderCapeStore) {
          window.renderCapeStore();
        }
      }
    };
    reader.readAsDataURL(file);
  }
}

window.VortexCapeUploader = VortexCapeUploader;
