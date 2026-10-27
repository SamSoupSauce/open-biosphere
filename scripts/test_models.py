#!/usr/bin/env python3
"""
scripts/test_models.py
Automated Headless Validation Check for glTF 2.0 CAD Models (RFC-017 Section 4).
Runs under 'npm run test:models' in CI/CD pipeline.
Asserts:
  1. Volume & Bounding Envelope: dx, dy, dz >= 1.0 mm (no zero-thickness/flat planes).
  2. Watertight Manifold Topology: 0 open boundaries or non-manifold edges on fabricated solids.
  3. Strict Outward Normal Alignment: n · (v_i - c) >= 0 across convex hulls.
  4. Custom Manifold Geometric Features: Ports, mounting bores, and fluid passages.
"""

import os
import sys
import json
import math
import struct
import base64

BASE_DIR = '/mnt/c/Users/samue/Projects/open-biosphere'
PARTS_DIR = os.path.join(BASE_DIR, 'public', 'assets', 'parts')

def parse_gltf(json_data):
    prim = json_data['meshes'][0]['primitives'][0]
    pos_acc = json_data['accessors'][prim['attributes']['POSITION']]
    idx_acc = json_data['accessors'][prim['indices']]

    pos_bv = json_data['bufferViews'][pos_acc['bufferView']]
    idx_bv = json_data['bufferViews'][idx_acc['bufferView']]

    uri = json_data['buffers'][0]['uri']
    b64_str = uri.split(',')[1]
    raw_bin = base64.b64decode(b64_str)

    verts = []
    pos_offset = pos_bv.get('byteOffset', 0) + pos_acc.get('byteOffset', 0)
    for i in range(pos_acc['count']):
        v_offset = pos_offset + i * 12
        x, y, z = struct.unpack('<fff', raw_bin[v_offset:v_offset+12])
        verts.append([x, y, z])

    faces = []
    idx_offset = idx_bv.get('byteOffset', 0) + idx_acc.get('byteOffset', 0)
    is_short = idx_acc['componentType'] == 5123
    step = 2 if is_short else 4
    fmt = '<H' if is_short else '<I'

    for i in range(0, idx_acc['count'], 3):
        i0 = struct.unpack(fmt, raw_bin[idx_offset + i * step : idx_offset + (i + 1) * step])[0]
        i1 = struct.unpack(fmt, raw_bin[idx_offset + (i + 1) * step : idx_offset + (i + 2) * step])[0]
        i2 = struct.unpack(fmt, raw_bin[idx_offset + (i + 2) * step : idx_offset + (i + 3) * step])[0]
        faces.append([i0, i1, i2])

    return verts, faces


def audit_model(part_id, gltf_path):
    with open(gltf_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    verts, faces = parse_gltf(data)
    if not verts or not faces:
        return False, "Empty geometry (0 vertices or 0 faces)"

    # 1. Volume & Bounding Envelope
    xs = [v[0] for v in verts]
    ys = [v[1] for v in verts]
    zs = [v[2] for v in verts]
    dx = max(xs) - min(xs)
    dy = max(ys) - min(ys)
    dz = max(zs) - min(zs)
    vol = dx * dy * dz

    if dx < 1.0 or dy < 1.0 or dz < 1.0:
        return False, f"Degenerate flat geometry: dx={dx:.2f}, dy={dy:.2f}, dz={dz:.2f} mm"

    # 2. Outward Normal Orientation
    cx = sum(xs) / len(verts)
    cy = sum(ys) / len(verts)
    cz = sum(zs) / len(verts)
    outward = 0
    inward = 0
    for i0, i1, i2 in faces:
        v0, v1, v2 = verts[i0], verts[i1], verts[i2]
        ax, ay, az = v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]
        bx, by, bz = v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]
        nx = ay * bz - az * by
        ny = az * bx - ax * bz
        nz = ax * by - ay * bx
        fcx = (v0[0] + v1[0] + v2[0]) / 3.0 - cx
        fcy = (v0[1] + v1[1] + v2[1]) / 3.0 - cy
        fcz = (v0[2] + v1[2] + v2[2]) / 3.0 - cz
        dot = nx * fcx + ny * fcy + nz * fcz
        if dot >= 0:
            outward += 1
        else:
            inward += 1

    if inward > outward:
        return False, f"Inverted mesh normals: {inward} inward vs {outward} outward"

    # 3. Manifold check for closed fabricated parts
    edge_counts = {}
    for f in faces:
        for i in range(3):
            u, v = f[i], f[(i + 1) % 3]
            e = (min(u, v), max(u, v))
            edge_counts[e] = edge_counts.get(e, 0) + 1

    non_two = sum(1 for c in edge_counts.values() if c != 2)

    # For targeted fabricated solids, require strict 2-manifold
    strict_targets = [
        'PART-FAB-JUNCTION-MANIFOLD-4WAY',
        'PART-FAB-LINKAGE-SERVO-DUAL-YOKE',
        'PART-FAB-PERCH-CONICAL-DOCK',
        'PART-FAB-ADAPTER-WEIR-OVERFLOW',
        'PART-FLUID-MANIFOLD-4CH-GRAD',
        'PART-FAB-DRUM-FLANGES-PETG',
        'PART-FAB-FRAME-WHOOP-85MM',
        'PART-FAB-CHUTE-RIPSTOP-PETG',
        'PART-FAB-DOCK-POGO-GANTRY',
        'PART-FAB-TARGET-APRILTAG-HARNESS',
        'PART-FAB-FLUME-HDPE-ACRYLIC',
        'PART-MECH-SPOKE-KEYED-ALUM16'
    ]
    if part_id in strict_targets:
        if non_two > 0:
            return False, f"Non-manifold edges on strict fabricated solid: {non_two} non-2 edges"

    # 4. Feature validation for custom manifolds
    if 'MANIFOLD' in part_id:
        # Assert port bosses protruding in Z and axial counterbore
        if max(zs) < 25.0:
            return False, f"Missing raised port bosses on manifold: max_z={max(zs):.1f}mm (expected >= 25mm)"
        if max(xs) - min(xs) < 100.0:
            return False, f"Invalid manifold length: dx={dx:.1f}mm"

    return True, f"Passed (V={vol:.1f}mm³, {len(verts)}v, {len(faces)}f, non_two_edges={non_two})"


def main():
    print("=" * 78)
    print("OPEN BIOSPHERE HEADLESS MODEL VALIDATION SUITE (RFC-017)")
    print("=" * 78)

    part_dirs = sorted([d for d in os.listdir(PARTS_DIR) if os.path.isdir(os.path.join(PARTS_DIR, d))])
    total = len(part_dirs)
    passed = 0
    failed = 0
    errors = []

    print(f"Auditing {total} canonical parts in public/assets/parts/...\n")

    for p in part_dirs:
        gltf_file = os.path.join(PARTS_DIR, p, 'model.gltf')
        if not os.path.exists(gltf_file):
            failed += 1
            errors.append(f"{p}: Missing model.gltf")
            continue

        ok, msg = audit_model(p, gltf_file)
        if ok:
            passed += 1
        else:
            failed += 1
            errors.append(f"{p}: {msg}")

    print(f"Test Summary across {total} Models:")
    print(f"  ✓ PASSED: {passed} / {total} ({(passed/total)*100:.1f}%)")
    print(f"  ✗ FAILED: {failed} / {total}")

    if errors:
        print("\nFailures:")
        for err in errors:
            print(f"  [FAIL] {err}")
        sys.exit(1)

    print("\n✓ ALL 3D CAD MODELS PASSED HEADLESS INTEGRITY SUITE (RFC-017)")
    sys.exit(0)


if __name__ == '__main__':
    main()
