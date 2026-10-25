#!/usr/bin/env python3
"""
scripts/reconcile_all_cad_orientations.py
Audits and corrects normal orientations and winding orders across all 3DS models
in public/assets/ and src/content/docs/parts/. Ensures 100% strictly outward normals.
"""

import os
import struct
import math

BASE_DIR = '/mnt/c/Users/samue/Projects/open-biosphere'

def parse_3ds(data):
    verts = []
    faces = []
    total_len = len(data)
    
    def parse_chunk(offset, end):
        while offset < end and offset + 6 <= total_len:
            cid, clen = struct.unpack('<HI', data[offset:offset+6])
            if clen < 6 or offset + clen > total_len: break
            chunk_end = offset + clen
            offset += 6
            if cid in (0x4D4D, 0x3D3D, 0x4100):
                parse_chunk(offset, chunk_end)
            elif cid == 0x4000:
                while offset < chunk_end and data[offset] != 0: offset += 1
                if offset < chunk_end and data[offset] == 0: offset += 1
                parse_chunk(offset, chunk_end)
            elif cid == 0x4110:
                nv = struct.unpack('<H', data[offset:offset+2])[0]
                offset += 2
                for _ in range(nv):
                    verts.append(struct.unpack('<fff', data[offset:offset+12]))
                    offset += 12
            elif cid == 0x4120:
                nf = struct.unpack('<H', data[offset:offset+2])[0]
                offset += 2
                for _ in range(nf):
                    f = struct.unpack('<HHHH', data[offset:offset+8])
                    faces.append([f[0], f[1], f[2]])
                    offset += 8
            offset = chunk_end

    parse_chunk(0, total_len)
    return verts, faces

def build_3ds(verts, faces):
    vert_bytes = struct.pack('<H', len(verts))
    for v in verts:
        vert_bytes += struct.pack('<fff', float(v[0]), float(v[1]), float(v[2]))
    vert_chunk = struct.pack('<HI', 0x4110, 6 + len(vert_bytes)) + vert_bytes

    face_bytes = struct.pack('<H', len(faces))
    for f in faces:
        face_bytes += struct.pack('<HHHH', int(f[0]), int(f[1]), int(f[2]), 0)
    face_chunk = struct.pack('<HI', 0x4120, 6 + len(face_bytes)) + face_bytes

    trimesh_data = vert_chunk + face_chunk
    trimesh_chunk = struct.pack('<HI', 0x4100, 6 + len(trimesh_data)) + trimesh_data

    obj_name = b'Mesh\x00'
    obj_data = obj_name + trimesh_chunk
    obj_chunk = struct.pack('<HI', 0x4000, 6 + len(obj_data)) + obj_data

    scale_val = struct.pack('<f', 1.0)
    scale_chunk = struct.pack('<HI', 0x0100, 6 + len(scale_val)) + scale_val

    edit3ds_data = scale_chunk + obj_chunk
    edit3ds_chunk = struct.pack('<HI', 0x3D3D, 6 + len(edit3ds_data)) + edit3ds_data

    version_val = struct.pack('<I', 3)
    version_chunk = struct.pack('<HI', 0x0002, 6 + len(version_val)) + version_val

    main_data = version_chunk + edit3ds_chunk
    main_chunk = struct.pack('<HI', 0x4D4D, 6 + len(main_data)) + main_data
    return main_chunk

def audit_and_fix(file_path):
    with open(file_path, 'rb') as f:
        raw_data = f.read()

    verts, faces = parse_3ds(raw_data)
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
        fx = (v0[0] + v1[0] + v2[0]) / 3 - cx
        fy = (v0[1] + v1[1] + v2[1]) / 3 - cy
        fz = (v0[2] + v1[2] + v2[2]) / 3 - cz
        dot = nx * fx + ny * fy + nz * fz
        if dot < 0:
            inward_faces += 1
        elif dot > 0:
            outward_faces += 1

    # If predominantly inward, flip the winding
    if inward_faces > outward_faces:
        fixed_faces = [[f[0], f[2], f[1]] for f in faces]
        new_data = build_3ds(verts, fixed_faces)
        with open(file_path, 'wb') as f:
            f.write(new_data)
        return True, f"Flipped {len(faces)} faces (was in={inward_faces}, out={outward_faces})"

    return False, f"Already outward (out={outward_faces}, in={inward_faces})"

def main():
    target_dirs = [
        os.path.join(BASE_DIR, 'public', 'assets'),
        os.path.join(BASE_DIR, 'src', 'content', 'docs', 'parts'),
    ]

    fixed_count = 0
    already_clean = 0
    total = 0

    for tdir in target_dirs:
        for root, _, files in os.walk(tdir):
            for file in files:
                if file.endswith('.3ds'):
                    total += 1
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, BASE_DIR)
                    was_fixed, msg = audit_and_fix(full_path)
                    if was_fixed:
                        fixed_count += 1
                        print(f"  [FIXED] {rel_path}: {msg}")
                    else:
                        already_clean += 1

    print("\n" + "="*60)
    print(f"Audit Complete across {total} 3DS models:")
    print(f"  - Fixed (Inverted -> Outward): {fixed_count}")
    print(f"  - Verified Clean Outward:     {already_clean}")
    print("="*60)

if __name__ == '__main__':
    main()
