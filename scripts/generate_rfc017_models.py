#!/usr/bin/env python3
"""
scripts/generate_rfc017_models.py
Generates clean, watertight 2-manifold procedural CAD glTF models for:
- PART-FAB-JUNCTION-MANIFOLD-4WAY (and PART-FLUID-MANIFOLD-4CH-GRAD)
- PART-FAB-LINKAGE-SERVO-DUAL-YOKE
- PART-FAB-PERCH-CONICAL-DOCK
Conforms strictly to RFC-017 specifications and GEMINI.md engineering invariants.
"""

import os
import json
import math
import struct
import base64

BASE_DIR = '/mnt/c/Users/samue/Projects/open-biosphere'

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
            "generator": "OpenBiosphere-ParametricCAD-RFC017"
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


# ============================================================================
# 1. PART-FAB-JUNCTION-MANIFOLD-4WAY
# ============================================================================
def generate_junction_manifold():
    verts = []
    faces = []
    vert_map = {}

    def get_vert(x, y, z):
        key = (round(float(x), 4), round(float(y), 4), round(float(z), 4))
        if key in vert_map:
            return vert_map[key]
        idx = len(verts)
        verts.append([float(x), float(y), float(z)])
        vert_map[key] = idx
        return idx

    def add_tri(p0, p1, p2):
        i0 = get_vert(*p0)
        i1 = get_vert(*p1)
        i2 = get_vert(*p2)
        if i0 != i1 and i1 != i2 and i2 != i0:
            faces.append((i0, i1, i2))

    def add_quad(p0, p1, p2, p3):
        add_tri(p0, p1, p2)
        add_tri(p0, p2, p3)

    N = 16

    X_MIN, X_MAX = -55.0, 55.0
    Y_MIN, Y_MAX = -24.0, 24.0
    Z_MIN, Z_MAX = -18.0, 18.0

    dy = (Y_MAX - Y_MIN) / 4.0
    dz = (Z_MAX - Z_MIN) / 4.0

    # 1. 3 Top Port Bosses (x = -30, 0, +30 on Z = +18)
    port_xs = [-30.0, 0.0, 30.0]
    R_boss = 7.0
    R_barb = 7.8
    R_bore = 4.0
    Z_top = Z_MAX
    Z_b1 = 22.0
    Z_bmid = 24.5
    Z_b2 = 25.5
    Z_btop = 28.0
    Z_bbot = 2.0

    for cx in port_xs:
        r_base = []
        r_b1 = []
        r_bmid = []
        r_b2 = []
        r_btop = []
        r_bore_top = []
        r_bore_bot = []
        for i in range(N):
            th = -0.75 * math.pi + 2.0 * math.pi * i / N
            ct, st = math.cos(th), math.sin(th)
            r_base.append((cx + R_boss * ct, R_boss * st, Z_top))
            r_b1.append((cx + R_boss * ct, R_boss * st, Z_b1))
            r_bmid.append((cx + R_barb * ct, R_barb * st, Z_bmid))
            r_b2.append((cx + R_boss * ct, R_boss * st, Z_b2))
            r_btop.append((cx + R_boss * ct, R_boss * st, Z_btop))
            r_bore_top.append((cx + R_bore * ct, R_bore * st, Z_btop))
            r_bore_bot.append((cx + R_bore * ct, R_bore * st, Z_bbot))

        # Skin outer boss (upwards)
        for i in range(N):
            ni = (i + 1) % N
            add_quad(r_base[i], r_base[ni], r_b1[ni], r_b1[i])
            add_quad(r_b1[i], r_b1[ni], r_bmid[ni], r_bmid[i])
            add_quad(r_bmid[i], r_bmid[ni], r_b2[ni], r_b2[i])
            add_quad(r_b2[i], r_b2[ni], r_btop[ni], r_btop[i])

        # Top annular rim (from outer boss top to inner bore top, normal +Z)
        for i in range(N):
            ni = (i + 1) % N
            add_quad(r_btop[i], r_btop[ni], r_bore_top[ni], r_bore_top[i])

        # Inner bore cylinder (normals pointing into bore cavity)
        for i in range(N):
            ni = (i + 1) % N
            add_quad(r_bore_top[ni], r_bore_top[i], r_bore_bot[i], r_bore_bot[ni])

        # Bore bottom cap
        p_bot_center = (cx, 0.0, Z_bbot)
        for i in range(N):
            ni = (i + 1) % N
            add_tri(p_bot_center, r_bore_bot[i], r_bore_bot[ni])

    # 2. Top face mesh with 3 circular holes
    x_nodes = [-55.0, -45.0, -15.0, 15.0, 45.0, 55.0]

    for p_idx, cx in enumerate(port_xs):
        x0 = x_nodes[p_idx + 1]
        x1 = x_nodes[p_idx + 2]
        dx = (x1 - x0) / 4.0
        rect_pts = []
        for i in range(4):
            rect_pts.append((x0 + i * dx, Y_MIN, Z_top))
        for i in range(4):
            rect_pts.append((x1, Y_MIN + i * dy, Z_top))
        for i in range(4):
            rect_pts.append((x1 - i * dx, Y_MAX, Z_top))
        for i in range(4):
            rect_pts.append((x0, Y_MAX - i * dy, Z_top))

        r_hole = []
        for i in range(16):
            th = -0.75 * math.pi + 2.0 * math.pi * i / 16
            r_hole.append((cx + R_boss * math.cos(th), R_boss * math.sin(th), Z_top))

        for i in range(16):
            ni = (i + 1) % 16
            add_quad(rect_pts[i], rect_pts[ni], r_hole[ni], r_hole[i])

    # Margins on top face
    for i in range(4):
        # Left margin
        p0 = (-55.0, Y_MIN + i * dy, Z_top)
        p1 = (-45.0, Y_MIN + i * dy, Z_top)
        p2 = (-45.0, Y_MIN + (i + 1) * dy, Z_top)
        p3 = (-55.0, Y_MIN + (i + 1) * dy, Z_top)
        add_quad(p0, p1, p2, p3)
        # Right margin
        p0_r = (45.0, Y_MIN + i * dy, Z_top)
        p1_r = (55.0, Y_MIN + i * dy, Z_top)
        p2_r = (55.0, Y_MIN + (i + 1) * dy, Z_top)
        p3_r = (45.0, Y_MIN + (i + 1) * dy, Z_top)
        add_quad(p0_r, p1_r, p2_r, p3_r)

    # 3. Bottom face (Z = -18)
    for xi in range(len(x_nodes) - 1):
        x0, x1 = x_nodes[xi], x_nodes[xi + 1]
        n_sub = 4 if xi in [1, 2, 3] else 1
        dx_sub = (x1 - x0) / n_sub
        for si in range(n_sub):
            sx0 = x0 + si * dx_sub
            sx1 = sx0 + dx_sub
            for yi in range(4):
                y0 = Y_MIN + yi * dy
                y1 = Y_MIN + (yi + 1) * dy
                p0 = (sx0, y0, Z_MIN)
                p1 = (sx1, y0, Z_MIN)
                p2 = (sx1, y1, Z_MIN)
                p3 = (sx0, y1, Z_MIN)
                add_quad(p0, p3, p2, p1)

    # 4. Front & Back faces (Y = -24 and Y = +24)
    for xi in range(len(x_nodes) - 1):
        x0, x1 = x_nodes[xi], x_nodes[xi + 1]
        n_sub = 4 if xi in [1, 2, 3] else 1
        dx_sub = (x1 - x0) / n_sub
        for si in range(n_sub):
            sx0 = x0 + si * dx_sub
            sx1 = sx0 + dx_sub
            for zi in range(4):
                z0 = Z_MIN + zi * dz
                z1 = Z_MIN + (zi + 1) * dz
                # Front Y = Y_MIN
                p_b0 = (sx0, Y_MIN, z0)
                p_b1 = (sx1, Y_MIN, z0)
                p_t1 = (sx1, Y_MIN, z1)
                p_t0 = (sx0, Y_MIN, z1)
                add_quad(p_b0, p_t0, p_t1, p_b1)
                # Back Y = Y_MAX
                p_b0_bk = (sx0, Y_MAX, z0)
                p_b1_bk = (sx1, Y_MAX, z0)
                p_t1_bk = (sx1, Y_MAX, z1)
                p_t0_bk = (sx0, Y_MAX, z1)
                add_quad(p_b0_bk, p_b1_bk, p_t1_bk, p_t0_bk)

    # 5. Left end face (X = -55)
    for yi in range(4):
        y0 = Y_MIN + yi * dy
        y1 = Y_MIN + (yi + 1) * dy
        for zi in range(4):
            z0 = Z_MIN + zi * dz
            z1 = Z_MIN + (zi + 1) * dz
            p0 = (X_MIN, y0, z0)
            p1 = (X_MIN, y1, z0)
            p2 = (X_MIN, y1, z1)
            p3 = (X_MIN, y0, z1)
            add_quad(p0, p1, p2, p3)

    # 6. Right end face (X = +55) & Axial Outflow Bore
    R_cb = 9.0
    R_outflow = 5.0
    X_cb_in = 47.0
    X_outflow_bot = 15.0

    r_face_cb = []
    r_step_cb = []
    r_step_inner = []
    r_inner_bot = []
    for i in range(N):
        th = -0.75 * math.pi + 2.0 * math.pi * i / N
        cy, cz = math.cos(th), math.sin(th)
        r_face_cb.append((X_MAX, R_cb * cy, R_cb * cz))
        r_step_cb.append((X_cb_in, R_cb * cy, R_cb * cz))
        r_step_inner.append((X_cb_in, R_outflow * cy, R_outflow * cz))
        r_inner_bot.append((X_outflow_bot, R_outflow * cy, R_outflow * cz))

    for i in range(N):
        ni = (i + 1) % N
        add_quad(r_face_cb[i], r_face_cb[ni], r_step_cb[ni], r_step_cb[i])
        add_quad(r_step_cb[i], r_step_cb[ni], r_step_inner[ni], r_step_inner[i])
        add_quad(r_step_inner[i], r_step_inner[ni], r_inner_bot[ni], r_inner_bot[i])

    p_outflow_center = (X_outflow_bot, 0.0, 0.0)
    for i in range(N):
        ni = (i + 1) % N
        add_tri(p_outflow_center, r_inner_bot[ni], r_inner_bot[i])

    rect_x55 = []
    for i in range(4):
        rect_x55.append((X_MAX, Y_MIN + i * dy, Z_MIN))
    for i in range(4):
        rect_x55.append((X_MAX, Y_MAX, Z_MIN + i * dz))
    for i in range(4):
        rect_x55.append((X_MAX, Y_MAX - i * dy, Z_top))
    for i in range(4):
        rect_x55.append((X_MAX, Y_MIN, Z_top - i * dz))

    for i in range(16):
        ni = (i + 1) % 16
        add_quad(rect_x55[i], rect_x55[ni], r_face_cb[ni], r_face_cb[i])

    return verts, faces


# ============================================================================
# 2. PART-FAB-LINKAGE-SERVO-DUAL-YOKE
# ============================================================================
def generate_servo_linkage():
    x_grid = [-42.5, -34.0, -25.0, -20.0, -10.0, 0.0, 10.0, 20.0, 25.0, 34.0, 42.5]
    y_grid = [-12.0, -9.0, -3.5, 3.5, 9.0, 12.0]
    z_grid = [-8.0, -3.5, 3.5, 8.0]

    nx = len(x_grid) - 1
    ny = len(y_grid) - 1
    nz = len(z_grid) - 1

    solid = set()

    for xi in range(nx):
        for yi in range(ny):
            for zi in range(nz):
                is_solid = False

                # Central web: xi in [3, 4, 5, 6] (x in [-20, 20])
                if 3 <= xi <= 6:
                    if zi == 0 and 1 <= yi <= 3:
                        is_solid = True
                    elif zi == 2 and 1 <= yi <= 3:
                        is_solid = True
                    elif zi == 1 and yi == 2:
                        is_solid = True

                # Clevis base blocks: xi == 2 (left) and xi == 7 (right)
                elif xi == 2 or xi == 7:
                    is_solid = True

                # Left fork: xi in [0, 1] (x in [-42.5, -25.0])
                elif xi in [0, 1]:
                    if zi == 2 and 1 <= yi <= 3:
                        is_solid = True
                    elif zi == 0 and 1 <= yi <= 3:
                        is_solid = True
                    # Pin hole at xi == 1, yi == 2
                    if xi == 1 and yi == 2:
                        is_solid = False

                # Right fork: xi in [8, 9] (x in [25.0, 42.5])
                elif xi in [8, 9]:
                    if zi == 2 and 1 <= yi <= 3:
                        is_solid = True
                    elif zi == 0 and 1 <= yi <= 3:
                        is_solid = True
                    # Pin hole at xi == 8, yi == 2
                    if xi == 8 and yi == 2:
                        is_solid = False

                if is_solid:
                    solid.add((xi, yi, zi))

    verts = []
    faces = []
    vert_map = {}

    def get_vert(x, y, z):
        key = (round(float(x), 4), round(float(y), 4), round(float(z), 4))
        if key in vert_map:
            return vert_map[key]
        idx = len(verts)
        verts.append([float(x), float(y), float(z)])
        vert_map[key] = idx
        return idx

    def add_quad(p0, p1, p2, p3):
        i0 = get_vert(*p0)
        i1 = get_vert(*p1)
        i2 = get_vert(*p2)
        i3 = get_vert(*p3)
        faces.append((i0, i1, i2))
        faces.append((i0, i2, i3))

    for (xi, yi, zi) in sorted(solid):
        x0, x1 = x_grid[xi], x_grid[xi + 1]
        y0, y1 = y_grid[yi], y_grid[yi + 1]
        z0, z1 = z_grid[zi], z_grid[zi + 1]

        # +X face (normal +X)
        if (xi + 1, yi, zi) not in solid:
            add_quad((x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1))
        # -X face (normal -X)
        if (xi - 1, yi, zi) not in solid:
            add_quad((x0, y1, z0), (x0, y0, z0), (x0, y0, z1), (x0, y1, z1))
        # +Y face (normal +Y)
        if (xi, yi + 1, zi) not in solid:
            add_quad((x1, y1, z0), (x0, y1, z0), (x0, y1, z1), (x1, y1, z1))
        # -Y face (normal -Y)
        if (xi, yi - 1, zi) not in solid:
            add_quad((x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1))
        # +Z face (normal +Z)
        if (xi, yi, zi + 1) not in solid:
            add_quad((x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1))
        # -Z face (normal -Z)
        if (xi, yi, zi - 1) not in solid:
            add_quad((x0, y1, z0), (x1, y1, z0), (x1, y0, z0), (x0, y0, z0))

    return verts, faces


# ============================================================================
# 3. PART-FAB-PERCH-CONICAL-DOCK
# ============================================================================
def generate_perch_dock():
    N = 32
    verts = []
    faces = []

    def add_ring(r, z):
        start = len(verts)
        for i in range(N):
            theta = 2.0 * math.pi * i / N
            verts.append([r * math.cos(theta), r * math.sin(theta), z])
        return start

    def skin(r1, r2, reverse=False):
        for i in range(N):
            ni = (i + 1) % N
            v0 = r1 + i
            v1 = r1 + ni
            v2 = r2 + ni
            v3 = r2 + i
            if not reverse:
                faces.append((v0, v1, v2))
                faces.append((v0, v2, v3))
            else:
                faces.append((v0, v2, v1))
                faces.append((v0, v3, v2))

    # Exterior profile (top z=+37.5 to bottom z=-37.5)
    r_ext_top = add_ring(55.0, 37.5)
    r_ext_mid = add_ring(41.5, 12.5)
    r_ext_shldr = add_ring(28.0, -12.5)
    r_ext_flange_top = add_ring(36.0, -30.0)
    r_ext_flange_bot = add_ring(36.0, -37.5)

    skin(r_ext_top, r_ext_mid)
    skin(r_ext_mid, r_ext_shldr)
    skin(r_ext_shldr, r_ext_flange_top)
    skin(r_ext_flange_top, r_ext_flange_bot)

    # Bottom annular face (connects r_ext_flange_bot to r_int_bot)
    r_int_bot = add_ring(16.0, -37.5)
    skin(r_ext_flange_bot, r_int_bot, reverse=True)

    # Interior profile (from bottom z=-37.5 up to top z=+37.5)
    r_int_throat = add_ring(16.0, -12.5)
    r_int_w1_in  = add_ring(28.0, 5.0)
    r_int_w1_out = add_ring(29.0, 6.0)
    r_int_w2_in  = add_ring(39.5, 20.0)
    r_int_w2_out = add_ring(40.5, 21.0)
    r_int_top    = add_ring(51.5, 37.5)

    skin(r_int_bot, r_int_throat)
    skin(r_int_throat, r_int_w1_in)
    skin(r_int_w1_in, r_int_w1_out)
    skin(r_int_w1_out, r_int_w2_in)
    skin(r_int_w2_in, r_int_w2_out)
    skin(r_int_w2_out, r_int_top)

    # Top annular rim (connects r_int_top to r_ext_top)
    skin(r_int_top, r_ext_top, reverse=True)

    return verts, faces


def save_model(part_id, doc_slug, verts, faces):
    pub_path = f"{BASE_DIR}/public/assets/parts/{part_id}/model.gltf"
    doc_path = f"{BASE_DIR}/src/content/docs/parts/{doc_slug}/model.gltf"

    gltf_json = build_gltf(verts, faces, name=part_id)

    os.makedirs(os.path.dirname(pub_path), exist_ok=True)
    with open(pub_path, 'w', encoding='utf-8') as f:
        f.write(gltf_json)
    print(f"Wrote {pub_path}")

    if os.path.exists(os.path.dirname(doc_path)):
        with open(doc_path, 'w', encoding='utf-8') as f:
            f.write(gltf_json)
        print(f"Wrote {doc_path}")


def main():
    print("Generating RFC-017 remediated models...")

    # 1. PART-FAB-JUNCTION-MANIFOLD-4WAY & PART-FLUID-MANIFOLD-4CH-GRAD
    v_man, f_man = generate_junction_manifold()
    save_model("PART-FAB-JUNCTION-MANIFOLD-4WAY", "part-custom-manifold-junction", v_man, f_man)
    save_model("PART-FLUID-MANIFOLD-4CH-GRAD", "part-custom-part-fluid-manifold-4ch-grad", v_man, f_man)

    # 2. PART-FAB-LINKAGE-SERVO-DUAL-YOKE
    v_yoke, f_yoke = generate_servo_linkage()
    save_model("PART-FAB-LINKAGE-SERVO-DUAL-YOKE", "part-custom-servo-linkage", v_yoke, f_yoke)

    # 3. PART-FAB-PERCH-CONICAL-DOCK
    v_perch, f_perch = generate_perch_dock()
    save_model("PART-FAB-PERCH-CONICAL-DOCK", "part-custom-perch-conical-dock", v_perch, f_perch)

    print("\nAll models successfully generated and saved!")


if __name__ == '__main__':
    main()
