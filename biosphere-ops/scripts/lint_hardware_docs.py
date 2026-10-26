#!/usr/bin/env python3
"""
biosphere-ops/scripts/lint_hardware_docs.py
CI Linting and Invariant Verification Script for Open Biosphere documentation.
Enforces:
1. No corrupted LaTeX arrows (ightarrow or raw TeX arrows in prose).
2. Proper currency cell formatting (no truncated digits like "3.00" instead of "$93.00").
3. Chemical formulas formatted with clean Unicode (CO₂, not unescaped $CO_2$).
4. All ModelViewer modelUrl paths point to existing files on disk.
5. All part IDs referenced in stage BOMs exist in src/data/parts.json.
"""

import os
import sys
import glob
import json
import re

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def check_latex_and_unicode_corruptions():
    errors = []
    files = glob.glob(os.path.join(REPO_ROOT, 'src/content/docs/**/*.mdx'), recursive=True)
    for path in files:
        with open(path, 'rb') as fp:
            raw = fp.read()
        if b'ightarrow' in raw:
            errors.append(f"Corrupted LaTeX arrow found in {path}")
        if b'$CO_2$' in raw or b'\\$CO_2\\$' in raw:
            errors.append(f"Unescaped/raw TeX CO2 found in {path} (use CO₂)")

    return errors

def check_table_price_cells():
    errors = []
    files = glob.glob(os.path.join(REPO_ROOT, 'src/content/docs/hardware/**/*.mdx'), recursive=True)
    # Check for table cells like "| 3.00 |" or "| .00 |" or "| +35.00 |" where leading digits were stripped
    for path in files:
        with open(path, 'r', encoding='utf-8') as fp:
            for line_no, line in enumerate(fp, start=1):
                if '|' in line:
                    cells = [c.strip() for c in line.split('|')[1:-1]]
                    for cell in cells:
                        if re.match(r'^\.?\d\.00$', cell) or re.match(r'^\+\d{1,2}\.00$', cell) and not cell.startswith('+$'):
                            # Suspicious single digit currency or plus without dollar sign
                            if 'mm' not in cell and 'kg' not in cell and 'RPM' not in cell and 'PSI' not in cell:
                                errors.append(f"Suspicious truncated cost cell '{cell}' at {path}:{line_no}")
    return errors

def check_model_viewer_paths():
    errors = []
    files = glob.glob(os.path.join(REPO_ROOT, 'src/content/docs/**/*.mdx'), recursive=True)
    for path in files:
        with open(path, 'r', encoding='utf-8') as fp:
            content = fp.read()
        models = re.findall(r'modelUrl=[\x27"]([^\x27"]+)[\x27"]', content)
        for m in models:
            # Model URL is rooted at /open-biosphere/
            clean_path = m.replace('/open-biosphere/', '')
            disk_path = os.path.join(REPO_ROOT, 'public', clean_path)
            if not os.path.exists(disk_path):
                errors.append(f"Missing ModelViewer glTF asset: {disk_path} (referenced in {path})")
    return errors

def check_parts_registry_integrity():
    errors = []
    parts_json_path = os.path.join(REPO_ROOT, 'src/data/parts.json')
    if not os.path.exists(parts_json_path):
        return ["src/data/parts.json not found!"]

    with open(parts_json_path, 'r', encoding='utf-8') as fp:
        parts = json.load(f"parts_data" if False else fp)
    part_ids = {p['part_id'] for p in parts}

    # Check all part links in hardware documentation
    files = glob.glob(os.path.join(REPO_ROOT, 'src/content/docs/hardware/**/*.mdx'), recursive=True)
    for path in files:
        with open(path, 'r', encoding='utf-8') as fp:
            content = fp.read()
        p_refs = re.findall(r'PART-[A-Z0-9-]+', content)
        for pref in p_refs:
            # Skip ASM- prefixes and standard placeholders
            if pref not in part_ids:
                errors.append(f"Part ID '{pref}' referenced in {path} does not exist in parts.json")

    return list(set(errors))

def main():
    print("=" * 60)
    print("Open Biosphere Documentation & Engineering Linter")
    print("=" * 60)

    all_errors = []

    print("[1/4] Checking for corrupted LaTeX arrows and TeX syntax...")
    e1 = check_latex_and_unicode_corruptions()
    all_errors.extend(e1)
    print(f"      Found {len(e1)} errors")

    print("[2/4] Checking table price cell integrity...")
    e2 = check_table_price_cells()
    all_errors.extend(e2)
    print(f"      Found {len(e2)} errors")

    print("[3/4] Checking ModelViewer 3D asset links...")
    e3 = check_model_viewer_paths()
    all_errors.extend(e3)
    print(f"      Found {len(e3)} errors")

    print("[4/4] Checking parts registry references in hardware BOMs...")
    e4 = check_parts_registry_integrity()
    all_errors.extend(e4)
    print(f"      Found {len(e4)} errors")

    print("=" * 60)
    if all_errors:
        print(f"FAILED: {len(all_errors)} issues detected:")
        for e in all_errors[:20]:
            print(f"  - {e}")
        if len(all_errors) > 20:
            print(f"  ... and {len(all_errors) - 20} more.")
        sys.exit(1)
    else:
        print("SUCCESS: All hardware documentation and invariant checks passed!")
        sys.exit(0)

if __name__ == '__main__':
    main()
