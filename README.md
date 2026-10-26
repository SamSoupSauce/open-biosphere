# Open Biosphere (Umbrella Open-Hardware Project)

[![Biosphere CI, Audit & Pages Deployment](https://github.com/SamSoupSauce/open-biosphere/actions/workflows/ci.yml/badge.svg)](https://github.com/SamSoupSauce/open-biosphere/actions/workflows/ci.yml)
[![Live Documentation](https://img.shields.io/badge/Live%20Wiki-samsoupsauce.github.io%2Fopen--biosphere-064e3b.svg)](https://samsoupsauce.github.io/open-biosphere/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with Astro](https://img.shields.io/badge/Built%20with-Astro%205-FF5D01.svg)](https://astro.build)
[![Starlight](https://img.shields.io/badge/Documentation-Starlight-064e3b.svg)](https://starlight.astro.build)

> **An open-hardware specification and research platform designed around enabling end-users, homesteaders, and makers to build essential agricultural, homesteading, and off-grid machines out of common or easily ordered parts (COTS) and 3D prints.**

🌐 **Live Technical Wiki & Interactive Islands**: [https://samsoupsauce.github.io/open-biosphere/](https://samsoupsauce.github.io/open-biosphere/)

---

## 🌟 The Umbrella Philosophy

Rather than requiring builders to construct a single monolithic, multi-thousand-dollar apparatus, **Open Biosphere** is architected as an **interlocking ecosystem of smaller, autonomous, standalone machines**:

1. **Build Individually**: Each machine can be fabricated and deployed as an independent homesteading, kitchen, or farm tool (e.g. an automated duckweed pond skimmer, an off-grid rotating sprout drum, or a narrow-aisle greenhouse utility rover).
2. **Tri-Modal Control Standard**: Every machine is operable across three distinct tiers:
   - ✋ **Tier 1 (Manual)**: 100% mechanical operation using hand levers, rotary cranks, bypass ball valves, and gravity/siphons (zero electricity / EMP-proof fallback).
   - 🔘 **Tier 2 (Buttons & Dials)**: Local electromechanical control using tactile push-buttons, rotary countdown dials, toggle switches, and wired pendants (no software, cloud, or firmware needed).
   - 🤖 **Tier 3 (Autonomous AI)**: Edge AI vision (YOLO segmentation on Raspberry Pi/Jetson), closed-loop sensor telemetry, and automated multi-agent orchestrations.
3. **Assemble Progressively**: When combined along standardized Cartesian mounting extrusions, a unified 24V DC bus, and recirculating plumbing, all machines interlock into the **Master Biosphere Assembly** within a standard **~20x10 ft footprint (~200 sq ft, 4.5 ft vertical clearance, ~6,000-gallon pool envelope)**.

---

## 🛠️ The Modular Machine Suite

| Machine | Category | Standalone Homestead / Off-Grid Use Case | Core COTS Parts | Stage 0 (Manual) | Stage 2 (Autonomous) |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **[Fluidic Skimmer & Dewatering Loop](https://samsoupsauce.github.io/open-biosphere/hardware/fluidic-skimmer-loop/)** | Harvester | Skims duckweed/watermeal on farm ponds & aquaponics systems; dewaters green protein paste. | 316L Wedge-wire screen, 24V BLDC pump, NEMA 23 auger, ESP32 | **$180.00** | **$437.00** |
| **[Revolving Sprout Bioreactor](https://samsoupsauce.github.io/open-biosphere/hardware/revolving-sprout-bioreactor/)** | Bioreactor | Off-grid tumbling bioreactor yielding 3.5 kg fresh sprouts every 96 hrs without soil or sunlight. | 2020 extrusion, perforated stainless drum, NEMA 17, ozone generator | **$145.00** | **$381.00** |
| **[Mantis Branch-Crawler Robot](https://samsoupsauce.github.io/open-biosphere/hardware/mantis-branch-crawler/)** | Robotics | Orchard trellis climber navigating guide wires to pick soft berries with cushioned vacuum suction. | Shore 40A silicone rollers, NEMA 14 steppers, stereo cameras, ESP32-S3 | **$93.00** | **$405.00** |
| **[Ground Track AGV Pod Carrier](https://samsoupsauce.github.io/open-biosphere/hardware/ground-track-agv/)** | Robotics | Narrow-aisle greenhouse rover with quick-clamp latch for hauling sprout drums, harvest totes, and soil. | Continuous rubber tracks, dual 15A drivers, 24V LiFePO4, 2D LiDAR | **$119.00** | **$497.00** |
| **[2-Axis Precision Overhead Gantry](https://samsoupsauce.github.io/open-biosphere/hardware/overhead-gantry-system/)** | Motion | Cartesian motion gantry with dual-mode magnetic/dovetail tool mount for micro-seeding and harvesting. | 2040 V-slot extrusions, GT2 9mm steel belts, NEMA 23 steppers, ESP32-S3 | **$193.40** | **$603.40** |
| **[Aerial Spotter & Pollination Drone](https://samsoupsauce.github.io/open-biosphere/hardware/aerial-pollination-drone/)** | Drone | Greenhouse flower pollinator using tuned acoustic vibration resonance for blossom pollination without bees. | 85mm whoop frame, 1103 motors, optical flow sensor, STM32F4 AIO | **$52.00** | **$324.00** |
| **[Microclimate & Dosing Array](https://samsoupsauce.github.io/open-biosphere/hardware/microclimate-dosing-array/)** | Automation | Universal automation brain for grow rooms; controls 6 peristaltic channels, CO₂ injection, and humidity. | 12V peristaltic pumps (6x), Atlas pH/EC probes, Sensirion SCD41 CO₂ sensor | **$122.00** | **$436.00** |
| **[TPS Aeroponic Root Chamber](https://samsoupsauce.github.io/open-biosphere/hardware/tps-root-chamber/)** | Grow Box | Pathogen-free seed potato generation from botanical seeds; non-destructive mini-tuber harvesting. | Food-grade HDPE tote, 120 PSI booster pump, EPDM light seals, mist nozzles | **$105.00** | **$290.00** |
| **[Bio-Pitch & Ceramic Packaging Engine](https://samsoupsauce.github.io/open-biosphere/hardware/bca-packaging-engine/)** | Processing | Converts reclaimed grog/terracotta aggregate and pine tar into rigid, biodegradable bio-composite pots. | Toothed manganese breaker shafts, 304 SS pug barrel, 24V 250W gearmotor | **$285.00** | **$690.00** |
| **Total Facility Fleet (9 Machines)** | — | **Complete Tri-Modal Autonomous Production Suite** | — | **$1,294.40** | **$3,863.40** |

---

## 🏛️ Master Assembly Physical Envelope (~20x10 ft Footprint)

When assembled into the full closed-loop biosphere, the machines integrate around standard **4040/2040 V-slot aluminum extrusions** retrofitted across a 6,000-gallon pool envelope:

- **Central Basin (160 sq ft, 4.5 ft depth)**: Continuous floating *Wolffia* mat, sub-surface TPS aeroponic root misting, and wedge-wire biofilter loops.
- **Perimeter Lower Tier (40 sq ft, 0.5–1.2 ft)**: Ground Track AGV corridors and rotating dark-chamber sprout canisters.
- **Perimeter Mid Tier (40 sq ft, 1.2–2.5 ft)**: Hydroponic NFT gutters (purslane, peppers, wasabi) with aerial drone pollination.
- **Trellised Espalier (40 sq ft, 2.5–4.0 ft wall)**: Vertical guideframes for the dual-roller Mantis branch-crawler.

---

## 📊 Candidate Crop Index

| Crop | Taxon | ML Score | Standalone Advantage | Primary Technical Challenge |
| :--- | :--- | :---: | :--- | :--- |
| **Wolffia globosa** | *W. globosa* | **9.8** | Zero structural waste; non-contact CV volume continuous harvesting | Sub-millimeter particle management in fluid lines |
| **Vigna radiata** | *V. radiata* | **9.1** | Ultra-fast 4-day turnover in zero-light dark canisters | Drum rotation and ozonated flush automation |
| **Wasabia japonica** | *W. japonica* | **8.4** | High bioactive & economic density; perfect for automated PID control | Long cycle; indirect rhizome vision due to root coverage |
| **Capsicum annuum** | *C. annuum* | **8.2** | Extreme Vitamin C density; non-contact drone pollination | Sensitive to Blossom End Rot if transpiration drops |
| **Morus alba** | *M. alba* | **8.1** | Espalier-trained fruit bush; Mantis branch climber harvesting | Soft fruit requires cushioned vacuum catch pod |
| **Portulaca oleracea** | *P. oleracea* | **7.9** | Programmable CAM/C3 switch; ultra-high terrestrial ALA omega-3 | Sprawling growth form if lighting spectrum drifts |
| **Phaseolus vulgaris** | *P. vulgaris* | **7.8** | High dietary fiber, plant protein; atmospheric nitrogen fixation | Green-on-green optical occlusion requires stereo depth |
| **Solanum tuberosum** | *S. tuberosum* | **7.5** | High caloric density; continuous selective root-bay picking | High canopy biomass; heavy PAR requirements |
| **Crocus sativus** | *C. sativus* | **6.8** | Massive market value ROI for gantry micro-tweezers | Multi-phase thermal staging; delicate optical extraction |
| **Physalis peruviana** | *P. peruviana* | **6.1** | Withanolide bioactive density; espalier wall boundary | Papery husk conceals internal berry color from RGB |
| **Abelmoschus esculentus**| *A. esculentus* | **5.8** | Rapid pod elongation curve tracking; prebiotic mucilage fiber | Strict daily harvest urgency before xylem lignification |
| **Monostroma nitidum** | *M. nitidum* | **5.2** | Direct thallus mineral uptake; high umami profiles | Saline corrosion; erratic tumble-culture computer vision |

---

## 🚀 Development & Local Run

```bash
# Clone the repository
git clone https://github.com/SamSoupSauce/open-biosphere.git
cd open-biosphere

# Install dependencies
npm install --legacy-peer-deps

# Start the Astro Starlight development server
npm run dev

# Audit all candidate crop contracts
npm run audit:crops

# Production build
npm run build
```

---

## ⚖️ License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more details.
