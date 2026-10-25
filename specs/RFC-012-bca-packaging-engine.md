# RFC-012: Closed-Loop Bio-Pitch & Ceramic Aggregate (BCA) Packaging Engine

**Status:** Proposed

**Category:** Processing Machinery / Open Hardware Specification

**Ecosystem:** `ag-diy` (Zero-Plastic Agricultural & Processing Architecture)

---

## 1. Executive Summary

Current "biodegradable" single-use containers rely either on high-embodied-energy vitrification (standard ceramics, $>1000^\circ\text{C}$), fluorinated paper/cardboard composites (PFAS/polyethylene coatings), or industrial-compost-only polymers (PLA) that fail to degrade in ambient environments.

RFC-012 defines a closed-loop, zero-plastic, infinitely recyclable rigid packaging architecture. The system combines coarse mineral aggregate (crushed terracotta/bisque grog) with the heavy phenolic pitch fraction obtained directly from the condensation trap of a biomass pyrolysis retort. The resulting **Bio-Pitch Ceramic Aggregate (BCA)** cures at low temperatures ($140^\circ\text{C}$ to $220^\circ\text{C}$) into water-resistant, structurally rigid vessels. Re-processing requires no fine ball-milling; spent containers are thermally softened ($~250^\circ\text{C}$), crushed down to coarse gravel via low-RPM toothed rolls, re-metered with binder, and re-extruded.

---

## 2. Chemical & Material Dynamics

```
Biomass Retort (Pyrolysis) ──> Heavy Phenolic Pitch (Bio-Tar)
                                            │
                                            ▼
Crushed Ceramic Grog (1–3 mm) ──> [Heated Pug Mill (150°C)] ──> [Heated Die Press] ──> Rigid Vessel
       ▲                                                                                   │
       └────────────── [Low-RPM Crusher (250°C Thermal Break)] ◄───────────────────────────┘

```

### 2.1 The Binder Phase (Pyrolysis Heavy Tar)

* **Source:** Heavy condensed fraction from the secondary/tertiary liquid trap of the biomass pyrolysis reactor.
* **Composition:** High-molecular-weight polycyclic aromatics, oligomeric guaiacols, syringols, and heavy bio-pitch residues.
* **Thermal Behavior:** Viscous fluid at $80^\circ\text{C}$–$110^\circ\text{C}$; fully reactive/cross-linking between $140^\circ\text{C}$ and $220^\circ\text{C}$.
* **Volatilization Threshold:** Above $250^\circ\text{C}$, the polymer matrix decomposes or softens, releasing bond adhesion without requiring mechanical pulverization of the underlying stone.

### 2.2 The Structural Aggregate Phase (Grog / Fired Clay)

* **Mesh Size:** 10 to 30 mesh (approximately 0.6 mm to 2.0 mm). Coarse, jagged angular fracture profiles maximize mechanical interlock.
* **Embodied Energy Reduction:** Zero vitrification stage during compounding. Raw material consists of recycled broken bisque, spent pottery, or coarse brick grog.
* **Function:** Compressive strength backbone, thermal mass, and dimensional barrier.

### 2.3 Environmental Failure Mode

* Non-hazardous failure: If discarded in topsoil, soil microbes and fungal hyphae slowly metabolize the phenolic carbon matrix over 12–24 months.
* Remainder: Chemically inert, coarse porous clay aggregate that acts as an aeration soil amendment. Zero microplastics, zero endocrine disruptors, zero synthetic fluorochemicals.

---

## 3. Machine Hardware Architecture

The machine is a standalone, single-chassis recycling and forming system designed to bolt directly into thermal exhaust or low-draw electric loops.

```
       [Spent Containers In]
                 │
                 ▼
     ┌───────────────────────┐
     │ 1. Thermal Stripping  │ ◄── Low-grade pyrolysis syngas / waste heat (~250°C)
     │    & Toothed Breaker  │
     └───────────┬───────────┘
                 │ (1–3 mm Aggregate)
                 ▼
     ┌───────────────────────┐
     │ 2. Jacketed Pug Auger │ ◄── Metered Bio-Pitch Injector (~150°C)
     └───────────┬───────────┘
                 │ (Homogeneous Hot Mastic)
                 ▼
     ┌───────────────────────┐
     │ 3. Variable-Aperture  │ ◄── 4-Way Stepper Gate (Width × Depth)
     │    Ram Extruder & Die │
     └───────────┬───────────┘
                 │
                 ▼
     ┌───────────────────────┐
     │ 4. Slicing Wire &     │ ◄── Piano-Wire Shear + Rapid Radiant Zone (180°C)
     │    Flash Cure Rack    │
     └───────────────────────┘

```

### 3.1 Module 1: Thermal Stripper & Coarse Breaker

* **Design:** Twin counter-rotating, low-RPM, high-torque toothed shafts manufactured from manganese or tool steel.
* **Thermal Assist:** Exhaust jacket running at $220^\circ\text{C}$–$250^\circ\text{C}$ softens incoming bio-pitch bonds prior to mechanical tooth engagement.
* **Tolerances:** 2 mm shaft-to-tooth clearance; avoids crushing stone grains into fine powder, preserving angular gravel structure and saving torque.

### 3.2 Module 2: Heated Pug Auger

* **Barrel:** 304 stainless steel or carbon steel jacketed pipe, maintained at $140^\circ\text{C}$–$160^\circ\text{C}$.
* **Feed:** Gravity-fed crushed aggregate combined with a positive-displacement heated gear pump injecting liquid heavy tar at a 12–18% weight ratio.
* **Mixing Action:** Progressive pitch flighting shears the mastic into a uniform, hydrophobic dough.

### 3.3 Module 3: Variable-Aperture Forming Head

* **Extrusion Engine:** Heavy hydraulic or AC-geared electric lead-screw ram driving hot mastic through the die face.
* **Variable Die Gates:** Four overlapping steel gate plates actuated by independent stepper lead screws. Automatically adjusts box profile dimensions ($X \times Y$) on command via machine controller.
* **Base Plate Compression:** Secondary bottom-forming ram strokes upward to stamp the container floor before vertical wall extrusion begins.

### 3.4 Module 4: Flying Shear & Flash Sinter

* **Cutoff:** Spring-tensioned music wire on a sliding carriage cuts extruded wall profiles to programmed height ($Z$).
* **Rapid Thermal Stabilization:** Formed boxes pass through a 3-minute radiant tunnel ($180^\circ\text{C}$–$200^\circ\text{C}$) to flash off trace light volatiles and cross-link surface aromatics. Solidifies into rigid form immediately upon ambient drop.

---

## 4. Operational Specifications

| Parameter | Traditional Fired Ceramic | PLA Bioplastic | RFC-012 BCA Composite |
| --- | --- | --- | --- |
| **Forming Temp** | $950^\circ\text{C}$–$1200^\circ\text{C}$ | $180^\circ\text{C}$–$210^\circ\text{C}$ | **$140^\circ\text{C}$–$180^\circ\text{C}$** |
| **Embodied Energy** | Massive (Refractory kiln) | High (Chemical synthesis) | **Minimal (Pyrolysis waste heat)** |
| **Grind Requirement** | Fine Ball Mill ($<75\,\mu\text{m}$) | N/A (Pelletized) | **Coarse Crunch ($1000$–$3000\,\mu\text{m}$)** |
| **Solvent/Water Need** | Critical (Hydration balance) | Industrial solvents | **Zero (Dry aggregate + hot pitch)** |
| **Cycle Turnaround** | 12 to 36 Hours | Minutes | **$<5$ Minutes** |
| **Degradation State** | Geological (Indefinite) | Landfill-Persistent | **Soil Mineral + Humic Carbon** |

---

## 5. Implementation Roadmap

1. **Benchtop Formulation Test:**
* Blend 85% crushed terracotta shard gravel (1–2 mm mesh) with 15% heavy wood-tar bottom-fraction.
* Press in unglazed test die at $160^\circ\text{C}$ under hand-arbor mechanical pressure.
* Test flexural strength, dry-drop shatter limit, and cold-water structural resilience over 7 days.


2. **Breaker Prototype:**
* Build twin-shaft toothed cruncher; calibrate jaw spacing to produce consistent aggregate without creating dust/fines.


3. **Draft CAD Schema:**
* Generate `ag-diy/machinery/bca-box-press` repository entry, defining bill of materials (steel tube stock, heater bands, stepper-driven die geometry).
