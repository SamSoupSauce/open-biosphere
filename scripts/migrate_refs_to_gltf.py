#!/usr/bin/env python3
"""
scripts/migrate_refs_to_gltf.py
Migrates all references from .3ds to .gltf across:
- src/data/parts.json
- src/content/docs/**/*.mdx
- src/content/docs/**/*.md
Updates download links, descriptions, and modelUrl attributes.
"""

import os
import glob
import re

BASE_DIR = '/mnt/c/Users/samue/Projects/open-biosphere'

def migrate_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. Update model_asset_url or modelUrl extensions
    content = content.replace('.3ds', '.gltf')
    content = content.replace('.3DS', '.gltf')

    # 2. Update download link labels and formats
    content = content.replace('[Download .3DS]', '[Download .glTF]')
    content = content.replace('[Download .3ds]', '[Download .glTF]')
    content = content.replace('(Autodesk 3DS Binary)', '(glTF 2.0 Standard)')
    content = content.replace('(Autodesk 3DS binary)', '(glTF 2.0 Standard)')
    content = content.replace('Autodesk 3DS format', 'glTF 2.0 format')
    content = content.replace('Autodesk 3DS model', 'glTF 2.0 model')
    content = content.replace('Autodesk 3DS binary', 'glTF 2.0 format')

    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    target_files = [
        os.path.join(BASE_DIR, 'src', 'data', 'parts.json'),
    ]
    target_files.extend(glob.glob(os.path.join(BASE_DIR, 'src', 'content', 'docs', '**', '*.mdx'), recursive=True))
    target_files.extend(glob.glob(os.path.join(BASE_DIR, 'src', 'content', 'docs', '**', '*.md'), recursive=True))

    migrated = 0
    for p in target_files:
        if migrate_file(p):
            migrated += 1

    print(f"Migrated {migrated}/{len(target_files)} files from .3ds to .gltf references.")

if __name__ == '__main__':
    main()
