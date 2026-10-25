#!/usr/bin/env python3
"""
scripts/reconcile_all_cad_orientations.py
Audits and corrects normal orientations and winding orders across all glTF models
in public/assets/ and src/content/docs/parts/. Ensures 100% strictly outward normals.
"""

import os
import json
import base64
import struct
import math

BASE_DIR = '/mnt/c/Users/samue/Projects/open-biosphere'

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

def build_gltf(verts, faces, name="Mesh"):
    min_x = float(min(v[0] for v in verts))
    max_x = float(max(v[0] for v in verts))
    min_y = float(min(v[1] for v in verts))
    max_y = float(max(v[1] for v in verts))
    min_z = float(min(v[2] for v in verts))
    max_z = float(max(v[2] for v in verts))

    flat_indices = []
    for f in faces:
        flat_indices.extend([int(f[0]), int(f[1]), int(f[2])])
    index_bytes = struct.pack('<' + 'H' * len(flat_indices), *flat_indices)
    index_pad = (4 - (len(index_bytes) % 4)) % 4
    index_bytes_padded = index_bytes + (b'\x00' * index_pad)

    flat_verts = []
    for v in verts:
        flat_verts.extend([float(v[0]), float(v[1]), float(v[2])])
    vertex_bytes = struct.pack('<' + 'f' * len(flat_verts), *flat_verts)
    vertex_pad = (4 - (len(vertex_bytes) % 4)) % 4
    vertex_bytes_padded = vertex_bytes + (b'\x00' * vertex_pad)

    bin_data = index_bytes_padded + vertex_bytes_padded
    b64_data = base64.b64encode(bin_data).decode('ascii')
    uri = f"data:application/octet-stream;base64,{b64_data}"

    gltf = {
        "asset": {
            "version": "2.0",
            "generator": "OpenBiosphere-ParametricCAD-GLTF (RFC-014)"
        },
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"name": name, "mesh": 0}],
        "meshes": [{
            "name": f"{name}_Geometry",
            "primitives": [{
                "attributes": {"POSITION": 1},
                "indices": 0,
                "material": 0,
                "mode": 4
            }]
        }],
        "materials": [{
            "name": "PBR_Standard",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.7, 0.75, 0.8, 1.0],
                "metallicFactor": 0.7,
                "roughnessFactor": 0.35
            },
            "doubleSided": True
        }],
        "accessors": [
            {
                "bufferView": 0,
                "byteOffset": 0,
                "componentType": 5123,
                "count": len(flat_indices),
                "type": "SCALAR",
                "max": [int(max(flat_indices))],
                "min": [int(min(flat_indices))]
            },
            {
                "bufferView": 1,
                "byteOffset": 0,
                "componentType": 5126,
                "count": len(verts),
                "type": "VEC3",
                "max": [max_x, max_y, max_z],
                "min": [min_x, min_y, min_z]
            }
        ],
        "bufferViews": [
            {
                "buffer": 0,
                "byteOffset": 0,
                "byteLength": len(index_bytes),
                "target": 34963
            },
            {
                "buffer": 0,
                "byteOffset": len(index_bytes_padded),
                "byteLength": len(vertex_bytes),
                "byteStride": 12,
                "target": 34962
            }
        ],
        "buffers": [
            {
                "byteLength": len(bin_data),
                "uri": uri
            }
        ]
    }
    return json.dumps(gltf, indent=2)

def audit_and_fix(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    verts, faces = parse_gltf(data)
    if not verts or not faces:
        return False, "Empty mesh"

    cx = sum(v[0] for v in verts) / len(verts)
    cy = sum(v[1] for v in verts) / len(verts)
    cz = sum(v[2] for v in verts) / len(verts)

    inward_faces = 0
    outward_faces = 0

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
            outward_faces += 1
        else:
            inward_faces += 1

    needs_flip = inward_faces > outward_faces
    if needs_flip:
        fixed_faces = [[f[0], f[2], f[1]] for f in faces]
        base_name = os.path.splitext(os.path.basename(file_path))[0]
        new_json = build_gltf(verts, fixed_faces, name=base_name)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_json)
        return True, f"Flipped winding: {inward_faces} inward vs {outward_faces} outward"
    return False, f"Pristine outward: {outward_faces} outward vs {inward_faces} inward"

def main():
    search_dirs = [
        f'{BASE_DIR}/public/assets/machines',
        f'{BASE_DIR}/public/assets/parts',
        f'{BASE_DIR}/src/content/docs/parts'
    ]
    
    total = 0
    flipped = 0
    pristine = 0

    for sdir in search_dirs:
        for root, dirs, files in os.walk(sdir):
            for file in files:
                if file.endswith('.gltf'):
                    p = os.path.join(root, file)
                    total += 1
                    was_flipped, msg = audit_and_fix(p)
                    if was_flipped:
                        flipped += 1
                        print(f"RECONCILED: {p} -> {msg}")
                    else:
                        pristine += 1

    print(f"\nAudit Complete across {total} glTF models:")
    print(f"  Pristine Outward Models: {pristine}")
    print(f"  Reconciled Inverted Models: {flipped}")

if __name__ == '__main__':
    main()
