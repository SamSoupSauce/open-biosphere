# Open Biosphere (Autonomous Closed Biosphere Agriculture Wiki)

[![Biosphere CI & Candidate Audit](https://github.com/SamSoupSauce/open-biosphere/actions/workflows/ci.yml/badge.svg)](https://github.com/SamSoupSauce/open-biosphere/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Built with Astro](https://img.shields.io/badge/Built%20with-Astro%205-FF5D01.svg)](https://astro.build)
[![Starlight](https://img.shields.io/badge/Documentation-Starlight-064e3b.svg)](https://starlight.astro.build)

An open-source technical specification and research platform for contained biosphere agriculture, autonomous multi-agent robotics, and continuous ML crop auditing within an enclosed **~6,000-gallon pool biosystem (~20x10 ft footprint, 4.5 ft vertical clearance)**.

---

## 🌟 Key Architecture Pillars

- **Physical Envelope**: Retrofits a ~200 sq ft pool into 4 discrete spatial zones:
  - **Central Basin (160 sq ft, 4.5 ft depth)**: Continuous floating *Wolffia* protein engine, True Potato Seed (TPS) aeroponics, and wedge-wire biofilter loops.
  - **Perimeter Lower Tier (40 sq ft, 0.5–1.2 ft)**: Ground Track AGV corridors and rotating dark-chamber sprout canisters.
  - **Perimeter Mid Tier (40 sq ft, 1.2–2.5 ft)**: Hydroponic NFT gutters (purslane, peppers, wasabi) with aerial drone pollination.
  - **Trellised Espalier (40 sq ft, 2.5–4.0 ft wall)**: Vertical guideframes for the dual-roller Mantis branch-crawler.
- **Multi-Agent Robotics**:
  - **Aerial Spotter Quadcopters**: Propeller-wash resonant buzz-pollination and multispectral ripeness mapping.
  - **Mantis Branch-Crawler**: Dual-opposed silicone pinch rollers and vacuum-assisted fruit shearing.
  - **Ground Track AGVs**: Automated revolving canister exchange and lateral pod severing.
- **Decoupled Dual-File Crop Contract**:
  - `data.json`: Canonical machine/ML contract validated against strict JSON Schema (50+ biochemical, amino acid, vitamin, and mineral fields).
  - `guide.mdx`: Qualitative human research notes, cultivation SOPs, and culinary recipes.
- **Continuous Ticket Auditing Engine**: Ticket-driven proposal pipeline (`biosphere-ops/tickets/`) with automated schema validation.

---

## 📊 Candidate Crop Index Preview

| Crop | Taxon | ML Score | Primary Advantage | Primary Technical Challenge |
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

## 🚀 Getting Started

### Prerequisites
- Node.js `v20+` or `v22+`
- Python `3.10+` (for candidate schema validator)

### Installation
```bash
# Clone the repository
git clone https://github.com/SamSoupSauce/open-biosphere.git
cd open-biosphere

# Install dependencies
npm install --legacy-peer-deps
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:4321](http://localhost:4321) in your browser.

### Candidate Data Contract Audit
Audit all candidate crop JSON files against the canonical schema:
```bash
npm run audit:crops
```

### Production Build
```bash
npm run build
```

---

## 📂 Repository Organization

```
open-biosphere/
├── .github/
│   ├── workflows/ci.yml       # GitHub Actions CI for build & schema audits
│   └── ISSUE_TEMPLATE/        # Standardized RFC proposal templates
├── biosphere-ops/             # Continuous ticket ingestion daemon
│   ├── schemas/               # JSON Schema data contracts
│   ├── scripts/               # Python validation & scoring tools
│   └── tickets/               # inbox / processing / completed ticket workflow
├── src/
│   ├── components/            # Interactive React islands (Matrix, Map, Kanban, Header)
│   ├── content/docs/          # Starlight MDX pages (crops, hardware, zones, rfcs)
│   ├── data/crops/            # Canonical machine-readable JSON crop contracts
│   └── styles/                # Tailwind CSS v4 stylesheets
├── astro.config.mjs           # Astro Starlight & Tailwind configuration
├── package.json
└── README.md
```

---

## 📜 Contributing & RFCs

New crop species proposals and hardware designs are tracked as Request for Comments (RFCs):
1. Review existing proposals on the [RFC Kanban Board](/rfcs/board/).
2. Submit a proposal using the `.github/ISSUE_TEMPLATE/` forms.
3. Validate candidate data contracts locally with `python3 biosphere-ops/scripts/validate_candidates.py`.

---

## ⚖️ License

Licensed under the [Apache License, Version 2.0](LICENSE).
