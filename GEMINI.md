# Open Biosphere Engineering & Architectural Invariants

This document establishes critical invariants for physical CAD synthesis, interactive 3D visualization, and hardware documentation within the Open Biosphere repository.

---

## 1. Parametric 3D CAD Geometry & Normal Orientation

When authoring or modifying procedural geometry generators (`scripts/*.py`):
1. **Strict Outward Winding Invariant:**
   * Every triangular face `[v0, v1, v2]` must be wound counter-clockwise relative to the exterior of the solid, such that the cross-product normal strictly points outward:
     $$\mathbf{n} = (\mathbf{v}_1 - \mathbf{v}_0) \times (\mathbf{v}_2 - \mathbf{v}_0)$$
     $$\mathbf{n} \cdot (\mathbf{F}_{\text{center}} - \mathbf{M}_{\text{centroid}}) > 0$$
2. **Cylinder & Revolution Primitives:**
   * Side-wall quads must use outward winding `[b0, b1, t0]` and `[b1, t1, t0]` (where `b` is base ring, `t` is top ring, progressing counter-clockwise in angle). Never use `[v0, v1, v3]`.
   * Endcap disks must wind clockwise on bottom caps and counter-clockwise on top caps.
3. **Automated Verification:**
   * Before committing new models, run `python3 scripts/reconcile_all_cad_orientations.py` to assert that 100% of faces are verified outward-pointing.

---

## 2. Standard 3D Asset Format (glTF 2.0 Standard)

1. **Standard glTF 2.0 Specification:**
   * All 3D models across `public/assets/machines/`, `public/assets/parts/`, and `src/content/docs/parts/` are standardized on glTF 2.0 (`.gltf` single-file with embedded base64 binary buffer, or `.glb`).
   * Proprietary binary Autodesk 3DS (`.3ds`) is deprecated in favor of open, portable glTF 2.0.
2. **Model References:**
   * All entries in `src/data/parts.json`, machine manuals (`src/content/docs/hardware/**/*.mdx`), and custom part documentation (`src/content/docs/parts/**/*.mdx`) must reference `.gltf`.

---

## 3. 3D Web Viewport Shading & Backface Culling

When maintaining or updating `ModelViewer.tsx` or `web/viewer/`:
1. **Mandatory Backface Culling:**
   * In solid shaded mode, all faces pointing away from the camera in camera-space (`rnz2 <= 0.0`) must be discarded before Painter's depth sorting. Never draw interior/rear faces in solid mode.
2. **Facet Edge Styling:**
   * Use subtle, dark facet contours (`rgba(15, 23, 42, 0.45)` at `0.5px`) rather than high-contrast or translucent bright cyan strokes in solid mode, preventing lattice grid bleed-through. Full bright wireframe (`#38bdf8`) is reserved for explicit wireframe mode (`wireframe === true`).
3. **Client-Side Orientation Auto-Correction:**
   * Maintain the runtime centroid dot-sum sanity check in `ModelViewer.tsx`. If an imported or third-party mesh has a negative outward dot sum, dynamically reverse vertex winding on load to guarantee robust rendering.

---

## 4. Astro Starlight MDX Syntax & Acorn Invariants

When authoring or editing hardware manuals and RFC specifications (`src/content/docs/**/*.mdx`):
1. **No Unescaped Curly Braces in Prose:**
   * Acorn parses any `{...}` outside of fenced code blocks as a JavaScript JSX expression.
   * **Do not use** LaTeX curly braces in prose (e.g., write `r_min` and `r_max`, not `$r_{\text{min}}$` or `{$r_{\text{min}}}$`).
   * **Do not use** shell glob braces in markdown tables or prose (e.g., write `cad/components/(hardware, drive)/*.glb`, not `cad/components/{hardware,drive}/*.glb`).
2. **JSX Expression Attributes:**
   * Numeric or object props must use single curly braces: `estimatedCost={480.00}`, not double braces `{{480.00}}`.
3. **Import Depth Invariant:**
   * Components imported from sub-directories (e.g., `src/content/docs/hardware/<machine>/stage-0.mdx`) must use the exact 4-level relative path: `../../../../components/ModelViewer`.
