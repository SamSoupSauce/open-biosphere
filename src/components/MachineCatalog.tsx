import React, { useState, useMemo } from 'react';
import { Search, Wrench, DollarSign, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

export interface OpenMachine {
  id: string;
  name: string;
  category: 'Harvesters & Separators' | 'Mobile & Flying Robotics' | 'Grow Chambers & Bioreactors' | 'Automation & Dosing';
  tagline: string;
  standaloneUseCase: string;
  biosphereRole: string;
  estCostUSD: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  primaryCOTS: string[];
  docSlug: string;
  controls: {
    manual: string;
    buttons: string;
    ai: string;
  };
}

export const MACHINES_DATA: OpenMachine[] = [
  {
    id: 'fluidic-skimmer',
    name: 'Fluidic Skimmer & Dewatering Separator',
    category: 'Harvesters & Separators',
    tagline: 'Continuous aquatic surface biomass skimming & wedge-wire solids dewatering',
    standaloneUseCase: 'Duckweed & azolla harvesting on farm ponds, IBC aquaponics biofiltration, off-grid protein paste processor.',
    biosphereRole: 'Harvests continuous Wolffia protein mat and powers the 5,200-gal moving-bed biological filter loop in Central Basin.',
    estCostUSD: 280,
    difficulty: 'Intermediate',
    primaryCOTS: ['316L Wedge-Wire Screen', '24V Brushless Mag-Pump', 'NEMA 23 Auger', 'ESP32'],
    docSlug: 'fluidic-skimmer-loop',
    controls: {
      manual: 'Counterweighted hand lever raises/lowers weir gate; removable hand crank presses dewatering auger; bypass ball valve.',
      buttons: 'Waterproof IP67 toggle for pump speed (Low/Med/High); momentary push-button for auger forward/reverse jog.',
      ai: 'Overhead optical line-scanner measures frond mat thickness (>8 mm); edge AI dynamically modulates pump GPM and auger speed.',
    },
  },
  {
    id: 'sprout-bioreactor',
    name: 'Revolving Sprout Bioreactor Drum',
    category: 'Grow Chambers & Bioreactors',
    tagline: 'Photophobic rotating drum for continuous 4-day hypocotyl protein generation',
    standaloneUseCase: 'Kitchen counter or off-grid cabin appliance producing 3.5 kg of fresh mung bean sprouts every 96 hours without soil or sunlight.',
    biosphereRole: 'Docks into Perimeter Lower Tier maintenance lanes; serviced autonomously by Ground Track AGV.',
    estCostUSD: 197,
    difficulty: 'Beginner',
    primaryCOTS: ['2020 Aluminum Extrusion', 'Perforated Stainless Mesh', 'NEMA 17 Stepper', '12V Ozone Generator', 'ESP32-S3'],
    docSlug: 'revolving-sprout-bioreactor',
    controls: {
      manual: 'Removable hand-crank handle with ratchet pawl turns drum twice daily; manual brass valve drains rinse water by gravity.',
      buttons: 'Green tactile panel button jogs drum rotation; rotary mechanical countdown timer dials in misting intervals (0–60 min).',
      ai: 'ESP32-S3 executes precise 96-hour growth schedule, tracking humidity and triggering ozone washes; signals AGV when ripe.',
    },
  },
  {
    id: 'mantis-crawler',
    name: 'Mantis Branch-Crawler Robot',
    category: 'Mobile & Flying Robotics',
    tagline: 'Soft silicone pinch-roller climbing robot with vacuum fruit harvesting pod',
    standaloneUseCase: 'Trellis & espalier orchard harvester navigating guide wires to pick soft berries (figs, mulberries, blackberries) without bruising.',
    biosphereRole: 'Climbs the North-East vertical Trellised Espalier wall wires to harvest dwarf mulberries and goldenberries.',
    estCostUSD: 259,
    difficulty: 'Advanced',
    primaryCOTS: ['Shore 40A Cast Silicone Rollers', 'NEMA 14 Pancake Steppers', 'Raspberry Pi 5 + AI HAT', 'Micro Rotary Shear'],
    docSlug: 'mantis-branch-crawler',
    controls: {
      manual: 'Bowden cable hand-squeeze lever clamps rollers onto wire/branch; spring-loaded snips on extension pole trim pedicels.',
      buttons: 'Handheld 2.4 GHz RC transmitter with dual thumbsticks for driving and clamping; tactile index trigger fires shear & vacuum.',
      ai: 'On-device YOLOv8 on Raspberry Pi 5 / Jetson Orin detects ripe berries, controls clamping torque to 8.5 N, and auto-shears pedicels.',
    },
  },
  {
    id: 'ground-agv',
    name: 'Ground Track AGV Pod Carrier',
    category: 'Mobile & Flying Robotics',
    tagline: 'Narrow-aisle continuous-track utility rover with quick-docking canister latch',
    standaloneUseCase: 'Greenhouse & hoop house narrow-aisle material shuttling, seedling tray transport, and low-canopy selective bush harvesting.',
    biosphereRole: 'Traverses Perimeter Lower Tier magnetic tracks to exchange 4-day sprout canisters and pick dwarf bush beans.',
    estCostUSD: 250,
    difficulty: 'Intermediate',
    primaryCOTS: ['Tracked Tank Drive Chassis', 'Dual DC Motor Driver', '24V LiFePO4 Battery', 'Magnetic Line Sensor', 'ESP32-S3'],
    docSlug: 'ground-track-agv',
    controls: {
      manual: 'Fold-out steel push tiller handle with gearbox neutral lever; mechanical foot pedal unlatches cargo canister clamp.',
      buttons: 'Heavy-duty 3-button wired pendant (Forward, Reverse, Stop) with speed dial potentiometer; toggle switch for docking latch.',
      ai: 'Autonomous ROS2 stack navigates perimeter magnetic line tape and 2D LiDAR SLAM, shuttling canisters on scheduled cycles.',
    },
  },
  {
    id: 'overhead-gantry',
    name: '2-Axis Precision Overhead Gantry Array',
    category: 'Harvesters & Separators',
    tagline: 'Rigid Cartesian motion array with kinematic magnetic quick-swap toolheads',
    standaloneUseCase: 'Scalable automated garden/greenhouse gantry (FarmBot style) for laser weeding, micro-seeding, and saffron harvesting.',
    biosphereRole: 'Spans the pool perimeter at Z=1,200 mm to position macro optical cameras, micro-tweezers, and purslane shears with 0.15mm precision.',
    estCostUSD: 336,
    difficulty: 'Intermediate',
    primaryCOTS: ['2040 V-Slot Extrusions', 'GT2 9mm Steel-Core Belts', 'NEMA 23 Closed-Loop Steppers', 'BTT SKR Mainboard (Klipper)'],
    docSlug: 'overhead-gantry-system',
    controls: {
      manual: 'Disengageable belt-clamp tensioners allow gliding carriages freely by hand; squeeze-cable hand trigger operates toolhead shears.',
      buttons: 'Industrial 6-button directional CNC pendant (X+/-, Y+/-, Z+/-) with Fast/Slow toggle switch; manual toolhead fire button.',
      ai: 'Klipper CAN bus receives Cartesian trajectories from macro vision models to extract saffron stigmas and shear microgreens.',
    },
  },
  {
    id: 'aerial-drone',
    name: 'Aerial Spotter & Pollination Drone',
    category: 'Mobile & Flying Robotics',
    tagline: 'Autonomous ducted micro-quadcopter for resonant buzz-pollination & canopy multispectral mapping',
    standaloneUseCase: 'Indoor greenhouse non-contact acoustic flower pollinator for tomatoes and peppers without bees, plus early disease detection.',
    biosphereRole: 'Flies within canopy airspace using AprilTag localization to pollinate perimeter peppers and scan ripeness indices.',
    estCostUSD: 185,
    difficulty: 'Advanced',
    primaryCOTS: ['85mm Whoop Ducted Frame', '1103 Brushless Motors', 'AIO STM32 Flight Controller', 'PMW3901 Optical Flow', 'AprilTag Tracker'],
    docSlug: 'aerial-pollination-drone',
    controls: {
      manual: 'Handheld telescopic extension wand with passive mechanical vibrating head for direct flower sweeping during inspections.',
      buttons: 'Standard 2.4 GHz RC radio with dual gimbals and physical toggle switch for one-touch locked hover and buzz vibration.',
      ai: 'Optical flow and AprilTag visual fiducial navigation autonomously flies waypoint grid, holding station over blossoms to vibrate pollen.',
    },
  },
  {
    id: 'dosing-array',
    name: 'Microclimate & Automated Dosing Array',
    category: 'Automation & Dosing',
    tagline: '6-channel peristaltic nutrient doser, atmospheric CO2 injector, and PID climate regulator',
    standaloneUseCase: 'Universal brain for any grow tent, greenhouse, or DIY hydroponic rig to maintain pH, EC, CO2, and humidity autonomously.',
    biosphereRole: 'Orchestrates water chemistry across the entire 6,000-gal loop, dosing nitrates, phosphates, micronutrients, and pH regulators at 1 Hz.',
    estCostUSD: 268,
    difficulty: 'Beginner',
    primaryCOTS: ['12V Peristaltic Pumps (6x)', 'Isolated pH & EC Probes', 'Sensirion SCD41 CO2 Sensor', 'ESP32 / Pi CM4', 'MeanWell 24V PSU'],
    docSlug: 'microclimate-dosing-array',
    controls: {
      manual: 'Manual 3-way L-port ball valves gravity-drain measured stock from wall burettes; manual brass needle valve on CO2 tank.',
      buttons: '6 tactile momentary push-buttons for manual pump priming; analog potentiometer dials set dosing volume directly.',
      ai: 'Closed-loop 1 Hz PID algorithm reads isolated pH, EC, temperature, and CO2 electrodes, dispensing micro-doses automatically.',
    },
  },
  {
    id: 'tps-chamber',
    name: 'TPS Aeroponic Root-Zone Chamber',
    category: 'Grow Chambers & Bioreactors',
    tagline: 'Light-sealed aeroponic root misting box for continuous true potato seed mini-tuber generation',
    standaloneUseCase: 'Pathogen-free seed potato production from lightweight botanical seeds, saving 95% water with zero soil handling.',
    biosphereRole: 'Suspended in Central Basin misting bays; allows gantry suction toolhead to pick tubers while vines stay productive for 120+ days.',
    estCostUSD: 177,
    difficulty: 'Beginner',
    primaryCOTS: ['Heavy-Duty HDPE Tub', 'Dual-Labyrinth EPDM Light Seals', '120 PSI Booster Pump', 'Brass Misting Nozzles', 'ESP32 Relay'],
    docSlug: 'tps-root-chamber',
    controls: {
      manual: 'External hand-pump garden sprayer connects to silicone misting port; light-baffled inspection hatch opens for hand picking.',
      buttons: 'Rocker switch for continuous pump power; spring-wound mechanical dial timer runs 15-minute misting sessions without code.',
      ai: 'ESP32-C3 cycles 50 µm ultrasonic mist every 180 seconds based on transpiration; signals overhead gantry to pick ripe tubers.',
    },
  },
];

export default function MachineCatalog() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'cost_asc' | 'cost_desc' | 'name'>('cost_asc');
  const [expandedControlId, setExpandedControlId] = useState<string | null>(null);

  const categories = ['ALL', 'Harvesters & Separators', 'Mobile & Flying Robotics', 'Grow Chambers & Bioreactors', 'Automation & Dosing'];

  const filteredMachines = useMemo(() => {
    return MACHINES_DATA.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.standaloneUseCase.toLowerCase().includes(search.toLowerCase()) ||
        m.controls.manual.toLowerCase().includes(search.toLowerCase()) ||
        m.controls.buttons.toLowerCase().includes(search.toLowerCase()) ||
        m.primaryCOTS.some((c) => c.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;

      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      if (sortBy === 'cost_asc') return a.estCostUSD - b.estCostUSD;
      if (sortBy === 'cost_desc') return b.estCostUSD - a.estCostUSD;
      return a.name.localeCompare(b.name);
    });
  }, [search, selectedCategory, sortBy]);

  const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

  const getDifficultyBadge = (diff: OpenMachine['difficulty']) => {
    if (diff === 'Beginner') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (diff === 'Intermediate') return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  };

  return (
    <div className="space-y-6 not-content font-sans">
      {/* Search and Filter Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-emerald-400" />
              Open-Hardware Machine Registry
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Built from accessible COTS parts. Operable via <strong>Manual Levers/Valves</strong>, <strong>Physical Buttons/Servos</strong>, or <strong>Autonomous AI</strong>.
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search parts, controls, uses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Category Pills & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="cost_asc">Build Cost (Low to High)</option>
              <option value="cost_desc">Build Cost (High to Low)</option>
              <option value="name">Machine Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Machine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMachines.map((machine) => {
          const isControlsOpen = expandedControlId === machine.id;

          return (
            <div
              key={machine.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between shadow-md transition-all hover:shadow-emerald-950/20"
            >
              <div>
                {/* Header Badges */}
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                    {machine.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${getDifficultyBadge(machine.difficulty)}`}>
                      {machine.difficulty}
                    </span>
                    <span className="text-xs font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 flex items-center">
                      <DollarSign className="w-3 h-3 text-emerald-400 -mr-0.5" />
                      ~{machine.estCostUSD}
                    </span>
                  </div>
                </div>

                {/* Title & Tagline */}
                <h4 className="text-base font-bold text-slate-100 hover:text-emerald-300 transition-colors">
                  <a href={`${baseUrl}/hardware/${machine.docSlug}`}>
                    {machine.name}
                  </a>
                </h4>
                <p className="text-xs text-slate-400 mt-1 mb-3">
                  {machine.tagline}
                </p>

                {/* Standalone Use Case Card */}
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 text-xs mb-3 space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                    <span>🏡 Standalone Homestead & Off-Grid Use</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {machine.standaloneUseCase}
                  </p>
                </div>

                {/* Tri-Modal Controls Collapsible */}
                <div className="bg-slate-950/60 border border-slate-800/90 rounded-lg p-2.5 mb-3">
                  <button
                    onClick={() => setExpandedControlId(isControlsOpen ? null : machine.id)}
                    className="w-full flex justify-between items-center text-xs font-semibold text-slate-300 hover:text-emerald-300 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs">🕹️</span>
                      <span>Tri-Modal Controls (Manual / Buttons / AI)</span>
                    </span>
                    {isControlsOpen ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  {isControlsOpen && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-2 text-[11px]">
                      <div className="bg-amber-950/20 border border-amber-900/30 rounded p-2 text-amber-200">
                        <strong className="text-amber-300 block mb-0.5">✋ Tier 1: 100% Manual (Zero Electricity)</strong>
                        <p className="text-slate-300 text-[10.5px] leading-relaxed">{machine.controls.manual}</p>
                      </div>

                      <div className="bg-sky-950/20 border border-sky-900/30 rounded p-2 text-sky-200">
                        <strong className="text-sky-300 block mb-0.5">🔘 Tier 2: Buttons & Dials (No Code)</strong>
                        <p className="text-slate-300 text-[10.5px] leading-relaxed">{machine.controls.buttons}</p>
                      </div>

                      <div className="bg-purple-950/20 border border-purple-900/30 rounded p-2 text-purple-200">
                        <strong className="text-purple-300 block mb-0.5">🤖 Tier 3: Autonomous AI & Sensor Loop</strong>
                        <p className="text-slate-300 text-[10.5px] leading-relaxed">{machine.controls.ai}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Master Biosphere Role */}
                <div className="text-[11px] text-slate-400 mb-3">
                  <strong className="text-slate-300">Biosphere Interlock: </strong>
                  {machine.biosphereRole}
                </div>

                {/* COTS Parts Pills */}
                <div className="mb-4">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1.5">
                    Core COTS / Standard Parts
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {machine.primaryCOTS.map((part, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-800/90 text-slate-300 border border-slate-700/60 px-2 py-0.5 rounded"
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Link Button */}
              <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                <span className="text-slate-500 text-[11px]">COTS BOM & Assembly Guide</span>
                <a
                  href={`${baseUrl}/hardware/${machine.docSlug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
                >
                  <span>Full Open-Hardware Spec</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
