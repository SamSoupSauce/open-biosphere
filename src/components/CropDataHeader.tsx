import React from 'react';
import { CROPS_DATA } from '../data/cropsIndex';
import { Bot, Activity, Droplets, Sun, AlertTriangle } from 'lucide-react';

interface Props {
  slug: string;
}

export default function CropDataHeader({ slug }: Props) {
  const crop = CROPS_DATA.find((c) => c.slug === slug);
  if (!crop) return null;

  const nutr = crop.exhaustive_nutritional_profile_per_100g;
  const macro = nutr.macronutrients_g;

  const getScoreBadge = (score: number) => {
    if (score >= 9.0) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (score >= 7.5) return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
    if (score >= 6.0) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 my-6 shadow-xl font-sans not-content">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
              {crop.category}
            </span>
            <span className="text-xs text-slate-400 font-mono italic">
              {crop.taxon}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">{crop.common_name}</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">ML Suitability</div>
            <div className="text-xs text-slate-500">-1.0 to 10.0 scale</div>
          </div>
          <div className={`px-3 py-1.5 rounded-lg border text-base font-bold ${getScoreBadge(crop.ml_score)}`}>
            {crop.ml_score.toFixed(1)} / 10.0
          </div>
        </div>
      </div>

      {/* Grid of Key Specifications */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4 border-b border-slate-800 text-xs">
        <div>
          <span className="text-slate-400 text-[10px] uppercase block mb-0.5">Turnaround Cycle</span>
          <div className="font-semibold text-slate-200 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            {crop.cycle_parameters.turnaround_days} Days
          </div>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] uppercase block mb-0.5">Robotics Interface</span>
          <div className="font-semibold text-slate-200 flex items-center gap-1">
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            {crop.drone_interaction.agent_type}
          </div>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] uppercase block mb-0.5">Water EC & pH</span>
          <div className="font-semibold text-slate-200 flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5 text-teal-400" />
            {crop.cycle_parameters.ec_target} mS/cm | pH {crop.cycle_parameters.ph_target}
          </div>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] uppercase block mb-0.5">PAR & Lighting</span>
          <div className="font-semibold text-slate-200 flex items-center gap-1">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            {crop.cycle_parameters.par_light_range}
          </div>
        </div>
      </div>

      {/* Nutrition Macronutrients breakdown bar */}
      <div className="py-4 border-b border-slate-800">
        <div className="flex justify-between items-center text-xs mb-2">
          <span className="font-medium text-slate-300">Macronutrients (per 100g) • {nutr.calories_kcal} kcal</span>
          <span className="text-slate-400 text-[11px]">ALA Omega-3: <strong className="text-emerald-400">{macro.ala_omega3_g}g</strong></span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-slate-800/80 p-2 rounded border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase">Protein</div>
            <div className="font-bold text-slate-100">{macro.protein_g}g</div>
          </div>
          <div className="bg-slate-800/80 p-2 rounded border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase">Carbohydrates</div>
            <div className="font-bold text-slate-100">{macro.carbohydrate_g}g</div>
          </div>
          <div className="bg-slate-800/80 p-2 rounded border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase">Fiber</div>
            <div className="font-bold text-slate-100">{macro.fiber_g}g</div>
          </div>
          <div className="bg-slate-800/80 p-2 rounded border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase">Total Lipids</div>
            <div className="font-bold text-slate-100">{macro.fat_total_g}g</div>
          </div>
        </div>
      </div>

      {/* Bioactives & Kinematics */}
      <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-slate-400 font-semibold block mb-1 text-[11px] uppercase tracking-wider">
            Key Bioactive Compounds
          </span>
          <div className="space-y-1.5">
            {crop.exhaustive_medicinal_and_bioactive_compounds.map((comp, idx) => (
              <div key={idx} className="bg-purple-950/20 border border-purple-900/30 rounded p-2 text-purple-200">
                <div className="flex justify-between font-semibold">
                  <span>{comp.compound_name}</span>
                  {comp.concentration_mg_per_100g_dw && (
                    <span className="text-purple-400 font-mono text-[10px]">{comp.concentration_mg_per_100g_dw} mg/100g dw</span>
                  )}
                </div>
                <p className="text-[11px] text-purple-300/80 mt-0.5">{comp.bioactive_mechanisms}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <span className="text-slate-400 font-semibold block mb-1 text-[11px] uppercase tracking-wider">
            Robotics Kinematics & Harvesting Tool
          </span>
          <div className="bg-slate-950/70 border border-slate-800 rounded p-2.5 text-slate-300 space-y-1.5 mb-2">
            <div>
              <span className="text-slate-400">End-Effector:</span> <strong className="text-slate-200">{crop.drone_interaction.harvest_tool}</strong>
            </div>
            <div>
              <span className="text-slate-400">Perception Modality:</span> <strong className="text-slate-200">{crop.drone_interaction.vision_modality}</strong>
            </div>
          </div>

          {crop.penalties_and_risks.length > 0 && (
            <div>
              <span className="text-rose-400 font-semibold flex items-center gap-1 mb-1 text-[11px] uppercase tracking-wider">
                <AlertTriangle className="w-3 h-3" />
                Audited Risks & Constraints
              </span>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-400 text-[11px]">
                {crop.penalties_and_risks.map((risk, idx) => (
                  <li key={idx}>{risk}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
