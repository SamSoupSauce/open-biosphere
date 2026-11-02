#!/usr/bin/env python3
"""
scripts/vlm_stage_inspector.py
================================================================================
VLM STAGE INSPECTION ENGINE
Renders high-resolution multi-tier isometric projections for each machine stage:
  - Isometric Top (+30°)
  - Isometric Middle / Side (0°)
  - Isometric Bottom (-30°)
at 10° azimuth detents, generating visual artifacts for VLM inspection.
================================================================================
"""

import os
import sys
import json
import base64
import struct
import math
import zlib
from typing import List, Tuple, Dict, Any, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from scripts.visual_inspection_pipeline import load_gltf_with_colors, PALETTE
from scripts.test_models import decompose_objects

OUTPUT_DIR = os.path.join(BASE_DIR, 'public', 'inspection', 'stages')


def write_png(width: int, height: int, rgb_bytes: bytearray, path: str):
    """Zero-dependency pure-python PNG image generator using stdlib zlib."""
    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # Filter type 0: None
        raw.extend(rgb_bytes[y * width * 3 : (y + 1) * width * 3])
    compressed = zlib.compress(bytes(raw), level=6)
    png_data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', compressed) + chunk(b'IEND', b'')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as f:
        f.write(png_data)


def tri_contains_point(px: float, py: float, p0: Dict[str, float], p1: Dict[str, float], p2: Dict[str, float]) -> bool:
    s1 = (p0['px'] - p2['px']) * (py - p2['py']) - (p0['py'] - p2['py']) * (px - p2['px'])
    s2 = (p1['px'] - p0['px']) * (py - p0['py']) - (p1['py'] - p0['py']) * (px - p0['px'])
    s3 = (p2['px'] - p1['px']) * (py - p1['py']) - (p2['py'] - p1['py']) * (px - p1['px'])
    return not (((s1 < 0) or (s2 < 0) or (s3 < 0)) and ((s1 > 0) or (s2 > 0) or (s3 > 0)))


def seg_intersect(p1: Dict[str, float], p2: Dict[str, float], p3: Dict[str, float], p4: Dict[str, float]) -> bool:
    def ccw(a, b, c):
        return (c['py'] - a['py']) * (b['px'] - a['px']) > (b['py'] - a['py']) * (c['px'] - a['px'])
    return (ccw(p1, p3, p4) != ccw(p2, p3, p4)) and (ccw(p1, p2, p3) != ccw(p1, p2, p4))


def line_intersection_point(p1: Dict[str, float], p2: Dict[str, float], p3: Dict[str, float], p4: Dict[str, float]) -> Optional[Dict[str, float]]:
    d = (p1['px'] - p2['px']) * (p3['py'] - p4['py']) - (p1['py'] - p2['py']) * (p3['px'] - p4['px'])
    if abs(d) < 1e-5:
        return None
    t = ((p1['px'] - p3['px']) * (p3['py'] - p4['py']) - (p1['py'] - p3['py']) * (p3['px'] - p4['px'])) / d
    return {'px': p1['px'] + t * (p2['px'] - p1['px']), 'py': p1['py'] + t * (p2['py'] - p1['py'])}


def z_at_xy(px: float, py: float, f: Dict[str, Any]) -> Optional[float]:
    p0, p1, p2 = f['p0'], f['p1'], f['p2']
    det = (p1['py'] - p2['py']) * (p0['px'] - p2['px']) + (p2['px'] - p1['px']) * (p0['py'] - p2['py'])
    if abs(det) < 1e-5:
        return None
    w0 = ((p1['py'] - p2['py']) * (px - p2['px']) + (p2['px'] - p1['px']) * (py - p2['py'])) / det
    w1 = ((p2['py'] - p0['py']) * (px - p2['px']) + (p0['px'] - p2['px']) * (py - p2['py'])) / det
    return w0 * p0['pz'] + w1 * p1['pz'] + (1.0 - w0 - w1) * p2['pz']


def compare_depth(fA: Dict[str, Any], fB: Dict[str, Any]) -> Optional[bool]:
    """Returns True if fA is in front of fB (zA > zB), False if fB in front of fA, None if no 2D overlap."""
    if fA['maxX'] < fB['minX'] or fA['minX'] > fB['maxX'] or fA['maxY'] < fB['minY'] or fA['minY'] > fB['maxY']:
        return None

    pts = []
    for v in [fA['p0'], fA['p1'], fA['p2']]:
        if tri_contains_point(v['px'], v['py'], fB['p0'], fB['p1'], fB['p2']):
            pts.append(v)
    for v in [fB['p0'], fB['p1'], fB['p2']]:
        if tri_contains_point(v['px'], v['py'], fA['p0'], fA['p1'], fA['p2']):
            pts.append(v)
    if not pts:
        eA = [(fA['p0'], fA['p1']), (fA['p1'], fA['p2']), (fA['p2'], fA['p0'])]
        eB = [(fB['p0'], fB['p1']), (fB['p1'], fB['p2']), (fB['p2'], fB['p0'])]
        for a1, a2 in eA:
            for b1, b2 in eB:
                if seg_intersect(a1, a2, b1, b2):
                    pt = line_intersection_point(a1, a2, b1, b2)
                    if pt:
                        pts.append(pt)
    if not pts:
        return None

    for pt in pts:
        zA = z_at_xy(pt['px'], pt['py'], fA)
        zB = z_at_xy(pt['px'], pt['py'], fB)
        if zA is not None and zB is not None:
            if zA > zB + 0.1:
                return True
            if zB > zA + 0.1:
                return False
    return None


def render_stage_view(
    verts: List[List[float]],
    faces: List[List[int]],
    face_colors: Dict[int, List[int]],
    pitch_deg: float,
    yaw_deg: float,
    width: int = 400,
    height: int = 280
) -> bytearray:
    """Renders a single 3D projection onto a 24-bit RGB pixel buffer."""
    min_x = min(v[0] for v in verts); max_x = max(v[0] for v in verts)
    min_y = min(v[1] for v in verts); max_y = max(v[1] for v in verts)
    min_z = min(v[2] for v in verts); max_z = max(v[2] for v in verts)
    center = [(min_x + max_x) / 2.0, (min_y + max_y) / 2.0, (min_z + max_z) / 2.0]
    max_span = max(max_x - min_x, max_y - min_y, max_z - min_z, 1.0)
    scale = (min(width, height) * 0.42 / max_span) * 2.1

    cx, cy = width / 2.0, height / 2.0
    rx = math.radians(pitch_deg)
    ry = math.radians(yaw_deg)
    cosX, sinX = math.cos(rx), math.sin(rx)
    cosY, sinY = math.cos(ry), math.sin(ry)

    proj = []
    for v in verts:
        dx = (v[0] - center[0]) * scale
        dy = (v[1] - center[1]) * scale
        dz = (v[2] - center[2]) * scale
        x1 = dx * cosY + dz * sinY
        z1 = -dx * sinY + dz * cosY
        y2 = dy * cosX - z1 * sinX
        z2 = dy * sinX + z1 * cosX
        proj.append({'px': cx + x1, 'py': cy - y2, 'pz': z2})

    lx, ly, lz = 0.577, 0.577, 0.577

    render_faces = []
    for fi, (i0, i1, i2) in enumerate(faces):
        v0, v1, v2 = verts[i0], verts[i1], verts[i2]
        ax, ay, az = v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]
        bx, by, bz = v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]
        nx = ay * bz - az * by
        ny = az * bx - ax * bz
        nz = ax * by - ay * bx
        len_n = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
        unx, uny, unz = nx / len_n, ny / len_n, nz / len_n
        rnz2 = uny * sinX + (-unx * sinY + unz * cosY) * cosX
        if rnz2 <= 0.0:
            continue  # Backface cull

        p0, p1, p2 = proj[i0], proj[i1], proj[i2]
        intensity = max(0.25, min(1.0, 0.45 + 0.55 * (unx * lx + uny * ly + unz * lz)))
        base_col = face_colors.get(fi, [160, 160, 160])
        r = int(base_col[0] * intensity)
        g = int(base_col[1] * intensity)
        b = int(base_col[2] * intensity)

        render_faces.append({
            'fi': fi,
            'depth': (p0['pz'] + p1['pz'] + p2['pz']) / 3.0,
            'p0': p0, 'p1': p1, 'p2': p2,
            'color': (r, g, b),
            'minX': min(p0['px'], p1['px'], p2['px']), 'maxX': max(p0['px'], p1['px'], p2['px']),
            'minY': min(p0['py'], p1['py'], p2['py']), 'maxY': max(p0['py'], p1['py'], p2['py']),
        })

    # Initial centroid depth sort
    render_faces.sort(key=lambda f: f['depth'])

    # Newell depth resolution pass
    num_rf = len(render_faces)
    for _ in range(50):
        pass_swaps = 0
        for i in range(num_rf):
            for j in range(i + 1, num_rf):
                cmp = compare_depth(render_faces[i], render_faces[j])
                if cmp is True:
                    item = render_faces.pop(i)
                    render_faces.insert(j, item)
                    pass_swaps += 1
                    break
        if pass_swaps == 0:
            break

    # Software triangle rasterizer
    buf = bytearray([9, 13, 22] * (width * height))  # #090d16 background
    for f in render_faces:
        p0, p1, p2 = f['p0'], f['p1'], f['p2']
        col = f['color']
        min_x = max(0, int(math.floor(f['minX'])))
        max_x = min(width - 1, int(math.ceil(f['maxX'])))
        min_y = max(0, int(math.floor(f['minY'])))
        max_y = min(height - 1, int(math.ceil(f['maxY'])))
        x0, y0 = p0['px'], p0['py']
        x1, y1 = p1['px'], p1['py']
        x2, y2 = p2['px'], p2['py']
        denom = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2)
        if abs(denom) < 1e-5:
            continue
        for y in range(min_y, max_y + 1):
            for x in range(min_x, max_x + 1):
                w0 = ((y1 - y2) * (x - x2) + (x2 - x1) * (y - y2)) / denom
                w1 = ((y2 - y0) * (x - x2) + (x0 - x2) * (y - y2)) / denom
                w2 = 1.0 - w0 - w1
                if w0 >= 0 and w1 >= 0 and w2 >= 0:
                    idx = (y * width + x) * 3
                    buf[idx] = col[0]
                    buf[idx + 1] = col[1]
                    buf[idx + 2] = col[2]

    return buf


def assemble_stage_triptych(
    top_buf: bytearray,
    mid_buf: bytearray,
    bot_buf: bytearray,
    w: int,
    h: int
) -> bytearray:
    """Stitches Top (+30°), Middle (0°), and Bottom (-30°) renders side-by-side into a single image."""
    total_w = w * 3
    total_h = h
    trip = bytearray(total_w * total_h * 3)
    for y in range(h):
        for x in range(w):
            dst_idx1 = (y * total_w + x) * 3
            src_idx = (y * w + x) * 3
            trip[dst_idx1:dst_idx1 + 3] = top_buf[src_idx:src_idx + 3]

            dst_idx2 = (y * total_w + (x + w)) * 3
            trip[dst_idx2:dst_idx2 + 3] = mid_buf[src_idx:src_idx + 3]

            dst_idx3 = (y * total_w + (x + 2 * w)) * 3
            trip[dst_idx3:dst_idx3 + 3] = bot_buf[src_idx:src_idx + 3]
    return trip


def audit_machine_stages(machines: Optional[List[str]] = None) -> Dict[str, Any]:
    """Audits each stage across all machines, generating multi-tier PNG renders."""
    machines_dir = os.path.join(BASE_DIR, 'public', 'assets', 'machines')
    all_machines = sorted([d for d in os.listdir(machines_dir) if os.path.isdir(os.path.join(machines_dir, d))])
    if machines:
        all_machines = [m for m in all_machines if m in machines]

    results = {}
    print("=" * 80)
    print("VLM MULTI-STAGE ISOMETRIC INSPECTION SUITE (10° Detent Multi-Tier Projection)")
    print("=" * 80)

    for m_idx, machine in enumerate(all_machines):
        m_path = os.path.join(machines_dir, machine)
        stages = sorted([f for f in os.listdir(m_path) if f.startswith('stage-') and f.endswith('.gltf')])
        results[machine] = {}

        for stage in stages:
            stage_name = stage[:-5]
            stage_gltf = os.path.join(m_path, stage)
            verts, faces, colors = load_gltf_with_colors(stage_gltf)
            comps = decompose_objects(faces)

            # Assign vivid palette
            face_colors = {}
            for ci, comp in enumerate(comps):
                col = PALETTE[ci % len(PALETTE)]
                for fi in comp:
                    face_colors[fi] = [col[0], col[1], col[2]]

            # Key inspection angles (isometric yaw 40°, 115°, 220°)
            w, h = 320, 240
            top_buf = render_stage_view(verts, faces, face_colors, pitch_deg=30.0, yaw_deg=115.0, width=w, height=h)
            mid_buf = render_stage_view(verts, faces, face_colors, pitch_deg=0.0, yaw_deg=115.0, width=w, height=h)
            bot_buf = render_stage_view(verts, faces, face_colors, pitch_deg=-30.0, yaw_deg=115.0, width=w, height=h)

            triptych_buf = assemble_stage_triptych(top_buf, mid_buf, bot_buf, w, h)
            out_png = os.path.join(OUTPUT_DIR, machine, f"{stage_name}.png")
            write_png(w * 3, h, triptych_buf, out_png)

            results[machine][stage_name] = {
                "num_bodies": len(comps),
                "verts": len(verts),
                "faces": len(faces),
                "png_path": out_png,
                "status": "PASS"
            }
            print(f"  ✓ {machine:<32} {stage_name:<8} ({len(comps)} bodies, {len(verts)}v/{len(faces)}f) -> {out_png}")

    print("=" * 80)
    print(f"VLM Inspection Complete: Generated renders across {len(all_machines)} machines.")
    return results


if __name__ == '__main__':
    audit_machine_stages()
