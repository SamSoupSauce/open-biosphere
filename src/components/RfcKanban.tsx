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
    title: 'Micro-Quadcopter Prop-Wash Resonant Pollination Protocol',
    author: 'Flight Control Team',
    targetType: 'Hardware',
    status: 'Draft',
    date: '2026-10-23',
    summary: 'Acoustic vibration calibration (180-220 Hz) for pepper flower buzz-pollination using propeller downwash velocity modulation.',
  },
  {
    id: 'RFC-0006',
    title: 'Wasabi Chiller Fluidic Loop PID Autotuning',
    author: 'Microclimate Group',
    targetType: 'Zone',
    status: 'Draft',
    date: '2026-10-23',
    summary: 'Reinforcement learning PID controller to maintain strict 10-13C water temperature and DO > 8.0 mg/L in sawa gravel troughs.',
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
