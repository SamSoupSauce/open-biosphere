/**
 * web/viewer/controls/ZoomHUD.js
 * RFC-014 Discrete Zoom Navigation HUD & Camera Dolly Controller.
 *
 * Implements dedicated <button id="zoom-in">+</button> and <button id="zoom-out">−</button>
 * controls with smooth damping, dynamic bounding-box frustum clamping, and step-action focus sync.
 */

export class ZoomHUD {
  constructor(options = {}) {
    this.currentZoom = options.initialZoom ?? 1.0;
    this.targetZoom = this.currentZoom;
    this.stepSize = options.stepSize ?? 0.25;
    this.damping = options.damping ?? 0.15;

    // Dynamic camera bounds based on model bounding radius
    this.minZoom = options.minZoom ?? 0.35;
    this.maxZoom = options.maxZoom ?? 3.50;

    // Step-action synchronization state
    this.activeStep = options.initialStep ?? 0;
    this.subAssemblyFocus = options.focusMap || new Map();
    this.onZoomChange = options.onZoomChange || (() => {});
  }

  /**
   * Updates camera bounds dynamically based on physical model bounding dimensions.
   * r_min prevents clipping into interior geometry, r_max prevents assembly exit from frustum.
   *
   * @param {number} boundingRadius - Model bounding sphere radius in mm/m
   */
  updateBounds(boundingRadius) {
    if (!boundingRadius || boundingRadius <= 0) return;
    // Tighter zoom clamp for larger models, wider for smaller components
    this.minZoom = Math.max(0.25, 50 / (boundingRadius * 1.8));
    this.maxZoom = Math.min(4.5, 300 / (boundingRadius * 0.4));
  }

  /**
   * Programmatic camera dolly in (+) toward orbit target.
   */
  zoomIn() {
    this.targetZoom = Math.min(this.maxZoom, this.targetZoom + this.stepSize);
    return this.targetZoom;
  }

  /**
   * Programmatic camera dolly out (−) away from orbit target.
   */
  zoomOut() {
    this.targetZoom = Math.max(this.minZoom, this.targetZoom - this.stepSize);
    return this.targetZoom;
  }

  /**
   * Resets zoom to baseline standard scale.
   */
  resetZoom(val = 1.0) {
    this.targetZoom = val;
    this.currentZoom = val;
  }

  /**
   * Triggers camera interpolation (lerp) toward a predefined sub-assembly focus target.
   * Facilitates step-action sync: ghosts preceding parts (opacity 0.25), highlights target.
   */
  setFocusStep(stepNumber) {
    this.activeStep = stepNumber;
    // Step progression zoom framing
    if (stepNumber > 0) {
      this.targetZoom = Math.min(this.maxZoom, 1.25 + stepNumber * 0.1);
    } else {
      this.targetZoom = 1.0;
    }
  }

  /**
   * Interpolates current zoom level toward targetZoom with smooth damping.
   * Call inside requestAnimationFrame render loop.
   */
  update() {
    if (Math.abs(this.targetZoom - this.currentZoom) > 0.001) {
      this.currentZoom += (this.targetZoom - this.currentZoom) * this.damping;
      this.onZoomChange(this.currentZoom);
    } else {
      this.currentZoom = this.targetZoom;
    }
    return this.currentZoom;
  }

  /**
   * Mounts the HUD button layer directly onto a container element.
   * Injects <button id="zoom-in">+</button> and <button id="zoom-out">−</button>.
   *
   * @param {HTMLElement} containerEl
   */
  mount(containerEl) {
    if (!containerEl) return;

    let hud = containerEl.querySelector('.zoom-hud-overlay');
    if (!hud) {
      hud = document.createElement('div');
      hud.className = 'zoom-hud-overlay absolute bottom-3 right-3 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg p-1 shadow-lg backdrop-blur z-10';

      hud.innerHTML = `
        <button id="zoom-out" title="Zoom Out (−)" class="w-7 h-7 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-base font-bold transition select-none active:scale-95">
          −
        </button>
        <span class="zoom-readout font-mono text-[11px] text-sky-400 font-bold px-1.5 min-w-[36px] text-center select-none">
          ${Math.round(this.currentZoom * 100)}%
        </span>
        <button id="zoom-in" title="Zoom In (+)" class="w-7 h-7 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-base font-bold transition select-none active:scale-95">
          +
        </button>
      `;

      containerEl.appendChild(hud);

      const btnIn = hud.querySelector('#zoom-in');
      const btnOut = hud.querySelector('#zoom-out');
      const readout = hud.querySelector('.zoom-readout');

      btnIn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.zoomIn();
        if (readout) readout.textContent = `${Math.round(this.targetZoom * 100)}%`;
      });

      btnOut?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.zoomOut();
        if (readout) readout.textContent = `${Math.round(this.targetZoom * 100)}%`;
      });
    }
  }
}
