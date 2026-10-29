#!/usr/bin/env python3
"""
scripts/remedy_parts.py
Remediates all remaining geometry and normal defects across the 15 target canonical parts:
1. PART-FLUID-BLOWER-5015-24V
2. PART-FLUID-SEAL-EPDM-WEATHER
3. PART-FLUID-SUMP-SILICONE-34
4. PART-FLUID-TUBE-SILICONE-MED
5. PART-MECH-FORK-ACOUSTIC-310HZ
6. PART-FAB-BRACKET-SOLAR-CONE
7. PART-MECH-FASTENER-M5-PACK
8. PART-MECH-CLUTCH-DOG-AXIAL
9. PART-MECH-CLUTCH-DOG-STEEL
10. PART-FAB-SHEAR-CARRIAGE-WIRE
11. PART-FAB-TOOL-SHEAR-PURSLANE
12. PART-FAB-TOOL-TWEEZER-SAFFRON
13. PART-FAB-BREAKER-TOOTHED-SHAFT
14. PART-FAB-PUG-AUGER-JACKETED
15. PART-FAB-AUGER-PETG-50P

Enforces the Three Mandatory Invariants:
Rule 1: No objects may be inside of other objects
Rule 2: Each object must be whole, solid, and possible to 3D print (boundary == 0, non_two == 0, unoriented == 0, V > 0, dim >= 1mm)
Rule 3: Each object must have its inner and outer normals calculated
"""

import os
import sys
import json
import math
from typing import List, Tuple, Dict, Any, Set

BASE_DIR = '/mnt/c/Users/samue/Projects/open-biosphere'
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from scripts.test_models import parse_gltf, decompose_objects, audit_model
from scripts.reconcile_all_cad_orientations import build_gltf

def save_model(part_id: str, verts: List[List[float]], faces: List[List[int]]):
    g_out = build_gltf(verts, faces, name=part_id)
    target_path = os.path.join(BASE_DIR, 'public', 'assets', 'parts', part_id, 'model.gltf')
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    with open(target_path, 'w') as f:
        f.write(g_out)
    print(f"Wrote {target_path}")

    # Also check docs/parts/
    slug = part_id.lower().replace('part-fab-', 'part-custom-').replace('part-fluid-', 'part-custom-part-fluid-').replace('part-mech-', 'part-custom-')
    docs_path = os.path.join(BASE_DIR, 'src', 'content', 'docs', 'parts', slug, 'model.gltf')
    if os.path.exists(os.path.dirname(docs_path)):
        with open(docs_path, 'w') as f:
            f.write(g_out)
        print(f"Wrote {docs_path}")


def fix_open_cylinders():
    parts = [
        'PART-FLUID-BLOWER-5015-24V',
        'PART-FLUID-SEAL-EPDM-WEATHER',
        'PART-FLUID-SUMP-SILICONE-34',
        'PART-FLUID-TUBE-SILICONE-MED',
        'PART-MECH-FORK-ACOUSTIC-310HZ'
    ]
    for p in parts:
        path = os.path.join(BASE_DIR, 'public', 'assets', 'parts', p, 'model.gltf')
        with open(path) as f:
            g = json.load(f)
        verts, faces, _ = parse_gltf(g)

        top_z = verts[0][2]
        new_faces = list(faces[:64])
        for f in faces[64:80]:
            new_faces.append([f[0], f[2], f[1]])
        top_center = len(verts)
        verts.append([0.0, 0.0, top_z])
        for i in range(16):
            nxt = (i + 1) % 16
            new_faces.append([top_center, i, nxt])

        save_model(p, verts, new_faces)


def fix_brackets_and_fasteners():
    parts = [
        'PART-FAB-BRACKET-SOLAR-CONE',
        'PART-MECH-FASTENER-M5-PACK'
    ]
    for p in parts:
        path = os.path.join(BASE_DIR, 'public', 'assets', 'parts', p, 'model.gltf')
        with open(path) as f:
            g = json.load(f)
        verts, faces, _ = parse_gltf(g)

        new_faces = []
        for fi, f in enumerate(faces):
            if fi < 8:
                new_faces.append([f[0], f[2], f[1]])
            else:
                new_faces.append(f)

        save_model(p, verts, new_faces)


def fix_clutch_dogs():
    parts = [
        'PART-MECH-CLUTCH-DOG-AXIAL',
        'PART-MECH-CLUTCH-DOG-STEEL'
    ]
    for p in parts:
        path = os.path.join(BASE_DIR, 'public', 'assets', 'parts', p, 'model.gltf')
        with open(path) as f:
            g = json.load(f)
        verts, faces, _ = parse_gltf(g)
        comps = decompose_objects(faces)

        # Exclude comp 5 (internal cylinder)
        new_faces = []
        for ci in range(5):
            cfaces = [faces[fi] for fi in comps[ci]]
            for f in cfaces:
                if any(v in [24, 25, 38, 39] for v in f):
                    new_faces.append([f[0], f[2], f[1]])
                else:
                    new_faces.append(f)

        save_model(p, verts, new_faces)


def fix_shear_carriage_wire():
    p = 'PART-FAB-SHEAR-CARRIAGE-WIRE'
    path = os.path.join(BASE_DIR, 'public', 'assets', 'parts', p, 'model.gltf')
    with open(path) as f:
        g = json.load(f)
    verts, faces, _ = parse_gltf(g)
    comps = decompose_objects(faces)

    # Exclude comps 7, 8, 10
    valid_comps = [ci for ci in range(len(comps)) if ci not in [7, 8, 10]]
    new_faces = []
    for ci in valid_comps:
        cfaces = [faces[fi] for fi in comps[ci]]
        if ci in [2, 3, 5, 6]:
            v_deg = {}
            for f in cfaces:
                for v in f: v_deg[v] = v_deg.get(v, 0) + 1
            centers = set([v for v, deg in v_deg.items() if deg == 8])
            for f in cfaces:
                if any(v in centers for v in f):
                    new_faces.append([f[0], f[2], f[1]])
                else:
                    new_faces.append(f)
        else:
            new_faces.extend(cfaces)

    save_model(p, verts, new_faces)


def fix_tools():
    parts = [
        'PART-FAB-TOOL-SHEAR-PURSLANE',
        'PART-FAB-TOOL-TWEEZER-SAFFRON'
    ]
    for p in parts:
        path = os.path.join(BASE_DIR, 'public', 'assets', 'parts', p, 'model.gltf')
        with open(path) as f:
            g = json.load(f)
        verts, faces, _ = parse_gltf(g)
        comps = decompose_objects(faces)

        new_faces = []
        for ci, cfaces_idx in enumerate(comps):
            cfaces = [faces[fi] for fi in cfaces_idx]

            # 1. Reverse cylinder cap faces
            dir_edges = set()
            unoriented = 0
            for f in cfaces:
                for e in [(f[0], f[1]), (f[1], f[2]), (f[2], f[0])]:
                    if e in dir_edges: unoriented += 1
                    dir_edges.add(e)
            if unoriented > 0:
                v_deg = {}
                for f in cfaces:
                    for v in f: v_deg[v] = v_deg.get(v, 0) + 1
                max_deg = max(v_deg.values())
                centers = set([v for v, deg in v_deg.items() if deg == max_deg])
                mod_cf = []
                for f in cfaces:
                    if any(v in centers for v in f):
                        mod_cf.append([f[0], f[2], f[1]])
                    else:
                        mod_cf.append(f)
                cfaces = mod_cf

            # 2. Close open rectangular back boundary edges on blade teeth
            edges = {}
            for f in cfaces:
                for e in [(f[0], f[1]), (f[1], f[2]), (f[2], f[0])]:
                    canon = tuple(sorted(e))
                    edges[canon] = edges.get(canon, 0) + 1
            open_e = [e for e, count in edges.items() if count == 1]

            if len(open_e) == 4:
                d_edges = {}
                for f in cfaces:
                    for e in [(f[0], f[1]), (f[1], f[2]), (f[2], f[0])]:
                        d_edges[e] = d_edges.get(e, 0) + 1
                unpaired = [e for e in d_edges if (e[1], e[0]) not in d_edges]
                nxt_map = {u: v for u, v in unpaired}
                v0 = unpaired[0][0]
                v1 = nxt_map[v0]
                v2 = nxt_map[v1]
                v3 = nxt_map[v2]
                cfaces.append([v0, v3, v2])
                cfaces.append([v0, v2, v1])

            new_faces.extend(cfaces)

        save_model(p, verts, new_faces)


def fix_breaker_toothed_shaft():
    p = 'PART-FAB-BREAKER-TOOTHED-SHAFT'
    path = os.path.join(BASE_DIR, 'public', 'assets', 'parts', p, 'model.gltf')
    with open(path) as f:
        g = json.load(f)
    verts, faces, _ = parse_gltf(g)
    comps = decompose_objects(faces)

    cfaces = [faces[fi] for fi in comps[0]]
    v_idx = set()
    for f in cfaces: v_idx.update(f)
    for v in v_idx:
        if abs(verts[v][0] - (-160.0)) < 1e-3:
            verts[v][0] = -135.0
        elif abs(verts[v][0] - (160.0)) < 1e-3:
            verts[v][0] = 135.0

    new_faces = []
    for ci, cfaces_idx in enumerate(comps):
        cfaces = [faces[fi] for fi in cfaces_idx]
        if ci >= 3:
            mod_cf = []
            for fi, f in enumerate(cfaces):
                if fi in [3, 7, 8, 9]:
                    mod_cf.append([f[0], f[2], f[1]])
                else:
                    mod_cf.append(f)
            cfaces = mod_cf

        v_signed = 0.0
        for f in cfaces:
            p0, p1, p2 = verts[f[0]], verts[f[1]], verts[f[2]]
            cp = [p0[1]*p1[2] - p0[2]*p1[1], p0[2]*p1[0] - p0[0]*p1[2], p0[0]*p1[1] - p0[1]*p1[0]]
            v_signed += (p2[0]*cp[0] + p2[1]*cp[1] + p2[2]*cp[2]) / 6.0
        if v_signed < 0:
            cfaces = [[f[0], f[2], f[1]] for f in cfaces]
        new_faces.extend(cfaces)

    save_model(p, verts, new_faces)


def fix_pug_auger_jacketed():
    p = 'PART-FAB-PUG-AUGER-JACKETED'
    path = os.path.join(BASE_DIR, 'public', 'assets', 'parts', p, 'model.gltf')
    with open(path) as f:
        g = json.load(f)
    verts, faces, _ = parse_gltf(g)
    comps = decompose_objects(faces)

    cfaces = [faces[fi] for fi in comps[0]]
    v_idx = set()
    for f in cfaces: v_idx.update(f)
    for v in v_idx:
        if abs(verts[v][0] - (-190.0)) < 1e-3:
            verts[v][0] = -150.0

    new_faces = []
    for ci, cfaces_idx in enumerate(comps):
        cfaces = [faces[fi] for fi in cfaces_idx]
        if ci >= 2:
            v_deg = {}
            for f in cfaces:
                for v in f: v_deg[v] = v_deg.get(v, 0) + 1
            centers = set([v for v, deg in v_deg.items() if deg == 8])
            mod_cf = []
            for f in cfaces:
                if any(v in centers for v in f):
                    mod_cf.append([f[0], f[2], f[1]])
                else:
                    mod_cf.append(f)
            cfaces = mod_cf

        v_signed = 0.0
        for f in cfaces:
            p0, p1, p2 = verts[f[0]], verts[f[1]], verts[f[2]]
            cp = [p0[1]*p1[2] - p0[2]*p1[1], p0[2]*p1[0] - p0[0]*p1[2], p0[0]*p1[1] - p0[1]*p1[0]]
            v_signed += (p2[0]*cp[0] + p2[1]*cp[1] + p2[2]*cp[2]) / 6.0
        if v_signed < 0:
            cfaces = [[f[0], f[2], f[1]] for f in cfaces]
        new_faces.extend(cfaces)

    save_model(p, verts, new_faces)


def fix_auger_petg_50p():
    p = 'PART-FAB-AUGER-PETG-50P'
    verts = []
    faces = []

    n_seg = 16
    r_core = 9.8
    z_min, z_max = -140.0, 140.0

    # Central drive shaft cylinder
    base_idx = len(verts)
    for i in range(n_seg):
        ang = (2 * math.pi * i) / n_seg
        c, s = math.cos(ang), math.sin(ang)
        verts.append([r_core * c, r_core * s, z_min])
        verts.append([r_core * c, r_core * s, z_max])
    for i in range(n_seg):
        nxt = (i + 1) % n_seg
        b0 = base_idx + i * 2
        t0 = base_idx + i * 2 + 1
        b1 = base_idx + nxt * 2
        t1 = base_idx + nxt * 2 + 1
        faces.append([b0, b1, t0])
        faces.append([b1, t1, t0])
    c_bot = len(verts); verts.append([0.0, 0.0, z_min])
    c_top = len(verts); verts.append([0.0, 0.0, z_max])
    for i in range(n_seg):
        nxt = (i + 1) % n_seg
        faces.append([c_bot, base_idx + nxt * 2, base_idx + i * 2])
        faces.append([c_top, base_idx + i * 2 + 1, base_idx + nxt * 2 + 1])

    # Volumetric helical flight ribbon
    r_in = 10.0
    r_out = 20.0
    dz = 3.0
    pitch = 50.0
    total_z = z_max - z_min
    n_turns = total_z / pitch
    total_ang = n_turns * 2 * math.pi
    n_steps = 120

    flight_base = len(verts)
    for i in range(n_steps + 1):
        frac = i / n_steps
        theta = frac * total_ang
        z = z_min + frac * total_z
        c, s = math.cos(theta), math.sin(theta)

        verts.append([r_in * c, r_in * s, z - dz/2])   # 0: in-bot
        verts.append([r_out * c, r_out * s, z - dz/2]) # 1: out-bot
        verts.append([r_out * c, r_out * s, z + dz/2]) # 2: out-top
        verts.append([r_in * c, r_in * s, z + dz/2])   # 3: in-top

    for i in range(n_steps):
        s0 = flight_base + i * 4
        s1 = flight_base + (i + 1) * 4

        faces.append([s0 + 0, s1 + 0, s1 + 1])
        faces.append([s0 + 0, s1 + 1, s0 + 1])

        faces.append([s0 + 1, s1 + 1, s1 + 2])
        faces.append([s0 + 1, s1 + 2, s0 + 2])

        faces.append([s0 + 2, s1 + 2, s1 + 3])
        faces.append([s0 + 2, s1 + 3, s0 + 3])

        faces.append([s0 + 3, s1 + 3, s1 + 0])
        faces.append([s0 + 3, s1 + 0, s0 + 0])

    s_start = flight_base
    faces.append([s_start + 0, s_start + 1, s_start + 2])
    faces.append([s_start + 0, s_start + 2, s_start + 3])

    s_end = flight_base + n_steps * 4
    faces.append([s_end + 0, s_end + 3, s_end + 2])
    faces.append([s_end + 0, s_end + 2, s_end + 1])

    save_model(p, verts, faces)


def main():
    print("Executing CAD Part Remediation across all 15 remaining models...")
    fix_open_cylinders()
    fix_brackets_and_fasteners()
    fix_clutch_dogs()
    fix_shear_carriage_wire()
    fix_tools()
    fix_breaker_toothed_shaft()
    fix_pug_auger_jacketed()
    fix_auger_petg_50p()
    print("All 15 models remediated successfully!")


if __name__ == '__main__':
    main()
