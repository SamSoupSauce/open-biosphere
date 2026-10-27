import React, { useState } from 'react';
import { GitPullRequest, User, CheckCircle2, Clock, FileText } from 'lucide-react';

interface RFCItem {
  id: string;
  title: string;
  author: string;
  targetType: 'Crop' | 'Hardware' | 'Zone' | 'Protocol';
  status: 'Draft' | 'Under Review' | 'Accepted' | 'Implemented';
  date: string;
  summary: string;
  prLink?: string;
  docSlug?: string;
}

const RFC_LIST: RFCItem[] = [
  {
    id: 'RFC-0001',
    title: 'Autonomous Closed Biosphere Baseline Specification',
    author: 'Biosphere Core Team',
    targetType: 'Protocol',
    status: 'Implemented',
    date: '2026-10-15',
    summary: 'Foundational architectural envelope defining 6,000-gal pool footprint, spatial datum (0,0,0), and multi-agent robotics routing.',
    docSlug: '/rfcs/rfc-0001-biosphere-baseline',
  },
  {
    id: 'RFC-0002',
    title: 'Mantis Branch-Crawler Kinematics & Silicone Roller End-Effector',
    author: 'Robotics Working Group',
    targetType: 'Hardware',
    status: 'Accepted',
    date: '2026-10-18',
    summary: 'Dual-actuated soft silicone pinch rollers engineered to navigate rigid espalier limbs without slippage for mulberry berry harvesting.',
    docSlug: '/rfcs/rfc-0002-mantis-crawler-kinematics',
  },
  {
    id: 'RFC-0003',
    title: 'TPS Aeroponic Mini-Tuber Root-Zone Light Shields',
    author: 'Agronomy Guild',
    targetType: 'Crop',
    status: 'Under Review',
    date: '2026-10-21',
    summary: 'Sealed pneumatic root misting chamber baffles to suppress light-induced solanine/chlorophyll synthesis during selective tuber picking.',
    docSlug: '/rfcs/rfc-0003-tps-potato-root-shields',
  },
  {
    id: 'RFC-0004',
    title: 'Controller-Node-Tool (CNT) Hierarchical Edge Architecture',
    author: 'Architecture Working Group',
    targetType: 'Hardware',
    status: 'Implemented',
    date: '2026-10-24',
    summary: 'Hierarchical 3-tier edge standard replacing monolithic CAN/SBC stacks with Raspberry Pi 5 Central Controller, ESP32-S3 Machine Nodes, and ESP32-C3 Tools with 250ms deadman watchdogs.',
    docSlug: '/rfcs/rfc-0004-controller-node-tool',
  },
  {
    id: 'RFC-0005',
    title: 'Physical Hardware Interlocks & Minimalist BLE Virtual Interface Standard',
    author: 'Architecture & System Safety Working Group',
    targetType: 'Hardware',
    status: 'Implemented',
    date: '2026-10-24',
    summary: 'Strict Two-Control Physical Standard (Inline Master DC Power Cut & SD Factory Restore Tactile Button) with ephemeral Flutter BLE Virtual Panel interface, banning physical button panels and dials.',
    docSlug: '/rfcs/rfc-0005-hardware-interlocks-ble-virtual-panel',
  },
  {
    id: 'RFC-0006',
    title: 'Agnostic Controller Runtime & Host Specification',
    author: 'Controller Systems Architecture Team',
    targetType: 'Software',
    status: 'Implemented',
    date: '2026-10-24',
    summary: 'Hardware-agnostic portable runtime (biosphere-core) for any Linux/macOS host with POTFRM-<CLUSTER_ID> AP, 192.168.42.0/24 subnet, and local llama-cpp-python GGUF inference.',
    docSlug: '/rfcs/rfc-0006-agnostic-controller-runtime',
  },
  {
    id: 'RFC-0007',
    title: 'Multi-Stage Machine Sub-Page Architecture & Assembly Template',
    author: 'Documentation Systems Architecture Team',
    targetType: 'Documentation',
    status: 'Implemented',
    date: '2026-10-24',
    summary: 'Decomposition of monolithic machine catalog specifications into modular index and stage-0, stage-1, stage-2 sub-pages with isolated BOMs and dedicated vector SVG blueprints.',
    docSlug: '/rfcs/rfc-0007-multi-stage-sub-page-architecture',
  },
  {
    id: 'RFC-0008',
    title: 'Global Part Registry & Shared Bill of Materials Schema',
    author: 'Physical Systems & Supply Chain Architecture Team',
    targetType: 'Hardware',
    status: 'Implemented',
    date: '2026-10-24',
    summary: 'Centralized canonical part registry (parts.json) with discrete CAD assets, procurement links, and cross-machine BOM linking.',
    docSlug: '/rfcs/rfc-0008-global-part-registry-bom-schema',
  },
  {
    id: 'RFC-0009',
    title: 'Universal Helical Shutter Solar Roof & Passive Thermal Collector Standard',
    author: 'Optics & Thermal Systems Engineering Team',
    targetType: 'Hardware',
    status: 'Implemented',
    date: '2026-10-24',
    summary: 'Decoupled solar PAR collection assembly combining keyed static exterior mirror spokes, concentric rotary helical pipe shutter, and zero-plastic optical path.',
    docSlug: '/rfcs/rfc-0009-helical-shutter-solar-roof',
  },
  {
    id: 'RFC-0010',
    title: 'Stepwise Reverse-Deconstructed Blueprint Standard',
    author: 'Documentation & Visual Systems Engineering Team',
    targetType: 'Documentation',
    status: 'Implemented',
    date: '2026-10-24',
    summary: 'Mandates 1:1 blueprint-to-step pairing across all machine stage assembly procedures with persistent viewing perspective, spatial datum anchoring, and layer-by-layer reverse inspection.',
    docSlug: '/rfcs/rfc-0010-stepwise-reverse-deconstructed-blueprints',
  },
  {
    id: 'RFC-0011',
    title: 'Universal Vector SVG Blueprint Standard & Code Block Elimination',
    author: 'Documentation Systems & Physical CAD Engineering Team',
    targetType: 'Documentation',
    status: 'Implemented',
    date: '2026-10-24',
    summary: 'Eliminates all raw ASCII blueprint diagrams from markdown code blocks in favor of high-contrast, scalable, responsive vector SVG schematics and elevations.',
    docSlug: '/rfcs/rfc-0011-vector-blueprint-standard',
  },
  {
    id: 'RFC-0012',
    title: 'Concrete Custom-Fabricated Part Contracts & Subpage Architecture',
    author: 'Autonomous Hardware Systems & CAD Engineering Team',
    targetType: 'Hardware',
    status: 'Implemented',
    date: '2026-10-24',
    summary: 'Establishes strict requirements eliminating ambiguous part placeholders and defines dedicated subpages under parts/<slug>/ with canonical 3D assets, technical summaries, and interactive WebGL viewers.',
    docSlug: '/rfcs/rfc-0012-custom-fabricated-part-contracts',
  },
  {
    id: 'RFC-0013',
    title: 'Closed-Loop Bio-Pitch & Ceramic Aggregate (BCA) Packaging Engine',
    author: 'Materials & Processing Hardware Working Group',
    targetType: 'Hardware',
    status: 'Implemented',
    date: '2026-10-25',
    summary: 'Zero-plastic, infinitely recyclable rigid packaging architecture combining coarse ceramic grog with biomass pyrolysis heavy pitch binder cured at 140°C–220°C with thermal break recycling.',
    docSlug: '/rfcs/rfc-0013-bca-packaging-engine',
  },
  {
    id: 'RFC-0014',
    title: 'Standardized GLTF Pipeline, Hierarchical Sub-Models & Web Viewer Navigation',
    author: 'Documentation Systems & CAD Engineering Team',
    targetType: 'Infrastructure',
    status: 'Implemented',
    date: '2026-10-25',
    summary: 'glTF 2.0/GLB asset pipeline, hierarchical scene graph assembly with declarative extras.ref sub-model linking, and discrete HUD zoom navigation controls.',
    docSlug: '/rfcs/rfc-0014-interactive-3d-composite-assembly-standard',
  },
  {
    id: 'RFC-0016',
    title: 'Comprehensive 3D Model Completeness & Explicit Spatial HUD Controls',
    author: 'Sam',
    targetType: 'Infrastructure',
    status: 'Implemented',
    date: '2026-10-26',
    summary: 'Eliminates canvas wheel zoom hijacking, implements discrete high-contrast HUD for zoom, yaw/pitch rotation, and 3-axis translation, and mandates 100% real glTF geometry across all BOM parts.',
    docSlug: '/rfcs/rfc-0016-3d-model-completeness-spatial-hud',
  },
  {
    id: 'RFC-0017',
    title: 'Procedural Mesh Integrity, Normal Rectification & CSG Verification Pipeline',
    author: 'Sam',
    targetType: 'Infrastructure',
    status: 'Implemented',
    date: '2026-10-26',
    summary: 'Establishes procedural CAD mesh integrity, outward normal rectification, watertight 2-manifold verification, wall thickness offset (t >= 2.5mm), and automated headless CI model testing.',
    docSlug: '/rfcs/rfc-0017-procedural-mesh-integrity-normal-rectification',
  },
  {
    id: 'RFC-0018',
    title: 'Multi-Part Composite Assemblies, 3D-Printable Subparts & Universal Normal Orientation',
    author: 'Sam',
    targetType: 'Infrastructure',
    status: 'Implemented',
    date: '2026-10-26',
    summary: 'Establishes composite CAD assembly architecture with per-subpart color coding, standalone watertight 2-manifold printable subpart models, bed-grounded batch platers, and universal outward normal reconciliation.',
    docSlug: '/rfcs/rfc-0018-multi-part-composite-cad-assemblies',
  },
  {
    id: 'RFC-0019',
    title: 'Hardware Hierarchy Simplification & Stage De-duplication',
    author: 'Documentation Systems & Hardware Working Group',
    targetType: 'Hardware',
    status: 'Implemented',
    date: '2026-10-26',
    summary: 'Eliminates redundant and artificial stage subpages across autonomous drones, gantry tool nodes, and environmental peripherals in favor of single-stage direct pages with unified BOMs and 301 redirects.',
    docSlug: '/rfcs/rfc-0019-hardware-hierarchy-simplification',
  },
];

export default function RfcKanban() {
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const columns: Array<'Draft' | 'Under Review' | 'Accepted' | 'Implemented'> = [
    'Draft',
    'Under Review',
    'Accepted',
    'Implemented',
  ];

  const filteredRFCs = RFC_LIST.filter(
    (rfc) => selectedType === 'ALL' || rfc.targetType === selectedType
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Crop':
        return 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40';
      case 'Hardware':
        return 'bg-blue-950/40 text-blue-400 border-blue-800/40';
      case 'Zone':
        return 'bg-amber-950/40 text-amber-400 border-amber-800/40';
      case 'Protocol':
        return 'bg-purple-950/40 text-purple-400 border-purple-800/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Implemented':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'Accepted':
        return <CheckCircle2 className="w-4 h-4 text-teal-400" />;
      case 'Under Review':
        return <Clock className="w-4 h-4 text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="w-full my-6 font-sans">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl mb-6 text-xs">
        <div className="flex items-center gap-2">
          <GitPullRequest className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">Open RFC Specification Board</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Target Type:</span>
          {['ALL', 'Crop', 'Hardware', 'Zone', 'Protocol'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-2 py-1 rounded font-medium border text-[11px] transition-colors ${
                selectedType === type
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* 4-Column Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colItems = filteredRFCs.filter((item) => item.status === col);

          return (
            <div key={col} className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 flex flex-col">
              <div className="flex justify-between items-center pb-2.5 mb-3 border-b border-slate-800 text-xs font-semibold text-slate-200">
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(col)}
                  <span>{col}</span>
                </div>
                <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-[10px]">
                  {colItems.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {colItems.map((rfc) => (
                  <div
                    key={rfc.id}
                    className="bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-lg p-3 text-xs shadow transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-mono font-bold text-slate-100">{rfc.id}</span>
                        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${getTypeColor(rfc.targetType)}`}>
                          {rfc.targetType}
                        </span>
                      </div>

                      <h4 className="font-semibold text-slate-100 text-xs leading-snug mb-1">
                        {rfc.title}
                      </h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed mb-2">
                        {rfc.summary}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/70 flex justify-between items-center text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {rfc.author}
                      </span>
                      {rfc.docSlug && (
                        <a
                          href={rfc.docSlug.startsWith('/') ? `${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}${rfc.docSlug}` : rfc.docSlug}
                          className="text-emerald-400 hover:text-emerald-300 font-medium"
                        >
                          Read Spec →
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                {colItems.length === 0 && (
                  <div className="h-24 flex items-center justify-center text-xs text-slate-600 border border-dashed border-slate-800 rounded-lg">
                    No active proposals
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
