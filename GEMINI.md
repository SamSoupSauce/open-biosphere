# Open Biosphere Engineering & Architectural Invariants

This document establishes critical invariants for physical CAD synthesis, interactive 3D visualization, asset lifecycle management, and hardware documentation within the Open Biosphere repository.

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

## 2. Standard 3D Asset Format & Zero-Remnant Deprecation

1. **glTF 2.0 CAD Standard:**
   * All 3D assets across `public/assets/machines/`, `public/assets/parts/`, and `src/content/docs/parts/` are strictly standardized on glTF 2.0 (`.gltf` single-file with embedded base64 binary buffer, or `.glb`).
   * Geometry buffers in `.gltf` files must use inline Base64 data URIs (`data:application/octet-stream;base64,...`) to guarantee atomic, single-fetch loading without CORS or relative `.bin` path failures.
   * Proprietary binary Autodesk 3DS (`.3ds`) and legacy CAD binaries are completely deprecated. No `.3ds` files or references may exist in the repository.

2. **Exhaustive Format Migration Scope:**
   When migrating, renaming, or upgrading asset formats across the repository, changes must be universally applied across all layers:
   * **Manifests & Code:** `src/data/parts.json`, `ModelViewer.tsx`, and generator scripts (`scripts/*.py`).
   * **Manuals & Markdown:** All `modelUrl` props and table link anchors (e.g. `[glTF]`, never legacy `[3DS]`).
   * **Embedded Vector Graphics:** All vector diagrams (`*.svg`) with embedded status chips or download callouts (e.g. `SOLID GEOMETRY VERIFIED [GLTF]`, `• Downloadable STEP / STL / GLTF`).
   * **Specifications & RFCs:** Active standards and RFC documents in `src/content/docs/rfcs/`.

3. **Zero-Remnant Deprecation Policy:**
   * Superseded or converted binary assets must be removed from git tracking (`git rm`) immediately upon conversion to prevent duplicate file baggage, stale links, and cache desynchronization.

4. **Replacement of 2D Vector Drawings with Native glTF Models:**
   * All 2D vector technical drawings (`dimensional-drawing.svg`, `isometric-render.svg`) are completely deprecated across the part catalog and subpages.
   * Every component in the registry (`src/content/docs/parts/**/*.mdx`) must embed interactive 3D inspection using `<ModelViewer />` with canonical `.gltf` model assets.
   * In `src/data/parts.json`, `drawing_asset_url` points directly to the canonical `.gltf` model asset URL. Legacy drawing SVGs must be purged from tracking.

---

## 3. 3D Web Viewport Shading, Backface Culling & Orbit Controls

When maintaining or updating `ModelViewer.tsx` or `web/viewer/`:
1. **Mandatory Backface Culling:**
   * In solid shaded mode, all faces pointing away from the camera in camera-space (`rnz2 <= 0.0`) must be discarded before Painter's depth sorting. Never draw interior/rear faces in solid mode.
2. **Facet Edge Styling:**
   * Use subtle, dark facet contours (`rgba(15, 23, 42, 0.45)` at `0.5px`) rather than high-contrast or translucent bright cyan strokes in solid mode, preventing lattice grid bleed-through. Full bright wireframe (`#38bdf8`) is reserved for explicit wireframe mode (`wireframe === true`).
3. **Client-Side Orientation Auto-Correction:**
   * Maintain the runtime centroid dot-sum sanity check in `ModelViewer.tsx`. If an imported or third-party mesh has a negative outward dot sum, dynamically reverse vertex winding on load to guarantee robust rendering.
4. **Viewport Drag Orbit Invariants:**
   * Vertical mouse-click-drag (`dy = e.clientY - dragPosRef.current.y`) must pitch the perspective up when dragging down (`rotXRef.current + dy * 0.7`) and pitch down when dragging up. Never invert UI pitch relative to natural orbital intuition.

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
