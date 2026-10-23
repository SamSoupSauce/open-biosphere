#!/usr/bin/env python3
"""
biosphere-ops/scripts/validate_candidates.py
Strict automated auditing validator for candidate crop JSON contracts.
Implements the candidate data contract auditing pipeline specified in Section 4 of the architecture blueprint.
"""

import sys
import os
import json
from pathlib import Path

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "schemas" / "crop-candidate.json"

VALID_CATEGORIES = {
    "High-Density Caloric/Protein",
    "Micro-Dosed Micronutrient",
    "Drone-Autonomous",
    "Negative-Control Anchor"
}

VALID_AGENT_TYPES = {
    "Aerial Spotter",
    "Branch Crawler",
    "Ground Rover",
    "Fluidic Skimmer",
    "Static Gantry"
}

VALID_CHEMICAL_CLASSES = {
    "Glucosinolate / Isothiocyanate",
    "Flavonoid / Polyphenol",
    "Carotenoid",
    "Steroidal Lactone / Withanolide",
    "Alkaloid",
    "Terpenoid / Saponin",
    "Polysaccharide / Soluble Mucilage",
    "Organic Acid / Chelate",
    "Phytosterol"
}

def validate_crop_data(data, filepath="<memory>"):
    errors = []
    
    # Required top-level keys
    required_top = [
        "taxon", "common_name", "ml_score", "category",
        "drone_interaction", "exhaustive_nutritional_profile_per_100g",
        "exhaustive_medicinal_and_bioactive_compounds", "cycle_parameters",
        "penalties_and_risks", "human_culinary_use"
    ]
    for key in required_top:
        if key not in data:
            errors.append(f"Missing required top-level field: '{key}'")
            
    if errors:
        return errors

    # taxon & common_name
    if not isinstance(data["taxon"], str) or not data["taxon"].strip():
        errors.append("Field 'taxon' must be a non-empty string.")
    if not isinstance(data["common_name"], str) or not data["common_name"].strip():
        errors.append("Field 'common_name' must be a non-empty string.")

    # ml_score (-1.0 to 10.0)
    score = data["ml_score"]
    if not isinstance(score, (int, float)) or score < -1.0 or score > 10.0:
        errors.append(f"Field 'ml_score' must be a float between -1.0 and 10.0. Got: {score}")

    # category enum
    if data["category"] not in VALID_CATEGORIES:
        errors.append(f"Field 'category' must be one of {sorted(VALID_CATEGORIES)}. Got: {data['category']}")

    # drone_interaction
    di = data.get("drone_interaction", {})
    if not isinstance(di, dict):
        errors.append("Field 'drone_interaction' must be an object.")
    else:
        for di_key in ["agent_type", "vision_modality", "harvest_tool"]:
            if di_key not in di:
                errors.append(f"Missing field in drone_interaction: '{di_key}'")
        if di.get("agent_type") not in VALID_AGENT_TYPES:
            errors.append(f"drone_interaction.agent_type must be one of {sorted(VALID_AGENT_TYPES)}. Got: {di.get('agent_type')}")

    # nutrition profile
    nutr = data.get("exhaustive_nutritional_profile_per_100g", {})
    if not isinstance(nutr, dict):
        errors.append("Field 'exhaustive_nutritional_profile_per_100g' must be an object.")
    else:
        required_nutr_sub = [
            "calories_kcal", "macronutrients_g", "essential_amino_acids_mg",
            "vitamins", "macrominerals_and_salts_mg", "microminerals_and_trace_elements"
        ]
        for n_sub in required_nutr_sub:
            if n_sub not in nutr:
                errors.append(f"Missing section in nutrition profile: '{n_sub}'")

    # bioactive compounds
    bioactives = data.get("exhaustive_medicinal_and_bioactive_compounds", [])
    if not isinstance(bioactives, list):
        errors.append("Field 'exhaustive_medicinal_and_bioactive_compounds' must be a list.")
    else:
        for i, cmp in enumerate(bioactives):
            for c_key in ["compound_name", "chemical_class", "bioactive_mechanisms", "human_therapeutic_efficacy"]:
                if c_key not in cmp:
                    errors.append(f"Bioactive compound #{i+1} missing field '{c_key}'")
            if cmp.get("chemical_class") not in VALID_CHEMICAL_CLASSES:
                errors.append(f"Bioactive compound #{i+1} chemical_class '{cmp.get('chemical_class')}' not in {sorted(VALID_CHEMICAL_CLASSES)}")

    # cycle_parameters
    cycle = data.get("cycle_parameters", {})
    if not isinstance(cycle, dict):
        errors.append("Field 'cycle_parameters' must be an object.")
    else:
        for c_key in ["turnaround_days", "par_light_range", "ec_target", "ph_target", "temp_range_c"]:
            if c_key not in cycle:
                errors.append(f"Missing field in cycle_parameters: '{c_key}'")

    return errors

def audit_directory(dir_path):
    p = Path(dir_path)
    if not p.exists():
        print(f"Directory {dir_path} does not exist.")
        return 0, 0
    
    total = 0
    passed = 0
    print(f"Auditing JSON files in {dir_path} ...")
    for json_file in p.rglob("*.json"):
        if "schema" in json_file.name:
            continue
        total += 1
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                content = json.load(f)
            errs = validate_crop_data(content, str(json_file))
            if errs:
                print(f"❌ FAIL: {json_file.name}")
                for e in errs:
                    print(f"   - {e}")
            else:
                print(f"✅ PASS: {json_file.name} (Taxon: {content.get('taxon')}, Score: {content.get('ml_score')})")
                passed += 1
        except Exception as ex:
            print(f"❌ ERROR: {json_file.name}: {ex}")
            
    print(f"\nAudit complete: {passed}/{total} passed.")
    return total, passed

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else str(Path(__file__).resolve().parent.parent / "tickets")
    tot, pas = audit_directory(target)
    sys.exit(0 if tot == pas else 1)
