import React, { useState, useMemo } from 'react';
import { CROPS_DATA, type BiosphereCrop } from '../data/cropsIndex';
import { Search, Filter, ArrowUpDown, Bot, Sprout, Activity, Zap, ExternalLink } from 'lucide-react';

export default function CropMatrix() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedAgent, setSelectedAgent] = useState('ALL');
  const [sortBy, setSortBy] = useState<'ml_score' | 'turnaround' | 'protein' | 'calories'>('ml_score');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const categories = ['ALL', 'High-Density Caloric/Protein', 'Micro-Dosed Micronutrient', 'Drone-Autonomous', 'Negative-Control Anchor'];
  const agentTypes = ['ALL', 'Fluidic Skimmer', 'Static Gantry', 'Ground Rover', 'Aerial Spotter', 'Branch Crawler'];

  const filteredCrops = useMemo(() => {
    return CROPS_DATA.filter((crop) => {
      const matchesSearch =
        crop.common_name.toLowerCase().includes(search.toLowerCase()) ||
        crop.taxon.toLowerCase().includes(search.toLowerCase()) ||
        crop.human_culinary_use.toLowerCase().includes(search.toLowerCase()) ||
        crop.exhaustive_medicinal_and_bioactive_compounds.some((c) =>
          c.compound_name.toLowerCase().includes(search.toLowerCase())
        );

      const matchesCategory = selectedCategory === 'ALL' || crop.category === selectedCategory;
      const matchesAgent = selectedAgent === 'ALL' || crop.drone_interaction.agent_type === selectedAgent;

      return matchesSearch && matchesCategory && matchesAgent;
    }).sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortBy === 'ml_score') {
        valA = a.ml_score;
        valB = b.ml_score;
      } else if (sortBy === 'turnaround') {
        valA = a.cycle_parameters.turnaround_days;
        valB = b.cycle_parameters.turnaround_days;
      } else if (sortBy === 'protein') {
        valA = a.exhaustive_nutritional_profile_per_100g.macronutrients_g.protein_g;
        valB = b.exhaustive_nutritional_profile_per_100g.macronutrients_g.protein_g;
      } else if (sortBy === 'calories') {
        valA = a.exhaustive_nutritional_profile_per_100g.calories_kcal;
        valB = b.exhaustive_nutritional_profile_per_100g.calories_kcal;
      }
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });
  }, [search, selectedCategory, selectedAgent, sortBy, sortOrder]);

  const getScoreBadge = (score: number) => {
    if (score >= 9.0) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (score >= 7.5) return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
    if (score >= 6.0) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  };

  return (
    <div className="w-full my-6 font-sans">
      {/* Top Controls */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl shadow-lg mb-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search crops, taxa, bioactives..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ml_score">ML Score</option>
                <option value="turnaround">Turnaround (Days)</option>
                <option value="protein">Protein (g/100g)</option>
                <option value="calories">Calories (kcal)</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="p-1.5 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 text-slate-200 text-xs"
                title="Toggle sort direction"
              >
                {sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block mb-1 font-medium">Category:</span>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-slate-400 block mb-1 font-medium">Robotics Agent:</span>
            <div className="flex flex-wrap gap-1.5">
              {agentTypes.map((agent) => (
                <button
                  key={agent}
                  onClick={() => setSelectedAgent(agent)}
                  className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors ${
                    selectedAgent === agent
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  {agent}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Counter */}
      <div className="flex justify-between items-center mb-3 text-xs text-slate-400">
        <div>
          Showing <span className="text-emerald-400 font-semibold">{filteredCrops.length}</span> of {CROPS_DATA.length} audited candidates
        </div>
        <div className="flex gap-4">
          <span>Avg ML Score: <strong className="text-slate-200">{(CROPS_DATA.reduce((acc, c) => acc + c.ml_score, 0) / CROPS_DATA.length).toFixed(1)}</strong></span>
          <span>Max Protein: <strong className="text-slate-200">45.0% dw</strong></span>
        </div>
      </div>

      {/* Grid of Crop Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCrops.map((crop) => {
          const isExpanded = expandedSlug === crop.slug;
          const nutr = crop.exhaustive_nutritional_profile_per_100g;

          return (
            <div
              key={crop.slug}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all hover:shadow-emerald-950/20 hover:shadow-xl"
            >
              <div>
                {/* Header */}
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-100 text-base leading-snug">
                      {crop.common_name}
                    </h3>
                    <p className="text-xs text-slate-400 italic">{crop.taxon}</p>
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-lg border text-xs font-bold shrink-0 ${getScoreBadge(
                      crop.ml_score
                    )}`}
                    title="ML Suitability Score (-1.0 to 10.0)"
                  >
                    {crop.ml_score.toFixed(1)}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 my-2.5">
                  <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded border border-slate-700">
                    {crop.category}
                  </span>
                  <span className="bg-emerald-950/40 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-800/40 flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    {crop.drone_interaction.agent_type}
                  </span>
                  <span className="bg-cyan-950/40 text-cyan-400 text-[10px] px-2 py-0.5 rounded border border-cyan-800/40 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {crop.cycle_parameters.turnaround_days}d cycle
                  </span>
                </div>

                {/* Macro metrics summary */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/70 text-center my-2 text-xs">
                  <div>
                    <div className="text-slate-500 text-[10px] uppercase">Protein</div>
                    <div className="text-slate-200 font-semibold">{nutr.macronutrients_g.protein_g}g</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px] uppercase">Calories</div>
                    <div className="text-slate-200 font-semibold">{nutr.calories_kcal} kcal</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px] uppercase">ALA Omega3</div>
                    <div className="text-slate-200 font-semibold">{nutr.macronutrients_g.ala_omega3_g}g</div>
                  </div>
                </div>

                {/* Bioactives preview */}
                <div className="my-2">
                  <div className="text-[11px] text-slate-400 font-medium mb-1">Key Bioactives:</div>
                  <div className="flex flex-wrap gap-1">
                    {crop.exhaustive_medicinal_and_bioactive_compounds.map((bio, idx) => (
                      <span
                        key={idx}
                        className="bg-purple-950/30 text-purple-300 border border-purple-800/30 text-[10px] px-1.5 py-0.5 rounded"
                      >
                        {bio.compound_name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Expandable details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 space-y-2 animate-fadeIn">
                    <div>
                      <strong className="text-slate-400">Harvest Tool:</strong>{' '}
                      <span className="text-slate-200">{crop.drone_interaction.harvest_tool}</span>
                    </div>
                    <div>
                      <strong className="text-slate-400">Vision Modality:</strong>{' '}
                      <span className="text-slate-200">{crop.drone_interaction.vision_modality}</span>
                    </div>
                    <div>
                      <strong className="text-slate-400">Environmental Setpoints:</strong>{' '}
                      <span className="text-slate-200">
                        EC {crop.cycle_parameters.ec_target} mS/cm | pH {crop.cycle_parameters.ph_target} | {crop.cycle_parameters.par_light_range}
                      </span>
                    </div>
                    <div>
                      <strong className="text-slate-400">Culinary Use:</strong>{' '}
                      <p className="text-slate-300 text-[11px] mt-0.5">{crop.human_culinary_use}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => setExpandedSlug(isExpanded ? null : crop.slug)}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {isExpanded ? 'Hide Specs ▲' : 'View Specs ▼'}
                </button>
                <a
                  href={`/crops/${crop.slug}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
                >
                  <span>Full Guide</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
