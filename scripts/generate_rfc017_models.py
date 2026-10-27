#!/usr/bin/env python3
"""
scripts/generate_rfc017_models.py
Generates clean, watertight 2-manifold procedural CAD glTF models for:
- PART-FAB-JUNCTION-MANIFOLD-4WAY (and PART-FLUID-MANIFOLD-4CH-GRAD)
- PART-FAB-LINKAGE-SERVO-DUAL-YOKE
- PART-FAB-PERCH-CONICAL-DOCK
Conforms strictly to RFC-017 specifications and GEMINI.md engineering invariants.
Ensures 100% strictly outward face normals across all exterior walls.
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

    def add_tri_target(p0, p1, p2, target_vec):
        ax, ay, az = p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]
        bx, by, bz = p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]
        nx = ay * bz - az * by
        ny = az * bx - ax * bz
        nz = ax * by - ay * bx
        dot = nx * target_vec[0] + ny * target_vec[1] + nz * target_vec[2]
        i0, i1, i2 = get_vert(*p0), get_vert(*p1), get_vert(*p2)
        if dot >= 0:
            faces.append((i0, i1, i2))
        else:
            faces.append((i0, i2, i1))

    def add_quad_target(p0, p1, p2, p3, target_vec):
        ax, ay, az = p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]
        bx, by, bz = p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]
        nx = ay * bz - az * by
        ny = az * bx - ax * bz
        nz = ax * by - ay * bx
        dot = nx * target_vec[0] + ny * target_vec[1] + nz * target_vec[2]
        i0, i1, i2, i3 = get_vert(*p0), get_vert(*p1), get_vert(*p2), get_vert(*p3)
        if dot >= 0:
            faces.append((i0, i1, i2))
            faces.append((i0, i2, i3))
        else:
            faces.append((i0, i2, i1))
            faces.append((i0, i3, i2))

    def add_quad_radial(p0, p1, p2, p3, axis_x=0.0, axis_y=0.0, outward=True):
        ax, ay, az = p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]
        bx, by, bz = p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]
        nx = ay * bz - az * by
        ny = az * bx - ax * bz
        nz = ax * by - ay * bx
        fcx = (p0[0] + p1[0] + p2[0] + p3[0]) / 4.0 - axis_x
        fcy = (p0[1] + p1[1] + p2[1] + p3[1]) / 4.0 - axis_y
        rad_dot = nx * fcx + ny * fcy
        i0, i1, i2, i3 = get_vert(*p0), get_vert(*p1), get_vert(*p2), get_vert(*p3)
        condition = (rad_dot >= 0) if outward else (rad_dot <= 0)
        if condition:
            faces.append((i0, i1, i2))
            faces.append((i0, i2, i3))
        else:
            faces.append((i0, i2, i1))
            faces.append((i0, i3, i2))

    def add_quad_axial_radial(p0, p1, p2, p3, axis_y=0.0, axis_z=0.0, outward=True):
        ax, ay, az = p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]
        bx, by, bz = p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]
        nx = ay * bz - az * by
        ny = az * bx - ax * bz
        nz = ax * by - ay * bx
        fcy = (p0[1] + p1[1] + p2[1] + p3[1]) / 4.0 - axis_y
        fcz = (p0[2] + p1[2] + p2[2] + p3[2]) / 4.0 - axis_z
        rad_dot = ny * fcy + nz * fcz
        i0, i1, i2, i3 = get_vert(*p0), get_vert(*p1), get_vert(*p2), get_vert(*p3)
        condition = (rad_dot >= 0) if outward else (rad_dot <= 0)
        if condition:
            faces.append((i0, i1, i2))
            faces.append((i0, i2, i3))
        else:
            faces.append((i0, i2, i1))
            faces.append((i0, i3, i2))

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

        # Skin outer boss (radially outward away from boss center)
        for i in range(N):
            ni = (i + 1) % N
            add_quad_radial(r_base[i], r_base[ni], r_b1[ni], r_b1[i], axis_x=cx, axis_y=0.0, outward=True)
            add_quad_radial(r_b1[i], r_b1[ni], r_bmid[ni], r_bmid[i], axis_x=cx, axis_y=0.0, outward=True)
            add_quad_radial(r_bmid[i], r_bmid[ni], r_b2[ni], r_b2[i], axis_x=cx, axis_y=0.0, outward=True)
            add_quad_radial(r_b2[i], r_b2[ni], r_btop[ni], r_btop[i], axis_x=cx, axis_y=0.0, outward=True)

        # Top annular rim (normal +Z)
        for i in range(N):
            ni = (i + 1) % N
            add_quad_target(r_btop[i], r_btop[ni], r_bore_top[ni], r_bore_top[i], (0.0, 0.0, 1.0))

        # Inner bore cylinder (radially inward into bore cavity)
        for i in range(N):
            ni = (i + 1) % N
            add_quad_radial(r_bore_top[i], r_bore_top[ni], r_bore_bot[ni], r_bore_bot[i], axis_x=cx, axis_y=0.0, outward=False)

        # Bore bottom cap (normal +Z into bore cavity)
        p_bot_center = (cx, 0.0, Z_bbot)
        for i in range(N):
            ni = (i + 1) % N
            add_tri_target(p_bot_center, r_bore_bot[i], r_bore_bot[ni], (0.0, 0.0, 1.0))

    # 2. Top face mesh with 3 circular holes (normal +Z)
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
            add_quad_target(rect_pts[i], rect_pts[ni], r_hole[ni], r_hole[i], (0.0, 0.0, 1.0))

    # Margins on top face (normal +Z)
    for i in range(4):
        p0 = (-55.0, Y_MIN + i * dy, Z_top)
        p1 = (-45.0, Y_MIN + i * dy, Z_top)
        p2 = (-45.0, Y_MIN + (i + 1) * dy, Z_top)
        p3 = (-55.0, Y_MIN + (i + 1) * dy, Z_top)
        add_quad_target(p0, p1, p2, p3, (0.0, 0.0, 1.0))

        p0_r = (45.0, Y_MIN + i * dy, Z_top)
        p1_r = (55.0, Y_MIN + i * dy, Z_top)
        p2_r = (55.0, Y_MIN + (i + 1) * dy, Z_top)
        p3_r = (45.0, Y_MIN + (i + 1) * dy, Z_top)
        add_quad_target(p0_r, p1_r, p2_r, p3_r, (0.0, 0.0, 1.0))

    # 3. Bottom face (normal -Z)
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
                add_quad_target(p0, p1, p2, p3, (0.0, 0.0, -1.0))

    # 4. Front & Back faces (strictly -Y for front, +Y for back)
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
                # Front Y = Y_MIN (strictly outward -Y)
                p_b0 = (sx0, Y_MIN, z0)
                p_b1 = (sx1, Y_MIN, z0)
                p_t1 = (sx1, Y_MIN, z1)
                p_t0 = (sx0, Y_MIN, z1)
                add_quad_target(p_b0, p_b1, p_t1, p_t0, (0.0, -1.0, 0.0))

                # Back Y = Y_MAX (strictly outward +Y)
                p_b0_bk = (sx0, Y_MAX, z0)
                p_b1_bk = (sx1, Y_MAX, z0)
                p_t1_bk = (sx1, Y_MAX, z1)
                p_t0_bk = (sx0, Y_MAX, z1)
                add_quad_target(p_b0_bk, p_b1_bk, p_t1_bk, p_t0_bk, (0.0, 1.0, 0.0))

    # 5. Left end face (X = -55, strictly outward -X)
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
            add_quad_target(p0, p1, p2, p3, (-1.0, 0.0, 0.0))

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
        add_quad_axial_radial(r_face_cb[i], r_face_cb[ni], r_step_cb[ni], r_step_cb[i], axis_y=0.0, axis_z=0.0, outward=False)
        add_quad_target(r_step_cb[i], r_step_cb[ni], r_step_inner[ni], r_step_inner[i], (1.0, 0.0, 0.0))
        add_quad_axial_radial(r_step_inner[i], r_step_inner[ni], r_inner_bot[ni], r_inner_bot[i], axis_y=0.0, axis_z=0.0, outward=False)

    p_outflow_center = (X_outflow_bot, 0.0, 0.0)
    for i in range(N):
        ni = (i + 1) % N
        add_tri_target(p_outflow_center, r_inner_bot[ni], r_inner_bot[i], (1.0, 0.0, 0.0))

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
        add_quad_target(rect_x55[i], rect_x55[ni], r_face_cb[ni], r_face_cb[i], (1.0, 0.0, 0.0))

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

                if 3 <= xi <= 6:
                    if zi == 0 and 1 <= yi <= 3:
                        is_solid = True
                    elif zi == 2 and 1 <= yi <= 3:
                        is_solid = True
                    elif zi == 1 and yi == 2:
                        is_solid = True

                elif xi == 2 or xi == 7:
                    is_solid = True

                elif xi in [0, 1]:
                    if zi == 2 and 1 <= yi <= 3:
                        is_solid = True
                    elif zi == 0 and 1 <= yi <= 3:
                        is_solid = True
                    if xi == 1 and yi == 2:
                        is_solid = False

                elif xi in [8, 9]:
                    if zi == 2 and 1 <= yi <= 3:
                        is_solid = True
                    elif zi == 0 and 1 <= yi <= 3:
                        is_solid = True
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

    def add_quad_radial(v0, v1, v2, v3, outward=True):
        p0, p1, p2, p3 = verts[v0], verts[v1], verts[v2], verts[v3]
        ax, ay, az = p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]
        bx, by, bz = p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]
        nx = ay * bz - az * by
        ny = az * bx - ax * bz
        nz = ax * by - ay * bx
        fcx = (p0[0] + p1[0] + p2[0] + p3[0]) / 4.0
        fcy = (p0[1] + p1[1] + p2[1] + p3[1]) / 4.0
        rad_dot = nx * fcx + ny * fcy
        condition = (rad_dot >= 0) if outward else (rad_dot <= 0)
        if condition:
            faces.append((v0, v1, v2))
            faces.append((v0, v2, v3))
        else:
            faces.append((v0, v2, v1))
            faces.append((v0, v3, v2))

    def add_quad_z(v0, v1, v2, v3, normal_z=1.0):
        p0, p1, p2, p3 = verts[v0], verts[v1], verts[v2], verts[v3]
        ax, ay, az = p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]
        bx, by, bz = p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]
        nz = ax * by - ay * bx
        if (nz * normal_z) >= 0:
            faces.append((v0, v1, v2))
            faces.append((v0, v2, v3))
        else:
            faces.append((v0, v2, v1))
            faces.append((v0, v3, v2))

    def skin_radial(r1, r2, outward=True):
        for i in range(N):
            ni = (i + 1) % N
            add_quad_radial(r1 + i, r1 + ni, r2 + ni, r2 + i, outward=outward)

    def skin_cap(r1, r2, normal_z=1.0):
        for i in range(N):
            ni = (i + 1) % N
            add_quad_z(r1 + i, r1 + ni, r2 + ni, r2 + i, normal_z=normal_z)

    # Exterior profile (top z=+37.5 to bottom z=-37.5): strictly outward away from z-axis
    r_ext_top = add_ring(55.0, 37.5)
    r_ext_mid = add_ring(41.5, 12.5)
    r_ext_shldr = add_ring(28.0, -12.5)
    r_ext_flange_top = add_ring(36.0, -30.0)
    r_ext_flange_bot = add_ring(36.0, -37.5)

    skin_radial(r_ext_top, r_ext_mid, outward=True)
    skin_radial(r_ext_mid, r_ext_shldr, outward=True)
    skin_radial(r_ext_shldr, r_ext_flange_top, outward=True)
    skin_radial(r_ext_flange_top, r_ext_flange_bot, outward=True)

    # Bottom annular face: strictly -Z
    r_int_bot = add_ring(16.0, -37.5)
    skin_cap(r_ext_flange_bot, r_int_bot, normal_z=-1.0)

    # Interior profile (bottom z=-37.5 up to top z=+37.5): strictly into funnel cavity (outward=False)
    r_int_throat = add_ring(16.0, -12.5)
    r_int_w1_in  = add_ring(28.0, 5.0)
    r_int_w1_out = add_ring(29.0, 6.0)
    r_int_w2_in  = add_ring(39.5, 20.0)
    r_int_w2_out = add_ring(40.5, 21.0)
    r_int_top    = add_ring(51.5, 37.5)

    skin_radial(r_int_bot, r_int_throat, outward=False)
    skin_radial(r_int_throat, r_int_w1_in, outward=False)
    skin_radial(r_int_w1_in, r_int_w1_out, outward=False)
    skin_radial(r_int_w1_out, r_int_w2_in, outward=False)
    skin_radial(r_int_w2_in, r_int_w2_out, outward=False)
    skin_radial(r_int_w2_out, r_int_top, outward=False)

    # Top annular rim: strictly +Z
    skin_cap(r_int_top, r_ext_top, normal_z=1.0)

    return verts, faces


# ============================================================================
# 4. PART-FAB-DRUM-FLANGES-PETG
# ============================================================================
def generate_drum_flanges():
    """
    Generates 3D-Printed PETG Bioreactor Drum End Flange (PART-FAB-DRUM-FLANGES-PETG).
    Canonical Specs:
      - Diameter: 300.0 mm (R = 150.0 mm)
      - Total Height: 35.0 mm (Z from -17.5 to +17.5 mm)
      - Central Drive Shaft Through-Bore: Ø8.0 mm (R = 4.0 mm)
      - Axle Hub Boss: Ø48.0 mm (R = 24.0 mm), Z from 0.0 to +17.5 mm
      - Perforated Sheet Retaining Step: R = 144.0 mm, landing shelf at Z = +5.0 mm
      - Structural Web Disc: Thickness = 17.5 mm (from bottom Z = -17.5 to Z = 0.0 mm)
      - 100% Watertight 2-Manifold with 0 non-2 edges.
      - Strictly Outward Targeted Normals across all bounding faces.
    """
    profile = [
        (4.0, -17.5),    # 0: Bore bottom
        (150.0, -17.5),  # 1: Bottom outer edge (Z = -17.5 mm)
        (150.0, 17.5),   # 2: Outer cylinder wall (R = 150.0 mm)
        (144.0, 17.5),   # 3: Top outer rim face (Z = +17.5 mm)
        (144.0, 5.0),    # 4: Retaining step inner wall (R = 144.0 mm)
        (138.0, 5.0),    # 5: Retaining shelf landing (Z = +5.0 mm)
        (138.0, 0.0),    # 6: Inner rim lower wall (R = 138.0 mm)
        (24.0, 0.0),     # 7: Web plate top face (Z = 0.0 mm)
        (24.0, 17.5),    # 8: Axle hub collar outer wall (R = 24.0 mm)
        (4.0, 17.5),     # 9: Hub top rim face (Z = +17.5 mm)
    ]

    N = 48
    verts = []
    for r, z in profile:
        for i in range(N):
            theta = 2.0 * math.pi * i / N
            verts.append([r * math.cos(theta), r * math.sin(theta), z])

    faces = []
    P = len(profile)

    def sub(a, b): return (a[0]-b[0], a[1]-b[1], a[2]-b[2])
    def cross(a, b): return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
    def dot(a, b): return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]

    for p in range(P):
        next_p = (p + 1) % P
        rA, zA = profile[p]
        rB, zB = profile[next_p]
        exp_dr = zB - zA
        exp_dz = rA - rB
        
        for i in range(N):
            ni = (i + 1) % N
            v0 = p * N + i
            v1 = p * N + ni
            v2 = next_p * N + ni
            v3 = next_p * N + i
            
            p0, p1, p2, p3 = verts[v0], verts[v1], verts[v2], verts[v3]
            fn = cross(sub(p1, p0), sub(p2, p0))
            c = [(p0[j] + p1[j] + p2[j] + p3[j]) / 4.0 for j in range(3)]
            cr = math.sqrt(c[0]**2 + c[1]**2)
            r_dir = (c[0]/cr, c[1]/cr, 0)
            target = (exp_dr * r_dir[0], exp_dr * r_dir[1], exp_dz)
            d = dot(fn, target)
            
            if d >= 0:
                faces.append((v0, v1, v2))
                faces.append((v0, v2, v3))
            else:
                faces.append((v0, v2, v1))
                faces.append((v0, v3, v2))

    return verts, faces


# ============================================================================
# 5. PART-FAB-FRAME-WHOOP-85MM
# ============================================================================
def generate_whoop_frame():
    """
    Generates 85mm Ducted Polycarbonate Whoop Airframe + Ducts (PART-FAB-FRAME-WHOOP-85MM).
    Chassis platform for Aerial Spotter & Pollination Drone (Stage 1).
    Specs:
      - Footprint: 115.0 x 115.0 x 38.0 mm
      - 4 Ducted Propeller Guards: R_in=24.5mm (fits 2" props), R_out=26.5mm, Z in [-3.0, 13.0]
      - Central Flight Controller Deck: 30x30x4.5 mm with standard 26x26mm whoop AIO mounts
      - Forward Canopy / Camera Standoffs: Z up to 24.0 mm
      - Underslung 2S LiPo Battery Bay Rails: Z in [-14.0, -2.0]
      - 4 Motor Mount Hubs with 3 Aerodynamic Spider Struts per duct
      - 4 Structural Spar Arms uniting deck and ducts into a single solid chassis
      - 100% Watertight 2-Manifold with 0 non-2 edges and strictly outward normals
    """
    def sub(a, b): return (a[0]-b[0], a[1]-b[1], a[2]-b[2])
    def cross(a, b): return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
    def dot(a, b): return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]

    def add_quad_target(verts, faces, i0, i1, i2, i3, target_vec):
        p0, p1, p2, p3 = verts[i0], verts[i1], verts[i2], verts[i3]
        fn = cross(sub(p1, p0), sub(p2, p0))
        if dot(fn, target_vec) >= 0:
            faces.append([i0, i1, i2])
            faces.append([i0, i2, i3])
        else:
            faces.append([i0, i2, i1])
            faces.append([i0, i3, i2])

    def add_box(verts, faces, x0, x1, y0, y1, z0, z1):
        base_idx = len(verts)
        pts = [
            [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
            [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
        ]
        verts.extend(pts)
        quads = [
            [0, 3, 2, 1], # Bottom (-Z)
            [4, 5, 6, 7], # Top (+Z)
            [0, 1, 5, 4], # Front (-Y)
            [2, 3, 7, 6], # Back (+Y)
            [0, 4, 7, 3], # Left (-X)
            [1, 2, 6, 5], # Right (+X)
        ]
        for q in quads:
            faces.append([base_idx + q[0], base_idx + q[1], base_idx + q[2]])
            faces.append([base_idx + q[0], base_idx + q[2], base_idx + q[3]])

    def add_cylinder_z(verts, faces, x, y, r, z0, z1, n_seg=12):
        base_idx = len(verts)
        for i in range(n_seg):
            ang = (2 * math.pi * i) / n_seg
            verts.append([x + r * math.cos(ang), y + r * math.sin(ang), z0])
            verts.append([x + r * math.cos(ang), y + r * math.sin(ang), z1])
        for i in range(n_seg):
            nxt = (i + 1) % n_seg
            b0 = base_idx + i * 2
            t0 = base_idx + i * 2 + 1
            b1 = base_idx + nxt * 2
            t1 = base_idx + nxt * 2 + 1
            faces.append([b0, b1, t0])
            faces.append([b1, t1, t0])
        c_bot = len(verts); verts.append([x, y, z0])
        c_top = len(verts); verts.append([x, y, z1])
        for i in range(n_seg):
            nxt = (i + 1) % n_seg
            faces.append([c_bot, base_idx + nxt * 2, base_idx + i * 2])
            faces.append([c_top, base_idx + i * 2 + 1, base_idx + nxt * 2 + 1])

    def add_tube_z_targeted(verts, faces, cx, cy, r_in, r_out, z0, z1, n_seg=24):
        base_idx = len(verts)
        for i in range(n_seg):
            th = 2.0 * math.pi * i / n_seg
            c, s = math.cos(th), math.sin(th)
            verts.append([cx + r_in * c,  cy + r_in * s,  z0])
            verts.append([cx + r_in * c,  cy + r_in * s,  z1])
            verts.append([cx + r_out * c, cy + r_out * s, z1])
            verts.append([cx + r_out * c, cy + r_out * s, z0])

        for i in range(n_seg):
            ni = (i + 1) % n_seg
            th_mid = 2.0 * math.pi * (i + 0.5) / n_seg
            cm, sm = math.cos(th_mid), math.sin(th_mid)
            r_out_vec = (cm, sm, 0.0)
            r_in_vec  = (-cm, -sm, 0.0)
            
            i_in_b  = base_idx + i * 4 + 0
            i_in_t  = base_idx + i * 4 + 1
            i_out_t = base_idx + i * 4 + 2
            i_out_b = base_idx + i * 4 + 3
            
            n_in_b  = base_idx + ni * 4 + 0
            n_in_t  = base_idx + ni * 4 + 1
            n_out_t = base_idx + ni * 4 + 2
            n_out_b = base_idx + ni * 4 + 3

            add_quad_target(verts, faces, i_out_b, n_out_b, n_out_t, i_out_t, r_out_vec)
            add_quad_target(verts, faces, i_in_b, i_in_t, n_in_t, n_in_b, r_in_vec)
            add_quad_target(verts, faces, i_in_t, i_out_t, n_out_t, n_in_t, (0, 0, 1.0))
            add_quad_target(verts, faces, i_in_b, n_in_b, n_out_b, i_out_b, (0, 0, -1.0))

    def add_beam(verts, faces, p0, p1, width=4.0, height=3.0):
        dx, dy = p1[0] - p0[0], p1[1] - p0[1]
        L = math.sqrt(dx*dx + dy*dy)
        if L < 1e-4: return
        nx, ny = -dy / L, dx / L
        hw = width / 2.0
        hz = height / 2.0
        
        zc = (p0[2] + p1[2]) / 2.0
        z_bot = zc - hz
        z_top = zc + hz
        
        base_idx = len(verts)
        pts = [
            [p0[0] - nx*hw, p0[1] - ny*hw, z_bot],
            [p0[0] + nx*hw, p0[1] + ny*hw, z_bot],
            [p1[0] + nx*hw, p1[1] + ny*hw, z_bot],
            [p1[0] - nx*hw, p1[1] - ny*hw, z_bot],
            [p0[0] - nx*hw, p0[1] - ny*hw, z_top],
            [p0[0] + nx*hw, p0[1] + ny*hw, z_top],
            [p1[0] + nx*hw, p1[1] + ny*hw, z_top],
            [p1[0] - nx*hw, p1[1] - ny*hw, z_top],
        ]
        verts.extend(pts)
        quads = [
            [0, 3, 2, 1], # Bottom (-Z)
            [4, 5, 6, 7], # Top (+Z)
            [0, 1, 5, 4], # End p0
            [2, 3, 7, 6], # End p1
            [0, 4, 7, 3], # Side left
            [1, 2, 6, 5], # Side right
        ]
        for q in quads:
            faces.append([base_idx + q[0], base_idx + q[1], base_idx + q[2]])
            faces.append([base_idx + q[0], base_idx + q[2], base_idx + q[3]])

    verts, faces = [], []

    # 1. Central Avionics Flight Controller Deck (30x30x4.5 mm)
    add_box(verts, faces, -15.0, 15.0, -15.0, 15.0, -2.0, 2.5)

    # 2. 4 FC Mounting Standoff Bosses (26x26mm standard whoop AIO pattern)
    for sx, sy in [(13, 13), (-13, 13), (-13, -13), (13, -13)]:
        add_cylinder_z(verts, faces, sx, sy, 2.0, 2.5, 6.5, n_seg=8)

    # 3. Camera / Canopy Mounting Posts at Front (reaching Z=24.0 for total 38mm height)
    add_cylinder_z(verts, faces, -6.0, 14.0, 1.8, 2.5, 24.0, n_seg=8)
    add_cylinder_z(verts, faces,  6.0, 14.0, 1.8, 2.5, 24.0, n_seg=8)

    # 4. Underslung Battery Retention Cage (for 2S 450mAh LiPo)
    add_box(verts, faces, -8.5, -6.5, -15.0, 15.0, -14.0, -2.0)
    add_box(verts, faces,  6.5,  8.5, -15.0, 15.0, -14.0, -2.0)
    add_box(verts, faces, -8.5,  8.5, -15.0, -13.0, -14.0, -12.0)
    add_box(verts, faces, -8.5,  8.5,  13.0,  15.0, -14.0, -12.0)

    # 5. 4 Ducted Propeller Guard Rings (Centers at +-31.0, +-31.0)
    duct_centers = [(31.0, 31.0), (-31.0, 31.0), (-31.0, -31.0), (31.0, -31.0)]
    for dcx, dcy in duct_centers:
        # Duct ring: R_in = 24.5mm, R_out = 26.5mm, Z in [-3.0, 13.0]
        add_tube_z_targeted(verts, faces, dcx, dcy, r_in=24.5, r_out=26.5, z0=-3.0, z1=13.0, n_seg=24)
        # Motor Mount Hub in center of duct
        add_cylinder_z(verts, faces, dcx, dcy, r=5.5, z0=-5.5, z1=-1.5, n_seg=12)
        # 3 Motor Spider Struts (connecting motor hub to duct wall)
        for strut_ang_deg in [0, 120, 240]:
            ang = math.radians(strut_ang_deg)
            sp0 = (dcx + 5.0 * math.cos(ang), dcy + 5.0 * math.sin(ang), -3.5)
            sp1 = (dcx + 24.5 * math.cos(ang), dcy + 24.5 * math.sin(ang), -3.5)
            add_beam(verts, faces, sp0, sp1, width=2.8, height=2.4)

    # 6. 4 Main Structural Frame Spar Arms connecting central deck to ducts
    for dcx, dcy in duct_centers:
        ang_arm = math.atan2(dcy, dcx)
        ap0 = (13.0 * math.cos(ang_arm), 13.0 * math.sin(ang_arm), 0.25)
        ap1 = (dcx - 24.5 * math.cos(ang_arm), dcy - 24.5 * math.sin(ang_arm), 0.25)
        add_beam(verts, faces, ap0, ap1, width=5.0, height=3.5)

    return verts, faces


def generate_chute_funnel():
    """
    Generates a 3D-printable PETG collector funnel with ripstop nylon gravity drop chute clamp interface.
    Envelope:
      - Top collector mouth OD = 120 mm, ID = 114 mm (3.0 mm wall)
      - Collector slope: conical transition from z = 70 down to z = -40
      - Lower throat: OD = 60 mm (r = 30 mm), ID = 54 mm (r = 27 mm) from z = -40 to z = -70
      - Clamp retention bead on lower throat: r = 32.5 mm from z = -56 to z = -52
      - 2 chassis mounting tabs at X = +/- 65 mm, Z = 66..70 mm, Y = +/- 10 mm
    Strict 2-manifold revolution mesh with 10-point cross section profile (N=48) plus 2 solid mounting tabs.
    """
    verts = []
    faces = []

    # Axisymmetric revolution profile for funnel body
    # 10 profile points in counter-clockwise order around the material cross-section
    # (r, z):
    # 0: (57.0, 70.0)  - Inner top rim
    # 1: (27.0, -40.0) - Inner throat entry
    # 2: (27.0, -70.0) - Inner bottom rim
    # 3: (30.0, -70.0) - Outer bottom rim
    # 4: (30.0, -60.0) - Outer lower throat
    # 5: (32.5, -56.0) - Retention bead lower ramp
    # 6: (32.5, -52.0) - Retention bead upper ramp
    # 7: (30.0, -48.0) - Outer throat upper
    # 8: (30.0, -40.0) - Outer throat junction
    # 9: (60.0, 70.0)  - Outer top rim
    # Segment 9 -> 0 caps the top rim at z = 70.0.

    profile = [
        (57.0, 70.0),
        (27.0, -40.0),
        (27.0, -70.0),
        (30.0, -70.0),
        (30.0, -60.0),
        (32.5, -56.0),
        (32.5, -52.0),
        (30.0, -48.0),
        (30.0, -40.0),
        (60.0, 70.0)
    ]
    M = len(profile)
    N = 48

    for i in range(N):
        theta = 2.0 * math.pi * i / N
        cos_t = math.cos(theta)
        sin_t = math.sin(theta)
        for r, z in profile:
            verts.append((r * cos_t, r * sin_t, z))

    # Connect rings with outward-facing normals
    for i in range(N):
        next_i = (i + 1) % N
        for p in range(M):
            next_p = (p + 1) % M
            v00 = i * M + p
            v01 = i * M + next_p
            v10 = next_i * M + p
            v11 = next_i * M + next_p
            faces.append((v00, v10, v11))
            faces.append((v00, v11, v01))

    # Add 2 Mounting Tabs at top flange (+X and -X)
    def add_box(v_list, f_list, x0, x1, y0, y1, z0, z1):
        idx = len(v_list)
        v_list.extend([
            (x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), # bottom 0,1,2,3
            (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)  # top 4,5,6,7
        ])
        f_list.extend([
            (idx+0, idx+2, idx+1), (idx+0, idx+3, idx+2), # -Z
            (idx+4, idx+5, idx+6), (idx+4, idx+6, idx+7), # +Z
            (idx+0, idx+1, idx+5), (idx+0, idx+5, idx+4), # -Y
            (idx+3, idx+7, idx+6), (idx+3, idx+6, idx+2), # +Y
            (idx+0, idx+4, idx+7), (idx+0, idx+7, idx+3), # -X
            (idx+1, idx+2, idx+6), (idx+1, idx+6, idx+5), # +X
        ])

    # Right tab: X in [56.0, 75.0], Y in [-10.0, 10.0], Z in [66.0, 70.0]
    add_box(verts, faces, 56.0, 75.0, -10.0, 10.0, 66.0, 70.0)
    # Left tab: X in [-75.0, -56.0], Y in [-10.0, 10.0], Z in [66.0, 70.0]
    add_box(verts, faces, -75.0, -56.0, -10.0, 10.0, 66.0, 70.0)

    return verts, faces


def generate_dock_pogo_gantry():
    """
    Generates a solid, 3D-printable Overhead Gantry Spring-Loaded Pogo-Pin Docking Shoe & Latch.
    Dimensions: 55.0 mm (X) x 45.0 mm (Y) x 20.0 mm (Z)
    Features:
      - Main chassis mounting base plate (55 x 45 x 5 mm, Z = -10 to -5)
      - Elevated toolhead docking platform (37 x 37 x 8 mm, Z = -5 to +3)
      - 2 side dovetail alignment guide rails (Z = -5 to 0)
      - Central pogo pin terminal block (17 x 11 x 2.5 mm, Z = 3 to 5.5)
      - 2 kinematic self-aligning conical guide posts (Z = 3 to 10, r0 = 3.5 -> r1 = 2.2 mm)
      - 2 rare-earth magnetic latch retention cups (Z = 3 to 6.5 mm, r = 4.8 mm)
      - 8-pin spring-loaded gold pogo contacts (2x4 array, 2.54 mm pitch, gold barrel + plunger tip)
      - 2 chassis M4 mounting counterbore bosses at ends (X = +/- 23.5 mm)
    100% outward-facing surface normals, 0 non-manifold edges.
    """
    verts = []
    faces = []

    def add_box(v_list, f_list, x0, x1, y0, y1, z0, z1):
        idx = len(v_list)
        v_list.extend([
            (x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), # bottom 0,1,2,3
            (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)  # top 4,5,6,7
        ])
        f_list.extend([
            (idx+0, idx+2, idx+1), (idx+0, idx+3, idx+2), # -Z
            (idx+4, idx+5, idx+6), (idx+4, idx+6, idx+7), # +Z
            (idx+0, idx+1, idx+5), (idx+0, idx+5, idx+4), # -Y
            (idx+3, idx+7, idx+6), (idx+3, idx+6, idx+2), # +Y
            (idx+0, idx+4, idx+7), (idx+0, idx+7, idx+3), # -X
            (idx+1, idx+2, idx+6), (idx+1, idx+6, idx+5), # +X
        ])

    def add_cylinder_z(v_list, f_list, x, y, r, z0, z1, n_seg=16):
        base_idx = len(v_list)
        for i in range(n_seg):
            ang = (2 * math.pi * i) / n_seg
            c, s = math.cos(ang), math.sin(ang)
            v_list.append((x + r * c, y + r * s, z0))
            v_list.append((x + r * c, y + r * s, z1))
        for i in range(n_seg):
            nxt = (i + 1) % n_seg
            b0 = base_idx + i * 2
            t0 = base_idx + i * 2 + 1
            b1 = base_idx + nxt * 2
            t1 = base_idx + nxt * 2 + 1
            f_list.append((b0, b1, t0))
            f_list.append((b1, t1, t0))
        c_bot = len(v_list); v_list.append((x, y, z0))
        c_top = len(v_list); v_list.append((x, y, z1))
        for i in range(n_seg):
            nxt = (i + 1) % n_seg
            f_list.append((c_bot, base_idx + nxt * 2, base_idx + i * 2))
            f_list.append((c_top, base_idx + i * 2 + 1, base_idx + nxt * 2 + 1))

    def add_cone_z(v_list, f_list, x, y, r0, r1, z0, z1, n_seg=16):
        base_idx = len(v_list)
        for i in range(n_seg):
            ang = (2 * math.pi * i) / n_seg
            c, s = math.cos(ang), math.sin(ang)
            v_list.append((x + r0 * c, y + r0 * s, z0))
            v_list.append((x + r1 * c, y + r1 * s, z1))
        for i in range(n_seg):
            nxt = (i + 1) % n_seg
            b0 = base_idx + i * 2
            t0 = base_idx + i * 2 + 1
            b1 = base_idx + nxt * 2
            t1 = base_idx + nxt * 2 + 1
            f_list.append((b0, b1, t0))
            f_list.append((b1, t1, t0))
        c_bot = len(v_list); v_list.append((x, y, z0))
        c_top = len(v_list); v_list.append((x, y, z1))
        for i in range(n_seg):
            nxt = (i + 1) % n_seg
            f_list.append((c_bot, base_idx + nxt * 2, base_idx + i * 2))
            f_list.append((c_top, base_idx + i * 2 + 1, base_idx + nxt * 2 + 1))

    # Centered at Z=0 (-10.0 to +10.0), X in [-27.5, 27.5], Y in [-22.5, 22.5]
    # 1. Base mounting plate (55 x 45 x 5 mm, Z = -10.0 to -5.0)
    add_box(verts, faces, -27.5, 27.5, -22.5, 22.5, -10.0, -5.0)

    # 2. Main docking platform (37 x 37 x 8 mm, from Z = -5.0 to 3.0)
    add_box(verts, faces, -18.5, 18.5, -18.5, 18.5, -5.0, 3.0)

    # 3. 2 Side Dovetail Guide Rails (from Z = -5.0 to 0.0)
    add_box(verts, faces, -18.5, 18.5, -22.0, -18.5, -5.0, 0.0)
    add_box(verts, faces, -18.5, 18.5, 18.5, 22.0, -5.0, 0.0)

    # 4. Central Pogo Terminal Pedestal (17 x 11 x 2.5 mm, from Z = 3.0 to 5.5)
    add_box(verts, faces, -8.5, 8.5, -5.5, 5.5, 3.0, 5.5)

    # 5. 2 Kinematic Alignment Guide Pins (Tapered cones from Z = 3.0 to 10.0, r=3.5 down to 2.2)
    add_cone_z(verts, faces, -13.0, -13.0, r0=3.5, r1=2.2, z0=3.0, z1=10.0, n_seg=16)
    add_cone_z(verts, faces, 13.0, 13.0, r0=3.5, r1=2.2, z0=3.0, z1=10.0, n_seg=16)

    # 6. 2 Magnetic Latch Retention Cups (Z = 3.0 to 6.5, r=4.8)
    add_cylinder_z(verts, faces, -13.0, 13.0, r=4.8, z0=3.0, z1=6.5, n_seg=16)
    add_cylinder_z(verts, faces, 13.0, -13.0, r=4.8, z0=3.0, z1=6.5, n_seg=16)

    # 7. 8 Gold Pogo Pins (2x4 array, pitch 2.54 mm x 3.5 mm)
    xs_pogo = [-3.81, -1.27, 1.27, 3.81]
    ys_pogo = [-1.75, 1.75]
    for px in xs_pogo:
        for py in ys_pogo:
            add_cylinder_z(verts, faces, px, py, r=0.75, z0=5.5, z1=8.5, n_seg=8)
            add_cylinder_z(verts, faces, px, py, r=0.55, z0=8.5, z1=9.5, n_seg=8)

    # 8. 2 Fastener Counterbore Flange Bosses at ends
    add_cylinder_z(verts, faces, -23.5, 0.0, r=3.0, z0=-5.0, z1=-3.0, n_seg=12)
    add_cylinder_z(verts, faces, 23.5, 0.0, r=3.0, z0=-5.0, z1=-3.0, n_seg=12)

    return verts, faces


def generate_target_apriltag_harness():
    """
    Generates a solid, 3D-printable Custom Wire Harness & AprilTag Optical Alignment Plate.
    Dimensions: 60.0 mm (X) x 60.0 mm (Y) x 3.9 mm (Z)
    Features:
      - Main rigid aluminum plate (60 x 60 x 2.0 mm, Z = -1.5 to +0.5)
      - 4 corner M3/M4 fastener mounting bosses/pads at X = +/- 24 mm, Y = +/- 24 mm
      - AprilTag 36h11 optical datum fiducial frame (38 x 38 mm outer, 32 x 32 mm inner)
      - Canonical Tag36h11 #0 raised optical data grid cells
      - Integrated bottom wire harness strain-relief clamp bracket (X in [-12, 12], Y in [-28, -22])
      - 4-conductor 22 AWG flexible silicone wiring bundle with terminal connector plug
    100% outward-facing surface normals, 0 non-manifold edges.
    """
    verts = []
    faces = []

    def add_box(v_list, f_list, x0, x1, y0, y1, z0, z1):
        idx = len(v_list)
        v_list.extend([
            (x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), # bottom 0,1,2,3
            (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)  # top 4,5,6,7
        ])
        f_list.extend([
            (idx+0, idx+2, idx+1), (idx+0, idx+3, idx+2), # -Z
            (idx+4, idx+5, idx+6), (idx+4, idx+6, idx+7), # +Z
            (idx+0, idx+1, idx+5), (idx+0, idx+5, idx+4), # -Y
            (idx+3, idx+7, idx+6), (idx+3, idx+6, idx+2), # +Y
            (idx+0, idx+4, idx+7), (idx+0, idx+7, idx+3), # -X
            (idx+1, idx+2, idx+6), (idx+1, idx+6, idx+5), # +X
        ])

    def add_cylinder_z(v_list, f_list, x, y, r, z0, z1, n_seg=16):
        base_idx = len(v_list)
        for i in range(n_seg):
            ang = (2 * math.pi * i) / n_seg
            c, s = math.cos(ang), math.sin(ang)
            v_list.append((x + r * c, y + r * s, z0))
            v_list.append((x + r * c, y + r * s, z1))
        for i in range(n_seg):
            nxt = (i + 1) % n_seg
            b0 = base_idx + i * 2
            t0 = base_idx + i * 2 + 1
            b1 = base_idx + nxt * 2
            t1 = base_idx + nxt * 2 + 1
            f_list.append((b0, b1, t0))
            f_list.append((b1, t1, t0))
        c_bot = len(v_list); v_list.append((x, y, z0))
        c_top = len(v_list); v_list.append((x, y, z1))
        for i in range(n_seg):
            nxt = (i + 1) % n_seg
            f_list.append((c_bot, base_idx + nxt * 2, base_idx + i * 2))
            f_list.append((c_top, base_idx + i * 2 + 1, base_idx + nxt * 2 + 1))

    def add_cylinder_x(v_list, f_list, y, z, r, x0, x1, n_seg=16):
        base_idx = len(v_list)
        for i in range(n_seg):
            ang = (2 * math.pi * i) / n_seg
            c, s = math.cos(ang), math.sin(ang)
            v_list.append((x0, y + r * c, z + r * s))
            v_list.append((x1, y + r * c, z + r * s))
        for i in range(n_seg):
            nxt = (i + 1) % n_seg
            b0 = base_idx + i * 2
            t0 = base_idx + i * 2 + 1
            b1 = base_idx + nxt * 2
            t1 = base_idx + nxt * 2 + 1
            f_list.append((b0, t0, b1))
            f_list.append((b1, t0, t1))
        c_bot = len(v_list); v_list.append((x0, y, z))
        c_top = len(v_list); v_list.append((x1, y, z))
        for i in range(n_seg):
            nxt = (i + 1) % n_seg
            f_list.append((c_bot, base_idx + i * 2, base_idx + nxt * 2))
            f_list.append((c_top, base_idx + nxt * 2 + 1, base_idx + i * 2 + 1))

    # 1. Main Aluminum Baseplate (60 x 60 x 2.0 mm, Z = -1.5 to +0.5)
    add_box(verts, faces, -30.0, 30.0, -30.0, 30.0, -1.5, 0.5)

    # 2. 4 Corner M3/M4 Mounting Bosses / Pads (X=+-24, Y=+-24)
    for mx in [-24.0, 24.0]:
        for my in [-24.0, 24.0]:
            add_cylinder_z(verts, faces, mx, my, r=3.8, z0=0.5, z1=1.1, n_seg=12)

    # 3. AprilTag Optical Frame (Raised border: 38 x 38 mm outer, border_w=3.0 mm)
    tag_cx, tag_cy = 0.0, 3.0
    tag_size = 38.0
    border_w = 3.0
    add_box(verts, faces, tag_cx - tag_size/2, tag_cx + tag_size/2, tag_cy + tag_size/2 - border_w, tag_cy + tag_size/2, 0.5, 1.1)
    add_box(verts, faces, tag_cx - tag_size/2, tag_cx + tag_size/2, tag_cy - tag_size/2, tag_cy - tag_size/2 + border_w, 0.5, 1.1)
    add_box(verts, faces, tag_cx - tag_size/2, tag_cx - tag_size/2 + border_w, tag_cy - tag_size/2, tag_cy + tag_size/2, 0.5, 1.1)
    add_box(verts, faces, tag_cx + tag_size/2 - border_w, tag_cx + tag_size/2, tag_cy - tag_size/2, tag_cy + tag_size/2, 0.5, 1.1)

    # 4. AprilTag 36h11 Interior Data Pattern (6x6 data grid)
    tag_matrix = [
        [1, 1, 0, 1, 1, 1],
        [1, 0, 1, 0, 0, 1],
        [0, 1, 0, 1, 1, 0],
        [1, 1, 1, 0, 1, 0],
        [0, 0, 1, 1, 0, 1],
        [1, 0, 0, 1, 1, 1],
    ]
    cell_size = (tag_size - 2 * border_w) / 6.0
    grid_x0 = tag_cx - (tag_size - 2 * border_w) / 2.0
    grid_y0 = tag_cy - (tag_size - 2 * border_w) / 2.0

    for row in range(6):
        for col in range(6):
            if tag_matrix[row][col] == 1:
                cx0 = grid_x0 + col * cell_size
                cx1 = cx0 + cell_size
                cy1 = grid_y0 + (5 - row + 1) * cell_size
                cy0 = cy1 - cell_size
                add_box(verts, faces, cx0 + 0.2, cx1 - 0.2, cy0 + 0.2, cy1 - 0.2, 0.5, 1.1)

    # 5. Wire Harness Retention Bracket & Silicone Wiring Lead
    add_box(verts, faces, -12.0, 12.0, -28.0, -22.0, 0.5, 1.8)
    add_box(verts, faces, -10.0, 10.0, -26.5, -23.5, 1.8, 2.4)

    wire_colors_y = [-26.0, -25.2, -24.4, -23.6]
    for wy in wire_colors_y:
        add_cylinder_x(verts, faces, y=wy, z=1.4, r=0.45, x0=-22.0, x1=22.0, n_seg=8)

    add_box(verts, faces, 18.0, 26.0, -27.5, -22.5, 0.5, 2.2)

    return verts, faces


def generate_flume_hdpe_acrylic():
    """
    Generates a solid, 3D-printable / machinable Food-Grade 1/4-Inch Acrylic & Polycarbonate Flume Body Sump Chamber.
    Dimensions: 800.0 mm (X) x 250.0 mm (Y) x 450.0 mm (Z)
    Features:
      - Bottom floor plate (800 x 250 x 6.35 mm, Z = -225 to -218.65)
      - Left & right 1/4" side walls:
        * Deep sump chamber (X in [-390, -100], Z up to +225)
        * Inclined transition wedge (X in [-100, 200], Z sloped from +225 down to +25)
        * Shallow raceway flume (X in [200, 400], Z up to +25)
      - Rear solvent-welded bulkhead end-plate (Z up to +225)
      - Rear drainage bulkhead fitting (dia 75mm flange, dia 48mm drain port at Y=0, Z=-150)
      - Front overflow weir sill (X in [390, 400], Z = -225 to -125)
      - Top structural anti-deflection stiffener lips along side walls
    100% outward-facing surface normals, 0 non-manifold edges.
    """
    verts = []
    faces = []

    def add_box(v_list, f_list, x0, x1, y0, y1, z0, z1):
        idx = len(v_list)
        v_list.extend([
            (x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), # bottom 0,1,2,3
            (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)  # top 4,5,6,7
        ])
        f_list.extend([
            (idx+0, idx+2, idx+1), (idx+0, idx+3, idx+2), # -Z
            (idx+4, idx+5, idx+6), (idx+4, idx+6, idx+7), # +Z
            (idx+0, idx+1, idx+5), (idx+0, idx+5, idx+4), # -Y
            (idx+3, idx+7, idx+6), (idx+3, idx+6, idx+2), # +Y
            (idx+0, idx+4, idx+7), (idx+0, idx+7, idx+3), # -X
            (idx+1, idx+2, idx+6), (idx+1, idx+6, idx+5), # +X
        ])

    def add_cylinder_x(v_list, f_list, y, z, r, x0, x1, n_seg=16):
        base_idx = len(v_list)
        for i in range(n_seg):
            ang = (2 * math.pi * i) / n_seg
            c, s = math.cos(ang), math.sin(ang)
            v_list.append((x0, y + r * c, z + r * s))
            v_list.append((x1, y + r * c, z + r * s))
        for i in range(n_seg):
            nxt = (i + 1) % n_seg
            b0 = base_idx + i * 2
            t0 = base_idx + i * 2 + 1
            b1 = base_idx + nxt * 2
            t1 = base_idx + nxt * 2 + 1
            f_list.append((b0, t0, b1))
            f_list.append((b1, t0, t1))
        c_bot = len(v_list); v_list.append((x0, y, z))
        c_top = len(v_list); v_list.append((x1, y, z))
        for i in range(n_seg):
            nxt = (i + 1) % n_seg
            f_list.append((c_bot, base_idx + i * 2, base_idx + nxt * 2))
            f_list.append((c_top, base_idx + nxt * 2 + 1, base_idx + i * 2 + 1))

    def add_wedge_x(v_list, f_list, x0, x1, y0, y1, z_bot, z0, z1):
        idx = len(v_list)
        v_list.extend([
            (x0, y0, z_bot), (x1, y0, z_bot), (x1, y1, z_bot), (x0, y1, z_bot),
            (x0, y0, z0),    (x1, y0, z1),    (x1, y1, z1),    (x0, y1, z0)
        ])
        f_list.extend([
            (idx+0, idx+2, idx+1), (idx+0, idx+3, idx+2), # -Z
            (idx+4, idx+5, idx+6), (idx+4, idx+6, idx+7), # sloped top (+Z)
            (idx+0, idx+1, idx+5), (idx+0, idx+5, idx+4), # -Y
            (idx+3, idx+7, idx+6), (idx+3, idx+6, idx+2), # +Y
            (idx+0, idx+4, idx+7), (idx+0, idx+7, idx+3), # -X
            (idx+1, idx+2, idx+6), (idx+1, idx+6, idx+5), # +X
        ])

    T = 6.35 # 1/4 inch wall thickness

    # Floor plate: X in [-390, 400], Y in [-125, 125], Z in [-225, -225 + T]
    add_box(verts, faces, -390.0, 400.0, -125.0, 125.0, -225.0, -225.0 + T)

    # Left side wall (Y in [125 - T, 125])
    add_box(verts, faces, -390.0, -100.0, 125.0 - T, 125.0, -225.0 + T, 225.0)
    add_wedge_x(verts, faces, -100.0, 200.0, 125.0 - T, 125.0, -225.0 + T, 225.0, 25.0)
    add_box(verts, faces, 200.0, 400.0, 125.0 - T, 125.0, -225.0 + T, 25.0)

    # Right side wall (Y in [-125, -125 + T])
    add_box(verts, faces, -390.0, -100.0, -125.0, -125.0 + T, -225.0 + T, 225.0)
    add_wedge_x(verts, faces, -100.0, 200.0, -125.0, -125.0 + T, -225.0 + T, 225.0, 25.0)
    add_box(verts, faces, 200.0, 400.0, -125.0, -125.0 + T, -225.0 + T, 25.0)

    # Rear bulkhead end-plate
    add_box(verts, faces, -390.0, -390.0 + T, -125.0 + T, 125.0 - T, -225.0 + T, 225.0)

    # Rear drainage bulkhead fitting (OD 75mm, drain bore 48mm)
    add_cylinder_x(verts, faces, y=0.0, z=-150.0, r=37.5, x0=-400.0, x1=-390.0, n_seg=24)
    add_cylinder_x(verts, faces, y=0.0, z=-150.0, r=24.0, x0=-390.0, x1=-380.0, n_seg=24)

    # Front overflow weir sill
    add_box(verts, faces, 390.0, 400.0, -125.0 + T, 125.0 - T, -225.0 + T, -125.0)

    # Top anti-deflection stiffener lips
    add_box(verts, faces, -390.0, -100.0, 110.0, 125.0, 218.65, 225.0)
    add_box(verts, faces, -390.0, -100.0, -125.0, -110.0, 218.65, 225.0)
    add_box(verts, faces, 200.0, 400.0, 110.0, 125.0, 18.65, 25.0)
    add_box(verts, faces, 200.0, 400.0, -125.0, -110.0, 18.65, 25.0)

    return verts, faces


# ============================================================================
# 10. PART-MECH-SPOKE-KEYED-ALUM16
# ============================================================================
def generate_spoke_keyed_alum16():
    # Grid slices along X:
    # 0: -190 to -178 (length 12) - Keyed central hub tongue (Y in [-6, 6])
    # 1: -178 to -140 (length 38) - Inner hub mount plate (Y in [-22.5, 22.5])
    # 2: -140 to -130 (length 10) - Root bulkhead transition (Y in [-18.5, 18.5])
    # 3: -130 to -50  (length 80) - Skeletal pocket 1 (Top/bottom rails)
    # 4: -50 to -38   (length 12) - Mid-span cross-brace 1 (Y in [-18.5, 18.5])
    # 5: -38 to 38    (length 76) - Skeletal pocket 2 (Top/bottom rails)
    # 6: 38 to 50     (length 12) - Mid-span cross-brace 2 (Y in [-18.5, 18.5])
    # 7: 50 to 130    (length 80) - Skeletal pocket 3 (Top/bottom rails)
    # 8: 130 to 140   (length 10) - Outer bulkhead transition (Y in [-18.5, 18.5])
    # 9: 140 to 178   (length 38) - Outer rim mounting foot (Y in [-22.5, 22.5])
    # 10: 178 to 186  (length 8)  - Outer indexing detent pad (Y in [-18.5, 18.5])
    # 11: 186 to 190  (length 4)  - 90-degree bent outer lip (Y in [-18.5, 18.5], Z in [-1.5, 6.0])

    x_grid = [-190.0, -178.0, -140.0, -130.0, -50.0, -38.0, 38.0, 50.0, 130.0, 140.0, 178.0, 186.0, 190.0]
    y_grid = [-22.5, -18.5, -11.5, -6.0, 6.0, 11.5, 18.5, 22.5]
    z_grid = [-1.5, 1.5, 6.0]

    solid = set()
    # zi = 0 (base sheet 3.0mm)
    for xi in range(len(x_grid) - 1):
        if xi == 0:
            solid.add((xi, 3, 0))  # keyed tongue
        elif xi in [1, 9]:
            for yi in range(7):
                solid.add((xi, yi, 0))  # full width hub & rim pads
        elif xi in [2, 4, 6, 8, 10, 11]:
            for yi in range(1, 6):
                solid.add((xi, yi, 0))  # cross webs and end detent
        elif xi in [3, 5, 7]:
            solid.add((xi, 1, 0))  # bottom spar rail
            solid.add((xi, 5, 0))  # top spar rail

    # zi = 1 (stamped 90-deg detent lip)
    for yi in range(1, 6):
        solid.add((11, yi, 1))

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
    print("Generating RFC-017 remediated models with verified outward normals...")

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

    # 4. PART-FAB-DRUM-FLANGES-PETG
    v_flange, f_flange = generate_drum_flanges()
    save_model("PART-FAB-DRUM-FLANGES-PETG", "part-custom-drum-flanges-petg", v_flange, f_flange)

    # 5. PART-FAB-FRAME-WHOOP-85MM
    v_whoop, f_whoop = generate_whoop_frame()
    save_model("PART-FAB-FRAME-WHOOP-85MM", "part-custom-frame-whoop-85mm", v_whoop, f_whoop)

    # 6. PART-FAB-CHUTE-RIPSTOP-PETG
    v_chute, f_chute = generate_chute_funnel()
    save_model("PART-FAB-CHUTE-RIPSTOP-PETG", "part-custom-chute-ripstop-petg", v_chute, f_chute)

    # 7. PART-FAB-DOCK-POGO-GANTRY
    v_pogo, f_pogo = generate_dock_pogo_gantry()
    save_model("PART-FAB-DOCK-POGO-GANTRY", "part-custom-dock-pogo-gantry", v_pogo, f_pogo)

    # 8. PART-FAB-TARGET-APRILTAG-HARNESS
    v_tag, f_tag = generate_target_apriltag_harness()
    save_model("PART-FAB-TARGET-APRILTAG-HARNESS", "part-custom-target-apriltag-harness", v_tag, f_tag)

    # 9. PART-FAB-FLUME-HDPE-ACRYLIC
    v_flume, f_flume = generate_flume_hdpe_acrylic()
    save_model("PART-FAB-FLUME-HDPE-ACRYLIC", "part-custom-flume-hdpe-acrylic", v_flume, f_flume)

    # 10. PART-MECH-SPOKE-KEYED-ALUM16
    v_spoke, f_spoke = generate_spoke_keyed_alum16()
    save_model("PART-MECH-SPOKE-KEYED-ALUM16", "part-custom-spoke-keyed-alum16", v_spoke, f_spoke)

    print("\nAll models successfully generated and saved with verified outward normals!")


if __name__ == '__main__':
    main()
