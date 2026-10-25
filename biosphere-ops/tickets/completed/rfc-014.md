# RFC-014: Standardized GLTF Asset Pipeline, Hierarchical Sub-Model Composition, and Web Viewer Navigation

**Status:** Proposed

**Category:** Software Architecture / CAD & Visualization Pipeline

**Ecosystem:** `ag-diy` (Zero-Plastic Agricultural & Processing Architecture)

---

## 1. Context & Motivation

Previous visual documentation relied on 2D vector graphic projections (SVGs) and fragmented export pipelines. This generated duplicate maintenance overhead, occluded critical mating faces, and required fragile line-clipping workarounds for complex mechanical steps.

Because the system engine already generates parametric 3D geometry for all structural components (such as the BCA box press, pyrolytic retort assemblies, and extruder mounts), maintaining legacy vector drafting is redundant. RFC-014 formalizes a transition to a standardized 3D runtime pipeline:

1. Deprecates flat 2D blueprint exports in favor of native web-rendered **GLTF/GLB** assets.
2. Enhances the embedded 3D step viewer with discrete UI zoom controls alongside standard touch/mouse orbital interaction.
3. Establishes a hierarchical scene graph architecture where composite models directly reference reusable, modular sub-models via relative URIs rather than flattening assemblies into bloated monolithic files.

---

## 2. Technical Specification

### 2.1 Standardized Delivery Format: GLTF/GLB

* **Format Standard:** glTF 2.0 (`.gltf` with external buffers or single-file binary `.glb`).
* **Geometry & Materials:**
* PBR (Physically Based Rendering) standard material channels: Base Color, Metallic-Roughness, Normal.
* Strict avoidance of non-standard vendor extensions to preserve client-side WebGL/Three.js render parity.


* **Coordinate Conventions:**
* Axis alignment: Standard glTF coordinate space (Right-handed, $+Y$ Up, $+Z$ Forward).
* Units: Meters ($1.0 = 1\text{ m}$) across all component and assembly models to avoid runtime unit transforms.



### 2.2 Hierarchical Composition & Direct Sub-Model Referencing

Monolithic scene exports duplicate common hardware (bearings, lead screws, stepper motors, structural tubing) across multiple assembly files.

Under RFC-014, all composite models define their scene graph using declarative node references:

* **Node Hierarchy:** Master assembly files instantiate child sub-models by referencing their relative component paths rather than inlining repeated mesh primitives:
```json
{
  "nodes": [
    {
      "name": "PugAuger_Shaft_Assembly",
      "translation": [0.0, 0.45, 0.0],
      "rotation": [0.0, 0.0, 0.0, 1.0],
      "extras": {
        "ref": "../components/drive/shaft_hex_12mm.glb"
      }
    },
    {
      "name": "Bearing_PillowBlock_L",
      "translation": [-0.25, 0.45, 0.0],
      "extras": {
        "ref": "../components/hardware/bearing_ucp204.glb"
      }
    }
  ]
}

```


* **Runtime Resolver:** The client-side asset loader resolves external sub-model URIs concurrently, deduplicating mesh memory across identical structural instances.
* **Parametric Alignment:** Reusable off-the-shelf components remain isolated in `components/`, while machine assemblies reside in `assemblies/` and pull children into explicit transform matrices.

### 2.3 Interactive Viewer Enhancements (Zoom Controls & Navigation)

To improve accessibility on desktop terminals, mobile browsers, and touchscreen field hardware without relying solely on pinch-to-zoom or scroll wheels:

* **UI Overlay:** Introduce an on-screen HUD layer positioned on the viewer canvas displaying dedicated zoom buttons:
* **Zoom In (`+`):** Incremental camera dolly along the current view vector toward the target orbit center.
* **Zoom Out (`−`):** Incremental camera dolly away from the target orbit center along the view vector.


* **Camera Bounds:**
* Dynamic clamp on minimum distance ($r_{\text{min}}$) based on model bounding box radius to prevent clipping into interior geometry.
* Clamped maximum distance ($r_{\text{max}}$) to keep the assembly framed within the frustum.


* **Step-Action Sync:** Step progression controls trigger camera interpolation (lerp) to predefined focus targets, ghosting preceding sub-assemblies (opacity $0.25$) while highlighting the newly inserted component ($1.0$ opacity, accent edge).

---

## 3. Directory & Asset Layout

```
repo/
├── specs/
│   ├── RFC-012-bca-packaging-engine.md
│   └── RFC-014-gltf-pipeline-submodel-referencing.md
├── cad/
│   ├── components/            # Atomic, reusable sub-models
│   │   ├── hardware/          # Bearings, fasteners, springs
│   │   └── drive/             # Rollers, shafts, gears
│   └── assemblies/            # Composite scene graphs referencing components
└── web/
    └── viewer/
        ├── controls/
        │   ├── OrbitControls.js
        │   └── ZoomHUD.js     # Discrete zoom in/out button overlay
        └── loader/
            └── SceneGraphResolver.js

```

---

## 4. Implementation Checklist

1. **Asset Pipeline:** Configure automated export targets in the parametric CAD build script to generate glTF 2.0 binaries (`.glb`) instead of SVG/vector wireframes.
2. **Viewer Interface:** Implement `<button id="zoom-in">+</button>` and `<button id="zoom-out">−</button>` in the WebGL viewer HUD, binding clicks to programmatic camera dolly steps with smooth damping.
3. **Assembly Linker:** Update the scene loader module to parse `extras.ref` nodes, cache shared geometry buffers, and construct composite assembly hierarchies at runtime.
