# Open Biosphere Engineering & Architectural Invariants

This document establishes critical invariants for physical CAD synthesis, interactive 3D visualization, asset lifecycle management, and hardware documentation within the Open Biosphere repository.

---

## 1. Parametric 3D CAD Geometry & Normal Orientation

When authoring or modifying procedural geometry generators (`scripts/*.py`):

1. **The Three Mandatory CAD Geometry Invariants:**
   Every 3D model, machine assembly, and catalog part must satisfy the three fundamental CAD invariants:
   - **Invariant 1: Object Isolation (No Enclosed Objects):**
     * No object (connected solid component) may be enclosed, nested, or submerged inside any other object.
     * When concentric features (such as shafts, journals, or bearing collars) are modeled, they must be partitioned into contiguous non-overlapping longitudinal segments along their axis or joined via annular flanges. Never generate a smaller solid inside a larger solid without clearance bores.
   - **Invariant 2: Whole, Solid, and 3D Printable:**
     * Every object must be a watertight 2-manifold with zero boundary edges (`boundary == 0`, no open holes or missing caps) and zero non-manifold edges (`non_two == 0`, no internal divider walls).
     * **Oriented Edge Cancellation:** Every directed edge `(u, v)` in face $F_A$ must have an exact counter-directed edge `(v, u)` in adjacent face $F_B$ (`unoriented == 0`).
     * **Topological Genus & Euler Characteristic:** The Euler characteristic $\chi = |V| - |E| + |F| = 2 - 2g \le 2$ must be a valid even integer.
     * **Strictly Positive Enclosed Volume:** $V_{\text{signed}} = \frac{1}{6} \sum \mathbf{v}_0 \cdot (\mathbf{v}_1 \times \mathbf{v}_2) > 0\text{ mm}^3$. Zero-volume flat planes and negative-volume inside-out meshes are strictly prohibited.
     * **Physical Print Envelope:** Bounding dimensions must satisfy $dx, dy, dz \ge 1.0\text{ mm}$. Single-walled zero-thickness surfaces ($t = 0\text{ mm}$) are invalid for physical fabrication.
   - **Invariant 3: Dual Inner and Outer Normal Calculation:**
     * Each object must have its dual inner and outer normals explicitly computed and verified:
       - Outer unit face normal: $\mathbf{n}_{\text{outer}} = \frac{(\mathbf{v}_1 - \mathbf{v}_0) \times (\mathbf{v}_2 - \mathbf{v}_0)}{\|(\mathbf{v}_1 - \mathbf{v}_0) \times (\mathbf{v}_2 - \mathbf{v}_0)\|}$ (points outward into ambient space).
       - Inner unit face normal: $\mathbf{n}_{\text{inner}} = -\mathbf{n}_{\text{outer}}$ (points inward into solid material).
       - Area-weighted vertex normals $\mathbf{N}_{\text{outer}}$ and $\mathbf{N}_{\text{inner}} = -\mathbf{N}_{\text{outer}}$.
     * All normal vectors must satisfy unit normalization $\|\mathbf{n}\| = 1.0 \pm 10^{-4}$ and exact antiparallel duality $\mathbf{n}_{\text{outer}} \cdot \mathbf{n}_{\text{inner}} = -1.0 \pm 10^{-4}$.

2. **Strict Outward Winding Invariant:**
   * Every triangular face `[v0, v1, v2]` must be wound counter-clockwise relative to the exterior of the solid, such that the cross-product normal strictly points outward:
     $$\mathbf{n} = (\mathbf{v}_1 - \mathbf{v}_0) \times (\mathbf{v}_2 - \mathbf{v}_0)$$
     $$\mathbf{n} \cdot (\mathbf{F}_{\text{center}} - \mathbf{M}_{\text{centroid}}) > 0$$
3. **Cylinder & Revolution Primitives:**
   * Side-wall quads must use outward winding `[b0, b1, t0]` and `[b1, t1, t0]` (where `b` is base ring, `t` is top ring, progressing counter-clockwise in angle). Never use `[v0, v1, v3]`.
   * Endcap disks must wind clockwise on bottom caps and counter-clockwise on top caps.
4. **Automated Verification:**
   * Before committing new models, run `python3 scripts/reconcile_all_cad_orientations.py` to assert that 100% of faces are verified outward-pointing.
5. **Watertight 2-Manifold Invariant (RFC-017):**
   * Every closed solid geometry must be a strict 2-manifold where every undirected edge connects to exactly two triangular faces. Zero open boundaries or non-manifold edges.
6. **Zero-Thickness Proscription & Volumetric Wall Offsets (RFC-017):**
   * Single-walled zero-thickness surfaces ($t = 0\text{ mm}$) are strictly invalid for physical fabrication and 3D printing. All shells, ducts, and hollow funnels must enforce a volumetric wall offset of at least $2.5\text{ mm}$ (nominal $3.5\text{ mm}$) to form closed, watertight solid bodies.
7. **CSG Coplanar Guardrails (RFC-017):**
   * When performing constructive solid geometry boolean difference/subtraction passes, tool solids must extend at least $+0.1\text{ mm}$ beyond target boundary faces to prevent zero-thickness degenerate coplanar slivers and unindexed self-intersection dropouts.
8. **Automated Headless Model & Visual Verification (`npm run test:models` / `npm run test:visual`) (RFC-017 / RFC-020):**
   * Before committing 3D assets, run `npm run test:models` (which chains `scripts/test_models.py` and `scripts/visual_inspection_pipeline.py --check-only`) to verify bounding volume ($dx, dy, dz \ge 1.0\text{ mm}$), manifold edge consistency, outward normal orientation, and normal consistency across all 162 catalog models (130 parts, 4 compound subparts, 28 machines).
   * Run `npm run test:visual` to re-generate the standalone interactive visual inspection dashboard at `public/inspection/index.html` with full 72-view multi-tier projections (Side 0°, Above +30°, Below -30° every 15° azimuth).
9. **Prism & Cylinder Endcap Winding Invariant (RFC-018):**
   * When closing cylindrical, polygonal, or hexagonal shafts and pinions:
     - Bottom endcap disks ($Z_0$, normal $-Z$): Must wind `(c_bot, v_next, v_curr)` where vertices advance counter-clockwise in angle.
     - Top endcap disks ($Z_1$, normal $+Z$): Must wind `(c_top, v_curr, v_next)` where vertices advance counter-clockwise in angle.
     - Never reverse this order, or caps will point inward and fail normal orientation audits.

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
5. **Deterministic Camera Navigation & Wheel Isolation (RFC-016):**
   * The canvas-level event listener for `wheel` is completely removed. Scrolling anywhere over the 3D canvas must produce zero camera movement and pass through to normal parent document scrolling.
   * Camera navigation is controlled via explicit on-screen HUD clusters:
     - Zoom Controls (`.hud-zoom`): Discrete `[ 🔍− ]` (`#btn-zoom-out`) and `[ 🔍+ ]` (`#btn-zoom-in`) buttons flanking the percentage zoom state.
     - Translation D-Pad (`.hud-pan`): Discrete 3-axis pan shifts for Horizontal (`#btn-pan-left`, `#btn-pan-right`), Vertical (`#btn-pan-up`, `#btn-pan-down`), and Depth/Axial (`#btn-pan-fwd`, `#btn-pan-back`).
     - Rotation Column (`.rotation-column`): Discrete step rotation for Yaw (`#btn-rot-left`, `#btn-rot-right`) and Pitch (`#btn-pitch-up`, `#btn-pitch-down`).
6. **Zero-Empty-Geometry Invariant (RFC-016):**
   * Every BOM part and catalog component must resolve to a valid, watertight 3D glTF asset (`.gltf` or `.glb`) with non-zero geometry and millimeter scale. Bounding-box-only placeholders and empty nodes are prohibited in production assets.

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
4. **Zero Raw LaTeX Math Syntax in MDX Prose (RFC-018):**
   * Astro Starlight MDX does not bundle a LaTeX remark-math / KaTeX plugin in prose. Any unescaped `$...$` or `$$...$$` will be parsed by Acorn as JavaScript JSX template expressions.
   * **Do not use** `$...$` or `$$...$$` in `.mdx` prose, tables, or documentation (e.g. do not write `$Z = 0\text{ mm}$` or `$$\text{Volume} = ...$$`).
   * Format all formulas, dimensions, and physical tolerances using plain Unicode text or inline/fenced code blocks (e.g., write `Z = 0.0 mm`, `0.4 µm Ra`, or `Volume = (1/6) * Σ [ v0 · (v1 × v2) ] > 0`).

---

## 5. Multi-Part Composite Assemblies & 3D Printable Subparts (RFC-018)

When authoring or updating kinetic, articulated, or multi-component mechanisms:
1. **Composite Classification & Badging:**
   * Any part consisting of distinct structural, kinetic, or multi-material subparts must be declared with `classification: "composite"` in frontmatter and `src/data/parts.json`.
   * Pass `isComposite={true}` to `<ModelViewer />` to display the high-contrast `COMPOSITE` badge in the viewer HUD.
2. **Per-Subpart Color Coding via glTF `COLOR_0`:**
   * Encode subpart visual identity directly into glTF binary buffers using the standard `COLOR_0` accessor (`componentType: 5126`, `VEC3` IEEE 754 floats).
   * Follow the canonical functional palette:
     - Structural Rails & Frames: Slate Gray (`#8c96a5`)
     - Primary Sliding Members: Electric Blue (`#0ea5e9`)
     - Secondary Sliding Members: Golden Amber (`#f59e0b`)
     - Rotary Actuators & Drive Pinions: Coral Orange (`#ef4444`)
     - Optical & Translucent Elements: Royal Violet (`#a855f7`)
3. **Standalone 2-Manifold Subpart Models:**
   * Every composite assembly must export individual, watertight 2-manifold models (`subpart-XX-name.stl` and `subpart-XX-name.gltf`) for every subpart.
   * Every subpart must satisfy `non_two = 0` (zero non-manifold edges) and signed solid volume $V > 0$.
4. **Slicing Bed Grounding Invariant:**
   * All standalone STL subparts and batch plater models (`print.stl`) must be translated such that their lowest vertex satisfies $\min(z) = 0.0\text{ mm}$. Floating geometries or subterranean coordinates ($\min(z) < 0$) are strictly prohibited in slicing assets.
5. **Batch Build Plater (`print.stl`):**
   * In addition to standalone files, provide a pre-arranged `print.stl` batch plater with all subparts laid flat on the build surface, fitting within a standard $220 \times 220\text{ mm}$ build envelope.

---

## 6. Comprehensive CAD Assembly Audit & Pre-Push Iteration Protocol

When generating, modifying, or refactoring 3D CAD assemblies (`scripts/build_composite_models.py`, `scripts/*.py`):

1. **Watertight 2-Manifold & Edge Orientation Invariant:**
   * Every closed solid must be a strict 2-manifold with zero boundary edges (`boundary == 0`) and zero non-two edges (`non_two == 0`).
   * **Oriented Edge Cancellation:** Every directed edge `(u, v)` in face $F_A$ must have an exact counter-directed edge `(v, u)` in adjacent face $F_B$ (`unoriented == 0`). If an edge is traversed in the same direction twice, winding order is corrupted and must be reversed.

2. **Camera-Space Glance Angle & Anti-Flicker Geometry:**
   * Avoid outward flared overhangs whose surface normals align within $\pm 10^\circ$ of the standard orbital camera pitch ($\approx 25^\circ$), which causes backface culling (`rnz2 <= 0.0`) to drop triangles intermittently during rotation.
   * Implement stepped collar geometries with strictly cardinal/axis-aligned vertical walls ($N_Y = 0.0$) and horizontal step ledges ($N_Y = \pm 1.0$) to guarantee rock-solid visibility at all camera angles.

3. **Kinematic Visibility & De-Occlusion:**
   * Drive shafts, torque couplers, lead screws, and belts must never be encased inside continuous blind housings.
   * Maintain intentional mechanical gap clearances ($\ge 15\text{--}20\text{ mm}$) exposing drive couplings and bearings.
   * Audit all assemblies for orphaned stubs or obsolete shaft journals from superseded revisions.

4. **Mechanical Abutment & Structural Continuity:**
   * Linear guide rails, brackets, and levers must never float in free space. Verify that rail start/end coordinates terminate squarely against solid geometry.
   * When mating components have mismatched cross-sections, author an intermediate mounting face plate or flange pad to solidly anchor the parts.

5. **Coplanar Face Standoff (Anti-Z-Fighting):**
   * Distinct components with contrasting materials or colors must not share identical coordinate planes.
   * Enforce a minimum standoff offset of $\ge 0.5\text{ mm}$ between non-fused contact surfaces (e.g. catch bins on cure beds) to prevent z-fighting and texture flicker.

6. **Client-Side Canvas Viewport Aspect Ratio Invariant:**
   * `<canvas>` raster buffer resolution (`canvas.width`, `canvas.height`) must dynamically track CSS display dimensions (`rect.width`, `rect.height`) via `ResizeObserver`.
   * Hardcoded buffer dimensions with percentage CSS classes are prohibited to prevent non-uniform aspect-ratio stretching in responsive or split-screen viewports.

7. **Mandatory Pre-Push Headless Iteration Gate:**
   * Never push 3D model modifications to GitHub Pages without running and passing the complete headless verification suite:
     1. `npm run test:models` (`python3 scripts/test_models.py`): Enforces the Three Mandatory CAD Geometry Invariants:
        - Rule 1: No objects may be inside of other objects (AABB and 3D ray-casting point-in-polyhedron containment).
        - Rule 2: Each object must be whole, solid, and possible to 3D print (watertight 2-manifold with 0 boundary and 0 non-two edges, $(u,v) \leftrightarrow (v,u)$ directed edge cancellation, $\chi \le 2$, $V_{\text{signed}} > 0\text{ mm}^3$, $dx, dy, dz \ge 1.0\text{ mm}$, zero degenerate faces).
        - Rule 3: Each object must have dual inner and outer normals calculated and verified ($\|\mathbf{n}\| = 1.0$, $\mathbf{n}_{\text{outer}} \cdot \mathbf{n}_{\text{inner}} = -1.0$).
     2. `python3 scripts/reconcile_all_cad_orientations.py`: Audits and reconciles normal orientations, dual inner/outer normals, and winding orders across all glTF models.
     3. `python3 biosphere-ops/scripts/lint_hardware_docs.py`: Asserts 0 doc, table pricing, or ModelViewer link errors.
   * Iterate and resolve all detected flaws locally before executing `git commit` and `git push`.
