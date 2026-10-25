/**
 * web/viewer/controls/OrbitControls.js
 * RFC-014 Interactive Orbit Rotation & Perspective Controller.
 *
 * Implements smooth pointer/touch orbital drag, pitch constraints (-85 to +85 deg),
 * and inertia damping for zero-friction WebGL/Canvas CAD inspection.
 */

export class OrbitControls {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.rotX = options.initialRotX ?? 25;
    this.rotY = options.initialRotY ?? 45;
    this.targetRotX = this.rotX;
    this.targetRotY = this.rotY;
    this.autoRotate = options.autoRotate ?? true;
    this.autoRotateSpeed = options.autoRotateSpeed ?? 0.5;
    this.dampingFactor = options.dampingFactor ?? 0.12;

    this.isDragging = false;
    this.lastPointer = { x: 0, y: 0 };

    this.bindEvents();
  }

  bindEvents() {
    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', () => this.onPointerUp());
    window.addEventListener('pointercancel', () => this.onPointerUp());
  }

  onPointerDown(e) {
    this.isDragging = true;
    this.lastPointer = { x: e.clientX, y: e.clientY };
  }

  onPointerMove(e) {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastPointer.x;
    const dy = e.clientY - this.lastPointer.y;
    this.lastPointer = { x: e.clientX, y: e.clientY };

    this.targetRotY = (this.targetRotY + dx * 0.7) % 360;
    this.targetRotX = Math.max(-85, Math.min(85, this.targetRotX - dy * 0.7));
  }

  onPointerUp() {
    this.isDragging = false;
  }

  update() {
    if (this.autoRotate && !this.isDragging) {
      this.targetRotY = (this.targetRotY + this.autoRotateSpeed) % 360;
    }

    // Smooth inertia interpolation
    this.rotX += (this.targetRotX - this.rotX) * this.dampingFactor;
    this.rotY += (this.targetRotY - this.rotY) * this.dampingFactor;

    return {
      rotX: this.rotX,
      rotY: this.rotY,
    };
  }

  reset(rotX = 25, rotY = 45) {
    this.targetRotX = rotX;
    this.targetRotY = rotY;
    this.rotX = rotX;
    this.rotY = rotY;
  }
}
