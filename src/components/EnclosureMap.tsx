import React, { useState } from 'react';
import { Layers, Droplets, Bot, Thermometer, Sun, Compass } from 'lucide-react';

interface ZoneDetail {
  id: string;
  name: string;
  elevation: string;
  area: string;
  waterVolume: string;
  crops: string[];
  subsystems: string[];
  specs: {
    par: string;
    ec: string;
    ph: string;
    temp: string;
  };
  description: string;
}

const ZONES: Record<string, ZoneDetail> = {
  basin: {
    id: 'basin',
    name: 'Central Basin & Deep Water Sump',
    elevation: '0.0 - 4.5 ft liquid depth',
    area: '160 sq ft (80% of footprint)',
    waterVolume: '~5,200 Gallons',
    crops: ['Wolffia globosa (Asian Watermeal)', 'Solanum tuberosum (Dwarf Aeroponic Potato)', 'Monostroma nitidum'],
    subsystems: ['Fluidic Skimmer & Wedge-Wire Dewatering', 'Sub-surface TPS Aeroponic Root Misters', 'Biofilter Multi-Stage Recirculator'],
    specs: {
      par: '150 - 250 µmol/m²/s',
      ec: '1.2 - 1.8 mS/cm',
      ph: '6.5 - 7.0',
      temp: '22°C - 26°C water',
    },
    description: 'Deep reservoir holding 5,200 gallons of continuously skimmed, aerated water. Primary continuous protein engine via floating Wolffia mats and subterranean potato aeroponic chambers suspended in misting baffles.',
  },
  lower: {
    id: 'lower',
    name: 'Perimeter Lower Tier & AGV Service Lane',
    elevation: '0.5 - 1.2 ft elevation',
    area: '40 sq ft perimeter ribbon',
    waterVolume: '~350 Gallons (Ebb & Flow)',
    crops: ['Phaseolus vulgaris (Dwarf Bush Bean)', 'Vigna radiata (Mung Bean Dark Canister)'],
    subsystems: ['Ground Track AGV Corridor', 'Automated Canister Revolving Dock Station'],
    specs: {
      par: '0 (Canisters) to 300 µmol/m²/s',
      ec: '0.8 - 1.6 mS/cm',
      ph: '6.5 - 6.8',
      temp: '18°C - 24°C ambient',
    },
    description: 'Ground-level robotic maintenance corridor and dark-chamber hypocotyl bioreactor docking bay. Low-profile tracked AGVs navigate this perimeter to service rotating sprout drums and pick bush bean pods with stereo-depth arm claws.',
  },
  mid: {
    id: 'mid',
    name: 'Perimeter Mid Tier & Hydroponic NFT Gutters',
    elevation: '1.2 - 2.5 ft elevation',
    area: '40 sq ft perimeter ribbon',
    waterVolume: '~250 Gallons (Recirculating NFT)',
    crops: ['Portulaca oleracea (Purslane)', 'Capsicum annuum (Bush Pepper)', 'Wasabia japonica (Sawa Bed)'],
    subsystems: ['Aerial Spotter Drone Downwash Deck', '2-Axis Gantry Linear Harvesting Arm', 'Precision Micro-Dosing Injection Array'],
    specs: {
      par: '300 - 550 µmol/m²/s',
      ec: '1.8 - 2.4 mS/cm',
      ph: '6.0 - 6.5',
      temp: '21°C - 27°C day / 18°C night',
    },
    description: 'High-intensity LED photosynthetic production zone. NFT channels support succulent purslane and dwarf peppers. Aerial spotter quadcopters use prop-wash vibration for flower pollination, while linear gantry arms harvest succulent greens.',
  },
  espalier: {
    id: 'espalier',
    name: 'Trellised Vertical Espalier Guideframe',
    elevation: '2.5 - 4.0 ft vertical boundary wall',
    area: '40 sq ft vertical canopy wall',
    waterVolume: '~200 Gallons (Drip Aeroponics)',
    crops: ['Morus alba (Dwarf Bush Mulberry)', 'Physalis peruviana (Goldenberry)'],
    subsystems: ['Mantis Branch-Crawling Robot', 'Precision Micro-Shear & Vacuum Catch Pod', 'Rigid V-Slot Localization Rails'],
    specs: {
      par: '350 - 500 µmol/m²/s',
      ec: '1.8 - 2.0 mS/cm',
      ph: '6.0 - 6.2',
      temp: '20°C - 28°C ambient',
    },
    description: 'Vertical wall boundary fitted with rigid guideframe wires. Houses espaliered berry shrubs engineered for the dual-roller Mantis crawler to index branches, measure ripeness with NIR cameras, and vacuum-harvest fruit without bruising.',
  },
};

export default function EnclosureMap() {
  const [activeZone, setActiveZone] = useState<string>('basin');
  const zone = ZONES[activeZone];

  return (
    <div className="w-full my-6 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive SVG Diagram */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xl">
          <div className="flex justify-between items-center mb-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Spatial Datum Blueprint (20x10 ft Pool Envelope)</span>
            </div>
            <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-mono">
              Volume: ~6,000 Gallons | Height: 4.5 ft Max
            </span>
          </div>

          <div className="w-full aspect-[16/10] bg-slate-950/80 rounded-lg border border-slate-800/80 p-2 relative flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 800 500" className="w-full h-full">
              {/* Outer Boundary & V-Slot Rails */}
              <rect x="40" y="40" width="720" height="420" rx="20" fill="#090d16" stroke="#334155" strokeWidth="3" strokeDasharray="8 6" />
              <text x="50" y="30" fill="#64748b" fontSize="12" fontFamily="monospace">Absolute Datum Origin (0,0,0)</text>

              {/* Perimeter Espalier Wall (Top/Back) */}
              <g
                onClick={() => setActiveZone('espalier')}
                className="cursor-pointer transition-all duration-200 group"
              >
                <rect
                  x="60"
                  y="60"
                  width="680"
                  height="60"
                  rx="8"
                  fill={activeZone === 'espalier' ? '#4c1d95' : '#1e1b4b'}
                  stroke={activeZone === 'espalier' ? '#a855f7' : '#6b21a8'}
                  strokeWidth={activeZone === 'espalier' ? '3' : '1.5'}
                  className="transition-colors"
                />
                <text x="400" y="95" textAnchor="middle" fill="#e9d5ff" fontSize="14" fontWeight="600">
                  Trellised Espalier Vertical Wall (2.5 - 4.0 ft) • Mantis Crawler Route
                </text>
              </g>

              {/* Perimeter Mid Tier (NFT Gutters) */}
              <g
                onClick={() => setActiveZone('mid')}
                className="cursor-pointer transition-all duration-200 group"
              >
                <rect
                  x="60"
                  y="135"
                  width="680"
                  height="65"
                  rx="8"
                  fill={activeZone === 'mid' ? '#065f46' : '#064e3b'}
                  stroke={activeZone === 'mid' ? '#10b981' : '#047857'}
                  strokeWidth={activeZone === 'mid' ? '3' : '1.5'}
                  className="transition-colors"
                />
                <text x="400" y="172" textAnchor="middle" fill="#a7f3d0" fontSize="14" fontWeight="600">
                  Perimeter Mid Tier (1.2 - 2.5 ft) • NFT Gutters & Aerial Drone Flight Deck
                </text>
              </g>

              {/* Central Basin (Core Pool Reservoir) */}
              <g
                onClick={() => setActiveZone('basin')}
                className="cursor-pointer transition-all duration-200 group"
              >
                <rect
                  x="60"
                  y="215"
                  width="680"
                  height="160"
                  rx="12"
                  fill={activeZone === 'basin' ? '#0c4a6e' : '#082f49'}
                  stroke={activeZone === 'basin' ? '#38bdf8' : '#0284c7'}
                  strokeWidth={activeZone === 'basin' ? '3.5' : '2'}
                  className="transition-colors"
                />
                {/* Wave Lines */}
                <path d="M 80 280 Q 180 260 280 280 T 480 280 T 680 280" fill="none" stroke="#0ea5e9" strokeWidth="1.5" opacity="0.4" />
                <path d="M 80 320 Q 180 300 280 320 T 480 320 T 680 320" fill="none" stroke="#0ea5e9" strokeWidth="1.5" opacity="0.4" />
                <text x="400" y="270" textAnchor="middle" fill="#bae6fd" fontSize="16" fontWeight="bold">
                  Central Basin Reservoir (160 sq ft, 4.5 ft liquid depth)
                </text>
                <text x="400" y="295" textAnchor="middle" fill="#7dd3fc" fontSize="12">
                  5,200 Gallons • Continuous Surface Wolffia Skimming & TPS Aeroponics
                </text>
              </g>

              {/* Perimeter Lower Tier (AGV Lane & Canisters) */}
              <g
                onClick={() => setActiveZone('lower')}
                className="cursor-pointer transition-all duration-200 group"
              >
                <rect
                  x="60"
                  y="390"
                  width="680"
                  height="55"
                  rx="8"
                  fill={activeZone === 'lower' ? '#78350f' : '#451a03'}
                  stroke={activeZone === 'lower' ? '#f59e0b' : '#b45309'}
                  strokeWidth={activeZone === 'lower' ? '3' : '1.5'}
                  className="transition-colors"
                />
                <text x="400" y="423" textAnchor="middle" fill="#fde68a" fontSize="13" fontWeight="600">
                  Perimeter Lower Tier (0.5 - 1.2 ft) • AGV Track & Dark Canister Docks
                </text>
              </g>
            </svg>
          </div>

          {/* Quick zone tabs */}
          <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
            {Object.keys(ZONES).map((zKey) => (
              <button
                key={zKey}
                onClick={() => setActiveZone(zKey)}
                className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-all ${
                  activeZone === zKey
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                }`}
              >
                {zKey.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Zone Detail Panel */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start gap-2 mb-3">
              <div>
                <span className="text-emerald-400 font-mono text-xs uppercase tracking-wider block">Zone Specification</span>
                <h3 className="text-lg font-bold text-slate-100">{zone.name}</h3>
              </div>
              <span className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-md font-mono">
                {zone.elevation}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">{zone.description}</p>

            {/* Environmental Targets */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 mb-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Environmental & Fluidic Setpoints
              </span>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 text-[10px] block">PAR Light:</span>
                    <strong className="text-slate-200">{zone.specs.par}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Thermometer className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 text-[10px] block">Temperature:</span>
                    <strong className="text-slate-200">{zone.specs.temp}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 text-[10px] block">EC & pH:</span>
                    <strong className="text-slate-200">{zone.specs.ec} | pH {zone.specs.ph}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 text-[10px] block">Water Volume:</span>
                    <strong className="text-slate-200">{zone.waterVolume}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Crops Assigned */}
            <div className="mb-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Resident Crop Taxa
              </span>
              <ul className="space-y-1">
                {zone.crops.map((c, i) => (
                  <li key={i} className="text-xs text-slate-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            {/* Subsystems & Robotics */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Active Robotics & Hardware
              </span>
              <ul className="space-y-1">
                {zone.subsystems.map((s, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-center gap-1.5">
                    <Bot className="w-3 h-3 text-teal-400 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Area: <strong className="text-slate-200">{zone.area}</strong></span>
            <a
              href={`${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/zones/${zone.id}`}
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Full Zone Blueprint →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
