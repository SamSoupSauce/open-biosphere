import wolffia from './crops/wolffia-globosa.json';
import wasabia from './crops/wasabia-japonica.json';
import portulaca from './crops/portulaca-oleracea.json';
import solanum from './crops/solanum-tuberosum.json';
import crocus from './crops/crocus-sativus.json';
import physalis from './crops/physalis-peruviana.json';
import abelmoschus from './crops/abelmoschus-esculentus.json';
import monostroma from './crops/monostroma-nitidum.json';
import morus from './crops/morus-alba.json';
import phaseolus from './crops/phaseolus-vulgaris.json';
import capsicum from './crops/capsicum-annuum.json';
import vigna from './crops/vigna-radiata.json';

export interface BiosphereCrop {
  slug: string;
  taxon: string;
  common_name: string;
  ml_score: number;
  category: string;
  drone_interaction: {
    agent_type: string;
    vision_modality: string;
    harvest_tool: string;
  };
  exhaustive_nutritional_profile_per_100g: {
    calories_kcal: number;
    macronutrients_g: {
      protein_g: number;
      carbohydrate_g: number;
      fiber_g: number;
      fat_total_g: number;
      ala_omega3_g: number;
    };
    essential_amino_acids_mg: Record<string, number>;
    vitamins: Record<string, number>;
    macrominerals_and_salts_mg: Record<string, number>;
    microminerals_and_trace_elements: Record<string, number>;
  };
  exhaustive_medicinal_and_bioactive_compounds: Array<{
    compound_name: string;
    chemical_class: string;
    concentration_mg_per_100g_dw?: number;
    bioactive_mechanisms: string;
    human_therapeutic_efficacy: string;
    extraction_or_utilization?: string;
  }>;
  cycle_parameters: {
    turnaround_days: number;
    par_light_range: string;
    ec_target: number;
    ph_target: number;
    temp_range_c: string;
  };
  penalties_and_risks: string[];
  human_culinary_use: string;
}

export const CROPS_DATA: BiosphereCrop[] = [
  { ...wolffia, slug: 'wolffia-globosa' },
  { ...wasabia, slug: 'wasabia-japonica' },
  { ...portulaca, slug: 'portulaca-oleracea' },
  { ...solanum, slug: 'solanum-tuberosum' },
  { ...crocus, slug: 'crocus-sativus' },
  { ...physalis, slug: 'physalis-peruviana' },
  { ...abelmoschus, slug: 'abelmoschus-esculentus' },
  { ...monostroma, slug: 'monostroma-nitidum' },
  { ...morus, slug: 'morus-alba' },
  { ...phaseolus, slug: 'phaseolus-vulgaris' },
  { ...capsicum, slug: 'capsicum-annuum' },
  { ...vigna, slug: 'vigna-radiata' },
];
