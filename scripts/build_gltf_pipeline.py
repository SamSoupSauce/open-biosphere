#!/usr/bin/env python3
"""
scripts/build_gltf_pipeline.py
Automated glTF 2.0 CAD Asset Pipeline for Open Biosphere (RFC-014).
Generates compliant binary glTF (.glb) atomic components, hierarchical
scene graphs referencing sub-models via extras.ref, and synchronizes assets.
"""

import os
import json
import struct
import math
import shutil

BASE_DIR = '/mnt/c/Users/samue/Projects/open-biosphere'
CAD_DIR = os.path.join(BASE_DIR, 'cad')
PUBLIC_CAD_DIR = os.path.join(BASE_DIR, 'public', 'cad')


def build_glb(verts, faces, material_name="PBR_Standard", color=(0.7, 0.75, 0.8, 1.0), metallic=0.7, roughness=0.35):
    """
    Constructs a pristine, standard glTF 2.0 binary (.glb) buffer.
    All geometry is right-handed (+Y Up, +Z Forward).
    """
    if not verts or not faces:
        raise ValueError("Geometry must contain non-empty vertices and faces")

    # Bounding box
    min_x = min(v[0] for v in verts)
    max_x = max(v[0] for v in verts)
    min_y = min(v[1] for v in verts)
    max_y = max(v[1] for v in verts)
    min_z = min(v[2] for v in verts)
    max_z = max(v[2] for v in verts)

    # 1. Index buffer (UNSIGNED_SHORT)
    flat_indices = []
    for f in faces:
        flat_indices.extend([int(f[0]), int(f[1]), int(f[2])])
    index_bytes = struct.pack('<' + 'H' * len(flat_indices), *flat_indices)
    index_pad = (4 - (len(index_bytes) % 4)) % 4
    index_bytes_padded = index_bytes + (b'\x00' * index_pad)

    # 2. Position buffer (FLOAT VEC3)
    flat_verts = []
    for v in verts:
        flat_verts.extend([float(v[0]), float(v[1]), float(v[2])])
    vertex_bytes = struct.pack('<' + 'f' * len(flat_verts), *flat_verts)
    vertex_pad = (4 - (len(vertex_bytes) % 4)) % 4
    vertex_bytes_padded = vertex_bytes + (b'\x00' * vertex_pad)

    bin_data = index_bytes_padded + vertex_bytes_padded

    gltf_json = {
        "asset": {
            "version": "2.0",
            "generator": "OpenBiosphere-ParametricCAD-GLTF (RFC-014)"
        },
        "scene": 0,
        "scenes": [
            {
                "nodes": [0]
            }
        ],
        "nodes": [
            {
                "name": "RootNode",
                "mesh": 0
            }
        ],
        "meshes": [
            {
                "name": "MeshGeometry",
                "primitives": [
                    {
                        "attributes": {
                            "POSITION": 1
                        },
                        "indices": 0,
                        "material": 0,
                        "mode": 4  # TRIANGLES
                    }
                ]
            }
        ],
        "materials": [
            {
                "name": material_name,
                "pbrMetallicRoughness": {
                    "baseColorFactor": list(color),
                    "metallicFactor": float(metallic),
                    "roughnessFactor": float(roughness)
                },
                "doubleSided": True
            }
        ],
        "accessors": [
            {
                # Accessor 0: Indices
                "bufferView": 0,
                "byteOffset": 0,
                "componentType": 5123,  # UNSIGNED_SHORT
                "count": len(flat_indices),
                "type": "SCALAR",
                "max": [max(flat_indices)],
                "min": [min(flat_indices)]
            },
            {
                # Accessor 1: Position
                "bufferView": 1,
                "byteOffset": 0,
                "componentType": 5126,  # FLOAT
                "count": len(verts),
                "type": "VEC3",
                "max": [max_x, max_y, max_z],
                "min": [min_x, min_y, min_z]
            }
        ],
        "bufferViews": [
            {
                # BufferView 0: Indices
                "buffer": 0,
                "byteOffset": 0,
                "byteLength": len(index_bytes),
                "target": 34963  # ELEMENT_ARRAY_BUFFER
            },
            {
                # BufferView 1: Vertices
                "buffer": 0,
                "byteOffset": len(index_bytes_padded),
                "byteLength": len(vertex_bytes),
                "byteStride": 12,
                "target": 34962  # ARRAY_BUFFER
            }
        ],
        "buffers": [
            {
                "byteLength": len(bin_data)
            }
        ]
    }

    json_str = json.dumps(gltf_json, separators=(',', ':'))
    json_bytes = json_str.encode('utf-8')
    json_pad = (4 - (len(json_bytes) % 4)) % 4
    json_bytes_padded = json_bytes + (b' ' * json_pad)

    # GLB Header (12 bytes)
    magic = 0x46546C67  # 'glTF'
    version = 2
    total_length = 12 + 8 + len(json_bytes_padded) + 8 + len(bin_data)

    glb_header = struct.pack('<III', magic, version, total_length)

    # Chunk 0: JSON
    chunk0_header = struct.pack('<II', len(json_bytes_padded), 0x4E4F534A)  # 'JSON'

    # Chunk 1: BIN
    chunk1_header = struct.pack('<II', len(bin_data), 0x004E4942)  # 'BIN\0'

    return glb_header + chunk0_header + json_bytes_padded + chunk1_header + bin_data


def add_box(verts, faces, x0, x1, y0, y1, z0, z1):
    base_idx = len(verts)
    pts = [
        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
    ]
    verts.extend(pts)
    quads = [
        [0, 3, 2, 1],  # Bottom (-Z)
        [4, 5, 6, 7],  # Top (+Z)
        [0, 1, 5, 4],  # Front (-Y)
        [2, 3, 7, 6],  # Back (+Y)
        [0, 4, 7, 3],  # Left (-X)
        [1, 2, 6, 5],  # Right (+X)
    ]
    for q in quads:
        faces.append([base_idx + q[0], base_idx + q[1], base_idx + q[2]])
        faces.append([base_idx + q[0], base_idx + q[2], base_idx + q[3]])


def add_cylinder(verts, faces, x, y, r, z0, z1, n_seg=12):
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

    # End caps
    cb = len(verts)
    verts.append([x, y, z0])
    ct = len(verts)
    verts.append([x, y, z1])
    for i in range(n_seg):
        nxt = (i + 1) % n_seg
        faces.append([cb, base_idx + nxt * 2, base_idx + i * 2])
        faces.append([ct, base_idx + i * 2 + 1, base_idx + nxt * 2 + 1])


def add_hex_prism(verts, faces, x, y, r, z0, z1):
    add_cylinder(verts, faces, x, y, r, z0, z1, n_seg=6)


def build_bearing_ucp204():
    """Pillow block bearing UCP204 geometry (in meters, ~0.13m width)."""
    verts, faces = [], []
    # Cast housing base plate
    add_box(verts, faces, -0.065, 0.065, -0.018, 0.018, 0.0, 0.014)
    # Mounting ear bolt holes (recessed collars)
    add_cylinder(verts, faces, -0.048, 0.0, 0.007, 0.0, 0.015, n_seg=8)
    add_cylinder(verts, faces, 0.048, 0.0, 0.007, 0.0, 0.015, n_seg=8)
    # Upright central bearing arch
    add_box(verts, faces, -0.035, 0.035, -0.016, 0.016, 0.014, 0.065)
    # Inner spherical outer ring
    add_cylinder(verts, faces, 0.0, 0.0, 0.024, -0.016, 0.016, n_seg=14)
    # Inner steel ball race / shaft sleeve
    add_cylinder(verts, faces, 0.0, 0.0, 0.010, -0.020, 0.020, n_seg=12)
    return build_glb(verts, faces, material_name="CastIron_Steel", color=(0.35, 0.42, 0.48, 1.0), metallic=0.85, roughness=0.3)


def build_fastener_m5_hex():
    """M5 Hex socket cap bolt (in meters, ~0.025m length)."""
    verts, faces = [], []
    # Cylindrical knurled head
    add_cylinder(verts, faces, 0.0, 0.0, 0.0042, 0.018, 0.023, n_seg=10)
    # Hex socket recess
    add_hex_prism(verts, faces, 0.0, 0.0, 0.0022, 0.021, 0.023)
    # Threaded cylindrical shank
    add_cylinder(verts, faces, 0.0, 0.0, 0.0025, 0.0, 0.018, n_seg=8)
    return build_glb(verts, faces, material_name="StainlessSteel", color=(0.85, 0.88, 0.90, 1.0), metallic=0.9, roughness=0.2)


def build_tension_spring():
    """Helical tension spring with retention hooks (in meters, ~0.06m length)."""
    verts, faces = [], []
    # Coil body approximation
    num_coils = 8
    radius = 0.006
    for i in range(num_coils):
        z = 0.010 + (i / num_coils) * 0.040
        add_cylinder(verts, faces, 0.0, 0.0, radius, z, z + 0.003, n_seg=10)
    # End hook loops
    add_cylinder(verts, faces, 0.0, 0.004, 0.004, 0.0, 0.010, n_seg=8)
    add_cylinder(verts, faces, 0.0, -0.004, 0.004, 0.050, 0.060, n_seg=8)
    return build_glb(verts, faces, material_name="SpringSteel", color=(0.75, 0.78, 0.82, 1.0), metallic=0.8, roughness=0.25)


def build_shaft_hex_12mm():
    """12mm Hex drive shaft (in meters, ~0.45m length)."""
    verts, faces = [], []
    r_hex = 0.00693  # 12mm across flats
    add_hex_prism(verts, faces, 0.0, 0.0, r_hex, -0.225, 0.225)
    # Keyway retention groove
    add_cylinder(verts, faces, 0.0, 0.0, 0.0055, 0.200, 0.205, n_seg=8)
    add_cylinder(verts, faces, 0.0, 0.0, 0.0055, -0.205, -0.200, n_seg=8)
    return build_glb(verts, faces, material_name="GroundSteel", color=(0.82, 0.85, 0.88, 1.0), metallic=0.88, roughness=0.18)


def build_silicone_roller():
    """Silicone high-traction feed roller (in meters, ~0.08m length, 0.035m diam)."""
    verts, faces = [], []
    # Outer silicone tire with grip ribs
    add_cylinder(verts, faces, 0.0, 0.0, 0.0175, -0.040, 0.040, n_seg=14)
    # Internal aluminum drive hub
    add_cylinder(verts, faces, 0.0, 0.0, 0.008, -0.045, 0.045, n_seg=10)
    # Center bore
    add_cylinder(verts, faces, 0.0, 0.0, 0.004, -0.046, 0.046, n_seg=8)
    return build_glb(verts, faces, material_name="SiliconeElastomer", color=(0.95, 0.45, 0.10, 1.0), metallic=0.1, roughness=0.65)


def build_spur_gear_40t():
    """40-tooth spur drive gear (in meters, ~0.084m diam, 0.012m thickness)."""
    verts, faces = [], []
    pitch_r = 0.040
    # Central hub with set screw collar
    add_cylinder(verts, faces, 0.0, 0.0, 0.015, -0.010, 0.010, n_seg=12)
    # Gear web
    add_cylinder(verts, faces, 0.0, 0.0, pitch_r, -0.006, 0.006, n_seg=16)
    # Perimeter teeth approximation
    num_teeth = 16
    for i in range(num_teeth):
        ang = (2 * math.pi * i) / num_teeth
        tx = (pitch_r + 0.003) * math.cos(ang)
        ty = (pitch_r + 0.003) * math.sin(ang)
        add_box(verts, faces, tx - 0.002, tx + 0.002, ty - 0.002, ty + 0.002, -0.006, 0.006)
    return build_glb(verts, faces, material_name="MachinedPOM_Delrin", color=(0.92, 0.94, 0.96, 1.0), metallic=0.2, roughness=0.3)


def build_lead_screw_tr8():
    """TR8x8 trapezoidal lead screw with bronze nut (in meters, ~0.35m length)."""
    verts, faces = [], []
    add_cylinder(verts, faces, 0.0, 0.0, 0.004, -0.175, 0.175, n_seg=10)
    # Bronze flange nut traveler
    add_cylinder(verts, faces, 0.0, 0.0, 0.011, -0.012, 0.012, n_seg=12)
    add_box(verts, faces, -0.015, 0.015, -0.015, 0.015, -0.004, 0.004)
    return build_glb(verts, faces, material_name="StainlessSteel_Bronze", color=(0.85, 0.75, 0.45, 1.0), metallic=0.85, roughness=0.3)


def generate_all_components():
    """Outputs atomic components into cad/components/ and public/cad/components/."""
    components = {
        ('hardware', 'bearing_ucp204.glb'): build_bearing_ucp204(),
        ('hardware', 'fastener_m5_hex.glb'): build_fastener_m5_hex(),
        ('hardware', 'tension_spring.glb'): build_tension_spring(),
        ('drive', 'shaft_hex_12mm.glb'): build_shaft_hex_12mm(),
        ('drive', 'silicone_roller.glb'): build_silicone_roller(),
        ('drive', 'spur_gear_40t.glb'): build_spur_gear_40t(),
        ('drive', 'lead_screw_tr8.glb'): build_lead_screw_tr8(),
    }

    for (subfolder, filename), data in components.items():
        cad_path = os.path.join(CAD_DIR, 'components', subfolder, filename)
        pub_path = os.path.join(PUBLIC_CAD_DIR, 'components', subfolder, filename)
        os.makedirs(os.path.dirname(cad_path), exist_ok=True)
        os.makedirs(os.path.dirname(pub_path), exist_ok=True)

        with open(cad_path, 'wb') as f:
            f.write(data)
        with open(pub_path, 'wb') as f:
            f.write(data)
        print(f"  [Component] {subfolder}/{filename}: {len(data)} bytes")


def generate_hierarchical_assemblies():
    """Generates composite assemblies referencing sub-models via extras.ref."""
    assemblies = {
        'pug_auger_drive_assembly.gltf': {
            "asset": {
                "version": "2.0",
                "generator": "OpenBiosphere-ParametricCAD-GLTF (RFC-014)"
            },
            "scene": 0,
            "scenes": [
                {
                    "name": "PugAuger_Drive_Master_Scene",
                    "nodes": [0, 1, 2, 3]
                }
            ],
            "nodes": [
                {
                    "name": "PugAuger_Shaft_Assembly",
                    "translation": [0.0, 0.45, 0.0],
                    "rotation": [0.0, 0.0, 0.0, 1.0],
                    "scale": [1.0, 1.0, 1.0],
                    "extras": {
                        "ref": "../components/drive/shaft_hex_12mm.glb",
                        "partId": "PART-DRIVE-SHAFT-HEX-12MM",
                        "focusStep": 1
                    }
                },
                {
                    "name": "Bearing_PillowBlock_L",
                    "translation": [-0.25, 0.45, 0.0],
                    "rotation": [0.0, 0.0, 0.0, 1.0],
                    "scale": [1.0, 1.0, 1.0],
                    "extras": {
                        "ref": "../components/hardware/bearing_ucp204.glb",
                        "partId": "PART-MECH-BEARING-UCP204-L",
                        "focusStep": 2
                    }
                },
                {
                    "name": "Bearing_PillowBlock_R",
                    "translation": [0.25, 0.45, 0.0],
                    "rotation": [0.0, 0.0, 0.0, 1.0],
                    "scale": [1.0, 1.0, 1.0],
                    "extras": {
                        "ref": "../components/hardware/bearing_ucp204.glb",
                        "partId": "PART-MECH-BEARING-UCP204-R",
                        "focusStep": 2
                    }
                },
                {
                    "name": "Spur_Gear_Drive_40T",
                    "translation": [0.18, 0.45, 0.0],
                    "rotation": [0.0, 0.7071, 0.0, 0.7071],
                    "scale": [1.0, 1.0, 1.0],
                    "extras": {
                        "ref": "../components/drive/spur_gear_40t.glb",
                        "partId": "PART-DRIVE-GEAR-SPUR-40T",
                        "focusStep": 3
                    }
                }
            ]
        },
        'bca_packaging_engine_assembly.gltf': {
            "asset": {
                "version": "2.0",
                "generator": "OpenBiosphere-ParametricCAD-GLTF (RFC-014)"
            },
            "scene": 0,
            "scenes": [
                {
                    "name": "BCA_Packaging_Engine_Composite_Scene",
                    "nodes": [0, 1, 2, 3, 4]
                }
            ],
            "nodes": [
                {
                    "name": "Extruder_LeadScrew_Z",
                    "translation": [0.0, 0.15, 0.35],
                    "rotation": [0.0, 0.0, 0.0, 1.0],
                    "extras": {
                        "ref": "../components/drive/lead_screw_tr8.glb",
                        "partId": "PART-DRIVE-LEADSCREW-TR8",
                        "focusStep": 1
                    }
                },
                {
                    "name": "Auger_Drive_Shaft",
                    "translation": [0.0, -0.10, 0.15],
                    "rotation": [0.7071, 0.0, 0.0, 0.7071],
                    "extras": {
                        "ref": "../components/drive/shaft_hex_12mm.glb",
                        "partId": "PART-DRIVE-SHAFT-HEX-12MM",
                        "focusStep": 2
                    }
                },
                {
                    "name": "Feed_Silicone_Roller_Pair",
                    "translation": [-0.12, 0.05, 0.20],
                    "rotation": [0.0, 0.0, 0.0, 1.0],
                    "extras": {
                        "ref": "../components/drive/silicone_roller.glb",
                        "partId": "PART-DRIVE-ROLLER-SILICONE",
                        "focusStep": 3
                    }
                },
                {
                    "name": "Bearing_Flange_Support",
                    "translation": [0.15, -0.10, 0.15],
                    "rotation": [0.0, 0.7071, 0.7071, 0.0],
                    "extras": {
                        "ref": "../components/hardware/bearing_ucp204.glb",
                        "partId": "PART-MECH-BEARING-UCP204",
                        "focusStep": 4
                    }
                },
                {
                    "name": "Die_Tension_Spring_Array",
                    "translation": [0.0, 0.25, 0.08],
                    "rotation": [0.0, 0.0, 0.0, 1.0],
                    "extras": {
                        "ref": "../components/hardware/tension_spring.glb",
                        "partId": "PART-MECH-SPRING-TENSION",
                        "focusStep": 5
                    }
                }
            ]
        }
    }

    for filename, gltf_data in assemblies.items():
        cad_path = os.path.join(CAD_DIR, 'assemblies', filename)
        pub_path = os.path.join(PUBLIC_CAD_DIR, 'assemblies', filename)
        os.makedirs(os.path.dirname(cad_path), exist_ok=True)
        os.makedirs(os.path.dirname(pub_path), exist_ok=True)

        content = json.dumps(gltf_data, indent=2)
        with open(cad_path, 'w', encoding='utf-8') as f:
            f.write(content)
        with open(pub_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  [Assembly] {filename}: {len(content)} bytes")


if __name__ == '__main__':
    print("=== Building Open Biosphere glTF 2.0 CAD Pipeline (RFC-014) ===")
    generate_all_components()
    generate_hierarchical_assemblies()
    print("=== glTF Pipeline Build Complete ===")
