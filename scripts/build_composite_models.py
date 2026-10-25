import os, struct, math

BASE = '/mnt/c/Users/samue/Projects/open-biosphere'

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

def add_cylinder_z(verts, faces, x, y, r, z0, z1, n_seg=8):
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

def add_cylinder_x(verts, faces, x0, x1, y, z, r, n_seg=8):
    base_idx = len(verts)
    for i in range(n_seg):
        ang = (2 * math.pi * i) / n_seg
        verts.append([x0, y + r * math.cos(ang), z + r * math.sin(ang)])
        verts.append([x1, y + r * math.cos(ang), z + r * math.sin(ang)])
    for i in range(n_seg):
        nxt = (i + 1) % n_seg
        b0 = base_idx + i * 2
        t0 = base_idx + i * 2 + 1
        b1 = base_idx + nxt * 2
        t1 = base_idx + nxt * 2 + 1
        faces.append([b0, b1, t0])
        faces.append([b1, t1, t0])
    c_left = len(verts); verts.append([x0, y, z])
    c_right = len(verts); verts.append([x1, y, z])
    for i in range(n_seg):
        nxt = (i + 1) % n_seg
        faces.append([c_left, base_idx + i * 2, base_idx + nxt * 2])
        faces.append([c_right, base_idx + nxt * 2 + 1, base_idx + i * 2 + 1])

def add_cylinder_y(verts, faces, x, y0, y1, z, r, n_seg=8):
    base_idx = len(verts)
    for i in range(n_seg):
        ang = (2 * math.pi * i) / n_seg
        verts.append([x + r * math.cos(ang), y0, z + r * math.sin(ang)])
        verts.append([x + r * math.cos(ang), y1, z + r * math.sin(ang)])
    for i in range(n_seg):
        nxt = (i + 1) % n_seg
        v0 = base_idx + i * 2
        v1 = base_idx + i * 2 + 1
        v2 = base_idx + nxt * 2
        v3 = base_idx + nxt * 2 + 1
        faces.append([v0, v1, v3])
        faces.append([v0, v3, v2])
    c_front = len(verts); verts.append([x, y0, z])
    c_back = len(verts); verts.append([x, y1, z])
    for i in range(n_seg):
        nxt = (i + 1) % n_seg
        faces.append([c_front, base_idx + i * 2, base_idx + nxt * 2])
        faces.append([c_back, base_idx + nxt * 2 + 1, base_idx + i * 2 + 1])

# ==============================================================
# SUB-MODEL UPGRADES (Enhancing any remaining rudimentary parts)
# ==============================================================
submodels = {}

# 1. Botanical Camel-Hair Dusting Brush
def gen_brush():
    v, f = [], []
    add_cylinder_z(v, f, 0, 0, 4, -40, 0, n_seg=8) # handle
    add_cylinder_z(v, f, 0, 0, 5, 0, 15, n_seg=8)  # brass ferrule
    add_cylinder_z(v, f, 0, 0, 8, 15, 45, n_seg=8) # camel hair bristles
    return build_3ds(v, f)
submodels['PART-MECH-BRUSH-CAMEL-HAIR'] = gen_brush()

# 2. Convex Inspection Mirror on Ball Joint
def gen_mirror():
    v, f = [], []
    add_cylinder_z(v, f, 0, 0, 4, -30, -5, n_seg=6) # mount stalk
    add_cylinder_z(v, f, 0, 0, 7, -5, 5, n_seg=8)   # swivel ball joint
    add_cylinder_y(v, f, 0, 5, 9, 25, 25, n_seg=12) # 50mm mirror glass disc
    add_cylinder_y(v, f, 0, 3, 5, 25, 27, n_seg=12) # chrome bezel
    return build_3ds(v, f)
submodels['PART-MECH-MIRROR-CONVEX-BALL'] = gen_mirror()

# 3. Two-Control Master Interlock Pack
def gen_two_ctrl():
    v, f = [], []
    add_box(v, f, -45, 45, -30, 30, -20, 20) # IP65 box
    add_cylinder_z(v, f, -20, 0, 14, 20, 32, n_seg=10) # Red mushroom e-stop
    add_cylinder_z(v, f, 20, 0, 8, 20, 28, n_seg=8)   # Keyed interlock lock switch
    add_cylinder_z(v, f, 0, 15, 4, 20, 24, n_seg=6)   # Pilot status LED
    return build_3ds(v, f)
submodels['PART-ELEC-TWO-CTRL-PACK'] = gen_two_ctrl()

# 4. OLED 0.91 I2C Display Module
def gen_oled():
    v, f = [], []
    add_box(v, f, -20, 20, -7, 7, -2, 2)    # PCB carrier
    add_box(v, f, -16, 16, -5, 5, 2, 4)     # Glass OLED active panel
    add_cylinder_z(v, f, -15, -5, 1, -8, -2, n_seg=4) # I2C header pins
    add_cylinder_z(v, f, -10, -5, 1, -8, -2, n_seg=4)
    add_cylinder_z(v, f, -5, -5, 1, -8, -2, n_seg=4)
    add_cylinder_z(v, f, 0, -5, 1, -8, -2, n_seg=4)
    return build_3ds(v, f)
submodels['PART-ELEC-OLED-091-I2C'] = gen_oled()

# 5. Telescoping Carbon Fiber Wand
def gen_cf_wand():
    v, f = [], []
    add_cylinder_z(v, f, 0, 0, 12, -200, -50, n_seg=8) # Outer base tube
    add_cylinder_z(v, f, 0, 0, 14, -55, -45, n_seg=8)  # Twist lock collar 1
    add_cylinder_z(v, f, 0, 0, 9, -50, 100, n_seg=8)   # Mid tube
    add_cylinder_z(v, f, 0, 0, 11, 95, 105, n_seg=8)   # Twist lock collar 2
    add_cylinder_z(v, f, 0, 0, 6, 100, 250, n_seg=8)  # Top extension tip
    return build_3ds(v, f)
submodels['PART-MECH-POLE-CF-TELESCOPIC'] = gen_cf_wand()

# Write upgraded sub-models
for pid, raw in submodels.items():
    p = f'{BASE}/public/assets/parts/{pid}/model.3ds'
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'wb') as fp: fp.write(raw)
    print(f'Upgraded sub-model {pid}: {len(raw)} bytes')

# ==============================================================
# PROCEDURAL COMPOSITE MACHINE ASSEMBLIES (27 STAGES)
# ==============================================================
machines_composites = {}

# 1. Aerial Pollination Drone
# Stage 0: Manual Wand + Fork + Mirror + Brush
def comp_drone_stage_0():
    v, f = [], []
    add_cylinder_x(v, f, -180, 120, 0, 0, 8, n_seg=8) # Wand shaft
    add_cylinder_x(v, f, -50, -40, 0, 0, 11, n_seg=8) # Twist collar
    # Tuning fork at tip (X=120..180)
    add_box(v, f, 120, 140, -4, 4, -4, 4)
    add_box(v, f, 140, 180, -12, -6, -3, 3) # Fork tine 1
    add_box(v, f, 140, 180, 6, 12, -3, 3)   # Fork tine 2
    # Mirror at X=90, angled up
    add_cylinder_z(v, f, 90, 0, 3, 0, 18, n_seg=6)
    add_cylinder_y(v, f, 90, 16, 20, 24, 18, n_seg=10)
    # Brush at X=40, angled down
    add_cylinder_z(v, f, 40, 0, 3, -15, 0, n_seg=6)
    add_cylinder_z(v, f, 40, 0, 7, -35, -15, n_seg=8)
    return build_3ds(v, f)
machines_composites['aerial-pollination-drone/stage-0'] = comp_drone_stage_0()

# Stage 1: Whoop Drone + Motors + FC + Battery
def comp_drone_stage_1():
    v, f = [], []
    # 4 Ducted Propeller Guards (85mm class whoop)
    for cx, cy in [(-35, -35), (35, -35), (-35, 35), (35, 35)]:
        add_cylinder_z(v, f, cx, cy, 22, -8, 8, n_seg=10) # Duct outer
        add_cylinder_z(v, f, cx, cy, 7, -6, 6, n_seg=6)   # Motor 1103 hub
        # Propeller blades
        add_box(v, f, cx - 18, cx + 18, cy - 2, cy + 2, 0, 2)
    # Carbon X-Frame cross struts
    add_box(v, f, -40, 40, -3, 3, -2, 2)
    add_box(v, f, -3, 3, -40, 40, -2, 2)
    # Central Flight Controller Stack + Canopy
    add_box(v, f, -16, 16, -16, 16, 2, 8)
    add_cylinder_z(v, f, 0, 0, 12, 8, 18, n_seg=8) # Aero canopy
    # Underslung 2S LiPo battery
    add_box(v, f, -12, 12, -22, 22, -16, -4)
    # Nose piezo acoustic transducer
    add_cylinder_y(v, f, 0, 20, 28, 6, 6, n_seg=8)
    return build_3ds(v, f)
machines_composites['aerial-pollination-drone/stage-1'] = comp_drone_stage_1()

# Stage 2: Stage 1 + Optical Flow + RunCam + Conical Charging Dock
def comp_drone_stage_2():
    v, f = [], []
    # Drone Assembly hovering at Z = 30
    for cx, cy in [(-35, -35), (35, -35), (-35, 35), (35, 35)]:
        add_cylinder_z(v, f, cx, cy, 22, 22, 38, n_seg=10)
        add_cylinder_z(v, f, cx, cy, 7, 24, 36, n_seg=6)
    add_box(v, f, -40, 40, -3, 3, 28, 32)
    add_box(v, f, -3, 3, -40, 40, 28, 32)
    add_box(v, f, -16, 16, -16, 16, 32, 38) # FC + ESP32-S3 Node
    # RunCam tilt camera on nose
    add_box(v, f, -8, 8, 22, 34, 30, 42)
    add_cylinder_y(v, f, 0, 32, 38, 36, 4, n_seg=8)
    # Downward optical flow sensor
    add_box(v, f, -7, 7, -7, 7, 22, 26)
    # Ground Charging Conical Dock Perch below drone
    add_cylinder_z(v, f, 0, 0, 45, -15, -10, n_seg=12) # Base ring
    add_cylinder_z(v, f, 0, 0, 25, -10, 5, n_seg=10)   # Conical centering funnel
    add_cylinder_z(v, f, 0, 0, 12, 5, 12, n_seg=8)     # Copper contact crown
    return build_3ds(v, f)
machines_composites['aerial-pollination-drone/stage-2'] = comp_drone_stage_2()

# 2. BCA Packaging Engine
def comp_bca_stage_0():
    v, f = [], []
    # Steel frame
    add_box(v, f, -160, 160, -60, 60, -30, -20)
    # Upper breaker hopper & shaft
    add_box(v, f, -130, -30, -50, 50, -10, 50) # Hopper chute
    add_cylinder_x(v, f, -150, -10, 0, 20, 12, n_seg=8) # Breaker shaft
    for x in [-110, -90, -70, -50, -30]:
        add_box(v, f, x - 3, x + 3, -20, 20, 16, 24) # Breaker teeth
    # Lower pug auger barrel & continuous shaft
    add_cylinder_x(v, f, -80, 100, 0, -5, 24, n_seg=10) # Heated jacket barrel
    add_cylinder_x(v, f, -140, 120, 0, -5, 12, n_seg=8) # Auger core shaft
    # Hand ratchet crank on rear
    add_cylinder_x(v, f, -160, -140, 0, -5, 10, n_seg=6)
    add_box(v, f, -160, -152, 0, 55, -9, 0)
    # Flying wire shear carriage at discharge
    add_box(v, f, 100, 140, -45, 45, -20, 25)
    add_cylinder_y(v, f, 120, -40, 40, -5, 1.5, n_seg=6) # Music wire
    return build_3ds(v, f)
machines_composites['bca-packaging-engine/stage-0'] = comp_bca_stage_0()

def comp_bca_stage_1():
    v, f = [], []
    # Base mechanics
    add_box(v, f, -160, 160, -60, 60, -30, -20)
    add_cylinder_x(v, f, -80, 100, 0, -5, 24, n_seg=10)
    # DC 250W geared motor mounted in rear
    add_cylinder_y(v, f, -120, 30, 85, -5, 30, n_seg=10)
    add_box(v, f, -135, -105, 30, 85, -28, -20)
    # GT2 Timing belt & pulleys
    add_cylinder_x(v, f, -145, -135, 0, -5, 25, n_seg=10)
    add_cylinder_x(v, f, -145, -135, 55, -5, 14, n_seg=8)
    add_box(v, f, -144, -136, 0, 55, 16, 22)
    # Industrial 24V 250W PSU and Dual H-Bridge Box
    add_box(v, f, -50, 40, 40, 75, -20, 15)
    # Two-control safety interlock console
    add_box(v, f, 60, 130, 40, 75, -20, 15)
    add_cylinder_z(v, f, 80, 57, 8, 15, 24, n_seg=8)
    return build_3ds(v, f)
machines_composites['bca-packaging-engine/stage-1'] = comp_bca_stage_1()

def comp_bca_stage_2():
    v, f = [], []
    # Stage 1 core
    add_box(v, f, -160, 160, -60, 60, -30, -20)
    add_cylinder_x(v, f, -80, 100, 0, -5, 24, n_seg=10)
    add_cylinder_y(v, f, -120, 30, 85, -5, 30, n_seg=10)
    # 4-Way Stepper Aperture Die Plates on discharge face (X=100)
    add_box(v, f, 100, 112, -45, 45, -50, 40) # Frame
    add_box(v, f, 102, 110, -25, 25, -30, 20) # Sliding plates
    # 4 Stepper motors on 4 cardinals
    add_cylinder_z(v, f, 106, 0, 12, 40, 75, n_seg=8)  # North stepper
    add_cylinder_z(v, f, 106, 0, 12, -85, -50, n_seg=8) # South stepper
    add_cylinder_y(v, f, 106, 45, 80, -5, 12, n_seg=8)  # East stepper
    add_cylinder_y(v, f, 106, -80, -45, -5, 12, n_seg=8) # West stepper
    # Robotic Servo Flying Shear
    add_box(v, f, 125, 155, -40, 40, -35, 25)
    add_box(v, f, 130, 150, 42, 65, 0, 30) # Servo
    # Edge CNT Controller + Loadcell bracket
    add_box(v, f, 0, 60, -75, -45, -20, 20)
    return build_3ds(v, f)
machines_composites['bca-packaging-engine/stage-2'] = comp_bca_stage_2()
machines_composites['bca-packaging-engine/architecture'] = comp_bca_stage_2()

# 3. Fluidic Skimmer Loop
def comp_skimmer_stage_0():
    v, f = [], []
    # U-Channel Flume Trough
    add_box(v, f, -175, 175, -50, 50, -40, -32) # floor
    add_box(v, f, -175, 175, -50, -42, -32, 35) # left acrylic wall
    add_box(v, f, -175, 175, 42, 50, -32, 35)  # right HDPE wall
    # 150um Wedge-Wire Screen
    add_box(v, f, -60, 40, -42, 42, -32, -10)
    # Floating Weir Gate & Lever
    add_box(v, f, -150, -135, -42, 42, -30, 5)
    add_box(v, f, -145, -140, 42, 60, 5, 45) # counterweight arm
    add_cylinder_x(v, f, -155, -130, 55, 45, 10, n_seg=6)
    # Dewatering Screw Press (Auger in sleeve)
    add_cylinder_x(v, f, 40, 150, 0, -10, 20, n_seg=8)
    # Drainage Sump Basin below
    add_cylinder_z(v, f, 0, 0, 35, -75, -40, n_seg=8)
    return build_3ds(v, f)
machines_composites['fluidic-skimmer-loop/stage-0'] = comp_skimmer_stage_0()

def comp_skimmer_stage_1():
    v, f = [], []
    # Stage 0 Flume
    add_box(v, f, -175, 175, -50, 50, -40, -32)
    add_box(v, f, -175, 175, -50, -42, -32, 35)
    add_box(v, f, -175, 175, 42, 50, -32, 35)
    # Waterproof Servo Motor & Dual Yoke Linkage for weir
    add_box(v, f, -155, -125, 52, 78, 10, 35)
    add_box(v, f, -145, -135, 42, 65, 22, 28)
    # 24V Magnetic Drive Pump Loop
    add_cylinder_x(v, f, 60, 130, 50, -35, 22, n_seg=8)
    add_cylinder_z(v, f, 95, 50, 12, -35, 0, n_seg=6) # outlet pipe
    # Concentric Optical Shutter Tubes
    add_cylinder_z(v, f, -40, 0, 22, 0, 45, n_seg=10)
    add_cylinder_z(v, f, -40, 0, 18, 5, 50, n_seg=10)
    return build_3ds(v, f)
machines_composites['fluidic-skimmer-loop/stage-1'] = comp_skimmer_stage_1()

def comp_skimmer_stage_2():
    v, f = [], []
    # Stage 1 Core
    add_box(v, f, -175, 175, -50, 50, -40, -32)
    add_box(v, f, -175, 175, -50, -42, -32, 35)
    add_box(v, f, -175, 175, 42, 50, -32, 35)
    add_cylinder_x(v, f, 60, 130, 50, -35, 22, n_seg=8)
    # 50W LED Grow Puck + Inverted Pyramid Diffuser
    add_cylinder_z(v, f, -40, 0, 30, 50, 62, n_seg=12) # LED Puck
    add_box(v, f, -55, -25, -15, 15, 30, 50)           # Inverted pyramid diffuser
    # Hall Flow Sensor + Solenoid Valve
    add_cylinder_x(v, f, 120, 155, 50, -5, 10, n_seg=6)
    # Edge CNT Control Node & Weatherproof Enclosure
    add_box(v, f, -110, -50, -85, -55, -10, 35)
    return build_3ds(v, f)
machines_composites['fluidic-skimmer-loop/stage-2'] = comp_skimmer_stage_2()

# 4. Ground Track AGV
def comp_agv_stage_0():
    v, f = [], []
    # Heavy Steel Chassis Bed
    add_box(v, f, -140, 140, -70, 70, -10, 15)
    # Left & Right Rubber Track Treads
    for y_track in [-95, 95]:
        # Track loop
        add_box(v, f, -150, 150, y_track - 15, y_track + 15, -35, -5)
        # Drive sprockets & bogies
        add_cylinder_y(v, f, -130, y_track - 16, y_track + 16, -20, 20, n_seg=8)
        add_cylinder_y(v, f, 130, y_track - 16, y_track + 16, -20, 20, n_seg=8)
        add_cylinder_y(v, f, -45, y_track - 16, y_track + 16, -22, 14, n_seg=8)
        add_cylinder_y(v, f, 45, y_track - 16, y_track + 16, -22, 14, n_seg=8)
        # Bogie suspension arms
        add_box(v, f, -70, 70, y_track - 8, y_track + 8, -15, -5)
    # Tiller handle on front (folded up)
    add_cylinder_y(v, f, -140, -25, 25, 15, 6, n_seg=6) # pivot
    add_box(v, f, -150, -135, -12, 12, 15, 120)        # handle shaft
    add_cylinder_y(v, f, -142, -35, 35, 120, 8, n_seg=6) # grip
    return build_3ds(v, f)
machines_composites['ground-track-agv/stage-0'] = comp_agv_stage_0()

def comp_agv_stage_1():
    v, f = [], []
    # Stage 0 Chassis & Tracks
    add_box(v, f, -140, 140, -70, 70, -10, 15)
    for y_track in [-95, 95]:
        add_box(v, f, -150, 150, y_track - 15, y_track + 15, -35, -5)
        add_cylinder_y(v, f, -130, y_track - 16, y_track + 16, -20, 20, n_seg=8)
        add_cylinder_y(v, f, 130, y_track - 16, y_track + 16, -20, 20, n_seg=8)
    # Dual 250W DC Planetary Geared Motors
    add_cylinder_y(v, f, 90, -75, -20, -10, 28, n_seg=8)
    add_cylinder_y(v, f, 90, 20, 75, -10, 28, n_seg=8)
    # 24V 15Ah LiFePO4 Battery Pack inside chassis center
    add_box(v, f, -80, 40, -50, 50, 15, 60)
    # Upper 2020 Aluminum Payload Bed
    add_box(v, f, -130, 130, -65, -45, 60, 80)
    add_box(v, f, -130, 130, 45, 65, 60, 80)
    # Two-Control E-Stop console
    add_box(v, f, -120, -70, -40, 0, 80, 115)
    add_cylinder_z(v, f, -95, -20, 12, 115, 128, n_seg=8)
    return build_3ds(v, f)
machines_composites['ground-track-agv/stage-1'] = comp_agv_stage_1()

def comp_agv_stage_2():
    v, f = [], []
    # Stage 1 Chassis & Payload Bed
    add_box(v, f, -140, 140, -70, 70, -10, 15)
    for y_track in [-95, 95]:
        add_box(v, f, -150, 150, y_track - 15, y_track + 15, -35, -5)
    add_box(v, f, -80, 40, -50, 50, 15, 60)
    add_box(v, f, -130, 130, -65, -45, 60, 80)
    add_box(v, f, -130, 130, 45, 65, 60, 80)
    # 2D Navigation Lidar Mast on Front Right
    add_cylinder_z(v, f, -110, 45, 8, 80, 140, n_seg=6) # mast
    add_cylinder_z(v, f, -110, 45, 20, 140, 165, n_seg=10) # 360 turret
    # 3-Axis Manipulator Robotic Arm mounted in center
    add_cylinder_z(v, f, 20, 0, 25, 80, 100, n_seg=8) # Base turret
    add_box(v, f, 15, 25, -6, 6, 100, 170)           # Shoulder arm
    add_box(v, f, 25, 90, -5, 5, 165, 175)           # Forearm
    add_cylinder_x(v, f, 90, 115, 0, 170, 8, n_seg=6) # Gripper wrist
    # Underside 5-Channel Magnetic Track Sensor
    add_box(v, f, -145, -130, -45, 45, -25, -15)
    return build_3ds(v, f)
machines_composites['ground-track-agv/stage-2'] = comp_agv_stage_2()

# 5. Mantis Branch Crawler
def comp_mantis_stage_0():
    v, f = [], []
    # Dual 5052 Aluminum Scissor Side Plates
    add_box(v, f, -90, 90, -45, -40, -35, 35) # Left plate
    add_box(v, f, -90, 90, 40, 45, -35, 35)   # Right plate
    # 4 Soft Silicone Drive Pinch Rollers
    add_cylinder_y(v, f, -55, -40, 40, -18, 16, n_seg=8)
    add_cylinder_y(v, f, -55, -40, 40, 18, 16, n_seg=8)
    add_cylinder_y(v, f, 55, -40, 40, -18, 16, n_seg=8)
    add_cylinder_y(v, f, 55, -40, 40, 18, 16, n_seg=8)
    # Bypass Snip Pruner on Front
    add_box(v, f, 90, 145, -12, 12, -4, 4)
    add_box(v, f, 140, 175, -8, 0, 0, 6) # blade 1
    add_box(v, f, 140, 175, 0, 8, -6, 0) # blade 2
    # Bowden Cable & Fiberglass Hoist Pole
    add_cylinder_z(v, f, 0, 0, 14, -140, -35, n_seg=8)
    # Harvest Funnel Chute below
    add_box(v, f, 60, 130, -35, 35, -50, -15)
    return build_3ds(v, f)
machines_composites['mantis-branch-crawler/stage-0'] = comp_mantis_stage_0()

def comp_mantis_stage_1():
    v, f = [], []
    # Scissor Frame & Silicone Rollers
    add_box(v, f, -90, 90, -45, -40, -35, 35)
    add_box(v, f, -90, 90, 40, 45, -35, 35)
    add_cylinder_y(v, f, -55, -40, 40, -18, 16, n_seg=8)
    add_cylinder_y(v, f, 55, -40, 40, -18, 16, n_seg=8)
    # Dual NEMA 14 Pancake Steppers on sides
    add_cylinder_y(v, f, -55, -65, -45, 0, 22, n_seg=8)
    add_cylinder_y(v, f, 55, 45, 65, 0, 22, n_seg=8)
    # Coreless 12V Cutter Motor on front
    add_cylinder_x(v, f, 90, 135, 0, 10, 12, n_seg=8)
    # 5015 Centrifugal Harvest Assist Blower
    add_cylinder_x(v, f, 50, 85, 0, -45, 25, n_seg=10)
    # 18V Tool Battery Slide Adapter
    add_box(v, f, -75, -15, -35, 35, 35, 55)
    return build_3ds(v, f)
machines_composites['mantis-branch-crawler/stage-1'] = comp_mantis_stage_1()

def comp_mantis_stage_2():
    v, f = [], []
    # Stage 1 Core
    add_box(v, f, -90, 90, -45, -40, -35, 35)
    add_box(v, f, -90, 90, 40, 45, -35, 35)
    add_cylinder_y(v, f, -55, -40, 40, -18, 16, n_seg=8)
    add_cylinder_y(v, f, 55, -40, 40, -18, 16, n_seg=8)
    # Dual Stereo NIR Depth Camera on front
    add_box(v, f, 80, 105, -35, 35, 25, 45)
    add_cylinder_x(v, f, 100, 108, -25, 35, 6, n_seg=6) # Left lens
    add_cylinder_x(v, f, 100, 108, 25, 35, 6, n_seg=6)  # Right lens
    # Quick-Dock Pogo Gantry Receptacle on Rear
    add_box(v, f, -110, -90, -25, 25, -20, 20)
    add_cylinder_x(v, f, -118, -110, -12, 0, 3, n_seg=4)
    add_cylinder_x(v, f, -118, -110, 12, 0, 3, n_seg=4)
    # Central ESP32-S3 Compute Enclosure
    add_box(v, f, -40, 40, -35, 35, 35, 65)
    return build_3ds(v, f)
machines_composites['mantis-branch-crawler/stage-2'] = comp_mantis_stage_2()

# 6. Microclimate Dosing Array
def comp_dosing_stage_0():
    v, f = [], []
    # 2020 Aluminum Vertical Rack Frame (4 uprights + tiers)
    for x in [-60, 60]:
        for y in [-40, 40]:
            add_box(v, f, x - 10, x + 10, y - 10, y + 10, -120, 120)
    # Crossbars at Z = -110, 0, 110
    for z in [-110, 0, 110]:
        add_box(v, f, -60, 60, -45, -35, z - 5, z + 5)
        add_box(v, f, -60, 60, 35, 45, z - 5, z + 5)
        add_box(v, f, -65, -55, -40, 40, z - 5, z + 5)
        add_box(v, f, 55, 65, -40, 40, z - 5, z + 5)
    # 2 Manual Pressure Dosing Tanks on top tier
    add_cylinder_z(v, f, -30, 0, 22, 10, 95, n_seg=8)
    add_cylinder_z(v, f, 30, 0, 22, 10, 95, n_seg=8)
    # 3-Way Selector Valves on mid tier
    add_box(v, f, -35, -15, -35, -15, -15, 10)
    add_box(v, f, 15, 35, -35, -15, -15, 10)
    # Bottom Collection Basin
    add_box(v, f, -50, 50, -35, 35, -110, -85)
    return build_3ds(v, f)
machines_composites['microclimate-dosing-array/stage-0'] = comp_dosing_stage_0()

def comp_dosing_stage_1():
    v, f = [], []
    # Frame Uprights
    for x in [-60, 60]:
        for y in [-40, 40]:
            add_box(v, f, x - 10, x + 10, y - 10, y + 10, -120, 120)
    # 4 Peristaltic Dosing Pumps arrayed horizontally on mid tier
    for i, x in enumerate([-45, -15, 15, 45]):
        add_box(v, f, x - 12, x + 12, -35, 5, -15, 15)       # Pump head
        add_cylinder_y(v, f, x, 5, 45, 0, 14, n_seg=8)       # 12V DC motor
    # Status OLED Display on front panel
    add_box(v, f, -25, 25, -45, -35, 35, 65)
    add_box(v, f, -18, 18, -47, -45, 45, 55)
    # 12V 60W Power Supply Unit on bottom tier
    add_box(v, f, -45, 45, -30, 30, -110, -75)
    return build_3ds(v, f)
machines_composites['microclimate-dosing-array/stage-1'] = comp_dosing_stage_1()

def comp_dosing_stage_2():
    v, f = [], []
    # Frame & Peristaltic Pumps
    for x in [-60, 60]:
        for y in [-40, 40]:
            add_box(v, f, x - 10, x + 10, y - 10, y + 10, -120, 120)
    for i, x in enumerate([-45, -15, 15, 45]):
        add_box(v, f, x - 12, x + 12, -35, 5, -15, 15)
        add_cylinder_y(v, f, x, 5, 45, 0, 14, n_seg=8)
    # IP65 Environmental Enclosure on top tier
    add_box(v, f, -50, 50, -35, 35, 35, 110)
    # NDIR SCD41 CO2 & Climate Sensor Snout
    add_cylinder_z(v, f, 0, -42, 10, 50, 75, n_seg=8)
    # 8-Channel High Current MOSFET Bank inside enclosure
    add_box(v, f, -40, 40, -25, 25, 40, 55)
    return build_3ds(v, f)
machines_composites['microclimate-dosing-array/stage-2'] = comp_dosing_stage_2()

# 7. Overhead Gantry System
def comp_gantry_stage_0():
    v, f = [], []
    # Longitudinal X-Axis Dual Heavy Rails (4040 Extrusion)
    add_box(v, f, -180, 180, -100, -80, -20, 20) # Rail 1
    add_box(v, f, -180, 180, 80, 100, -20, 20)   # Rail 2
    # Transverse Y-Axis Gantry Beam (2040 Extrusion)
    add_box(v, f, -20, 20, -90, 90, 20, 60)
    # Left and Right Gantry End Carriages with V-Wheels
    for y_pos in [-90, 90]:
        add_box(v, f, -40, 40, y_pos - 15, y_pos + 15, 10, 70)
        # 4 Polycarbonate V-Wheels per carriage
        for wx in [-30, 30]:
            add_cylinder_x(v, f, wx - 6, wx + 6, y_pos, -15, 12, n_seg=8)
            add_cylinder_x(v, f, wx - 6, wx + 6, y_pos, 15, 12, n_seg=8)
    # Central Z-Axis Toolhead Carriage & Magnetic Kinematic Dock
    add_box(v, f, -30, 30, -25, 25, 40, 100)
    add_cylinder_z(v, f, 0, 0, 18, 25, 40, n_seg=8) # Mag dock collar
    return build_3ds(v, f)
machines_composites['overhead-gantry-system/stage-0'] = comp_gantry_stage_0()

def comp_gantry_stage_1():
    v, f = [], []
    # Gantry Rails & Carriages
    add_box(v, f, -180, 180, -100, -80, -20, 20)
    add_box(v, f, -180, 180, 80, 100, -20, 20)
    add_box(v, f, -20, 20, -90, 90, 20, 60)
    for y_pos in [-90, 90]:
        add_box(v, f, -40, 40, y_pos - 15, y_pos + 15, 10, 70)
    add_box(v, f, -30, 30, -25, 25, 40, 100)
    # High-Torque NEMA 23 Stepper Motors
    add_box(v, f, -180, -145, -125, -90, 0, 35) # X Motor 1
    add_box(v, f, -180, -145, 90, 125, 0, 35)   # X Motor 2
    add_box(v, f, 20, 55, -95, -60, 60, 95)     # Y Motor
    # 15x30 Nylon Cable Carrier Drag Chains along X and Y
    add_box(v, f, -160, 160, -115, -100, 20, 35)
    add_box(v, f, -35, -20, -80, 80, 60, 75)
    # TB6600 Stepper Driver & 24V PSU enclosure
    add_box(v, f, 120, 175, 45, 95, 25, 75)
    return build_3ds(v, f)
machines_composites['overhead-gantry-system/stage-1'] = comp_gantry_stage_1()

def comp_gantry_stage_2():
    v, f = [], []
    # Stage 1 Core
    add_box(v, f, -180, 180, -100, -80, -20, 20)
    add_box(v, f, -180, 180, 80, 100, -20, 20)
    add_box(v, f, -20, 20, -90, 90, 20, 60)
    add_box(v, f, -30, 30, -25, 25, 40, 100)
    # 4K IMX519 Survey Camera on carriage
    add_box(v, f, -12, 12, 25, 40, 50, 75)
    add_cylinder_y(v, f, 0, 40, 48, 62, 8, n_seg=8) # camera lens
    # Kinematic Toolhead attached to Magnetic Dock: Purslane Reciprocating Lateral Shear
    add_box(v, f, -25, 25, -20, 20, -15, 25)
    add_cylinder_x(v, f, -20, 20, 0, 10, 8, n_seg=8) # Motor
    # Scissor cutting teeth projecting down
    add_box(v, f, -18, 18, -15, 15, -35, -15)
    for tx in [-14, -7, 0, 7, 14]:
        add_box(v, f, tx - 2, tx + 2, -12, 12, -45, -35)
    # ESP32-S3 Edge Compute & AS5600 Encoders
    add_box(v, f, -25, 25, -35, -25, 55, 90)
    return build_3ds(v, f)
machines_composites['overhead-gantry-system/stage-2'] = comp_gantry_stage_2()

# 8. Revolving Sprout Bioreactor
def comp_sprout_stage_0():
    v, f = [], []
    # Trunnion Frame (Aluminum A-frame end stands)
    for x_end in [-140, 140]:
        add_box(v, f, x_end - 10, x_end + 10, -60, 60, -80, -60) # Base rail
        add_box(v, f, x_end - 8, x_end + 8, -50, -35, -60, 15)   # Stanchion 1
        add_box(v, f, x_end - 8, x_end + 8, 35, 50, -60, 15)     # Stanchion 2
        add_cylinder_x(v, f, x_end - 12, x_end + 12, 0, 15, 16, n_seg=8) # Axle bearing housing
    # Perforated Stainless Mesh Tumbling Drum (Ø350mm class)
    add_cylinder_x(v, f, -125, 125, 0, 15, 50, n_seg=14)
    # PETG End Flanges with Baffles
    add_cylinder_x(v, f, -130, -125, 0, 15, 55, n_seg=12)
    add_cylinder_x(v, f, 125, 130, 0, 15, 55, n_seg=12)
    # Central Stainless Axle
    add_cylinder_x(v, f, -165, 165, 0, 15, 8, n_seg=8)
    # Delrin Ratchet Hand Crank on front axle
    add_cylinder_x(v, f, 150, 168, 0, 15, 15, n_seg=8)
    add_box(v, f, 160, 168, 0, 60, 10, 20)
    # Drainage Sump Basin underneath
    add_box(v, f, -135, 135, -55, 55, -80, -45)
    return build_3ds(v, f)
machines_composites['revolving-sprout-bioreactor/stage-0'] = comp_sprout_stage_0()

def comp_sprout_stage_1():
    v, f = [], []
    # Stage 0 Drum & Frame
    for x_end in [-140, 140]:
        add_box(v, f, x_end - 10, x_end + 10, -60, 60, -80, -60)
        add_cylinder_x(v, f, x_end - 12, x_end + 12, 0, 15, 16, n_seg=8)
    add_cylinder_x(v, f, -125, 125, 0, 15, 50, n_seg=14)
    add_cylinder_x(v, f, -165, 165, 0, 15, 8, n_seg=8)
    # Planetary Geared NEMA 17 Drive Motor
    add_cylinder_x(v, f, -185, -145, 0, 55, 20, n_seg=8)
    # Timing Belt & Axial Dog Clutch
    add_cylinder_x(v, f, -155, -145, 0, 15, 25, n_seg=10) # Drum pulley
    add_cylinder_x(v, f, -155, -145, 0, 55, 14, n_seg=8)  # Motor pulley
    add_box(v, f, -154, -146, 0, 55, 30, 36)
    # 100 PSI High-Pressure Mist Pump & Brass Nozzles
    add_cylinder_y(v, f, 80, 50, 95, -70, 22, n_seg=8)
    # Two-Control BLE Box
    add_box(v, f, -100, -40, 50, 85, -75, -35)
    return build_3ds(v, f)
machines_composites['revolving-sprout-bioreactor/stage-1'] = comp_sprout_stage_1()

def comp_sprout_stage_2():
    v, f = [], []
    # Stage 1 Core
    for x_end in [-140, 140]:
        add_box(v, f, x_end - 10, x_end + 10, -60, 60, -80, -60)
        add_cylinder_x(v, f, x_end - 12, x_end + 12, 0, 15, 16, n_seg=8)
    add_cylinder_x(v, f, -125, 125, 0, 15, 50, n_seg=14)
    add_cylinder_x(v, f, -165, 165, 0, 15, 8, n_seg=8)
    add_cylinder_x(v, f, -185, -145, 0, 55, 20, n_seg=8)
    # Corona Discharge Ozone Sanitation Generator
    add_box(v, f, -120, -50, -80, -50, -40, 0)
    add_cylinder_x(v, f, -50, -20, -65, -20, 6, n_seg=6) # ozone feed pipe
    # SHT40 Temperature / Humidity Sensor Probe in drum hub
    add_cylinder_x(v, f, 130, 155, 0, 15, 6, n_seg=6)
    # Magnetic Drum Home-Position Alignment Latch
    add_box(v, f, -145, -135, -45, -30, 10, 25)
    # ESP32-S3 Fermentation & Sprouting Controller Node
    add_box(v, f, -40, 30, 50, 85, -75, -30)
    return build_3ds(v, f)
machines_composites['revolving-sprout-bioreactor/stage-2'] = comp_sprout_stage_2()

# 9. TPS Root Chamber
def comp_tps_stage_0():
    v, f = [], []
    # 160L Light-Tight HDPE Root Basin
    add_box(v, f, -140, 140, -90, 90, -90, 0) # Tub body
    add_box(v, f, -150, 150, -100, 100, 0, 12) # Rim lip & EPDM gasket
    # Structural Top Lid with Plant Collar Openings
    add_box(v, f, -145, 145, -95, 95, 12, 22)
    # 6 Neoprene Plant Support Collars
    for cx in [-90, 0, 90]:
        for cy in [-45, 45]:
            add_cylinder_z(v, f, cx, cy, 18, 20, 35, n_seg=8) # Collar foam
            add_cylinder_z(v, f, cx, cy, 5, 30, 48, n_seg=6)  # Plant stem
    # Manual Pressure Sprayer Tank & Lance
    add_cylinder_z(v, f, 120, -60, 22, 25, 95, n_seg=8)
    add_cylinder_x(v, f, 40, 120, -60, 85, 3, n_seg=4)
    # 1" Drainage Ball Valve at bottom
    add_cylinder_x(v, f, 140, 175, 0, -80, 14, n_seg=8)
    return build_3ds(v, f)
machines_composites['tps-root-chamber/stage-0'] = comp_tps_stage_0()

def comp_tps_stage_1():
    v, f = [], []
    # Root Tub & Neoprene Collars
    add_box(v, f, -140, 140, -90, 90, -90, 0)
    add_box(v, f, -150, 150, -100, 100, 0, 22)
    for cx in [-90, 0, 90]:
        for cy in [-45, 45]:
            add_cylinder_z(v, f, cx, cy, 18, 20, 35, n_seg=8)
    # 120 PSI Diaphragm Booster Pump on side mount
    add_box(v, f, -140, -70, 95, 145, -75, -25)
    add_cylinder_x(v, f, -135, -75, 120, -50, 22, n_seg=8) # motor
    # Internal Aeroponic Mist Spider Manifold (Inside tub)
    add_cylinder_x(v, f, -100, 100, 0, -50, 6, n_seg=6)
    for nx in [-60, 0, 60]:
        add_cylinder_z(v, f, nx, 0, 8, -50, -35, n_seg=6) # brass nozzle
    # Two-Control BLE Box & OLED readout
    add_box(v, f, 10, 80, 95, 140, -60, -15)
    add_box(v, f, 30, 60, 138, 142, -45, -30)
    return build_3ds(v, f)
machines_composites['tps-root-chamber/stage-1'] = comp_tps_stage_1()

def comp_tps_stage_2():
    v, f = [], []
    # Stage 1 Core
    add_box(v, f, -140, 140, -90, 90, -90, 0)
    add_box(v, f, -150, 150, -100, 100, 0, 22)
    for cx in [-90, 0, 90]:
        for cy in [-45, 45]:
            add_cylinder_z(v, f, cx, cy, 18, 20, 35, n_seg=8)
    add_box(v, f, -140, -70, 95, 145, -75, -25)
    # MLX90614 Non-Contact Infrared Root Temp Pyrometer
    add_cylinder_z(v, f, -90, 0, 10, 22, 45, n_seg=8)
    # Dual Optical Liquid Level Float Switches on side
    add_cylinder_y(v, f, 140, 85, 105, -70, 7, n_seg=6) # low float
    add_cylinder_y(v, f, 140, 85, 105, -30, 7, n_seg=6) # high float
    # 24V Fast-Bleed Anti-Drip Solenoid Valve
    add_cylinder_z(v, f, -50, 120, 12, -75, -45, n_seg=8)
    # ESP32-S3 Root Controller Enclosure
    add_box(v, f, 0, 75, 95, 145, -75, -20)
    return build_3ds(v, f)
machines_composites['tps-root-chamber/stage-2'] = comp_tps_stage_2()

# Write all 27 composite models + architecture
written = []
for key, raw_3ds in machines_composites.items():
    pub_path = f'{BASE}/public/assets/machines/{key}.3ds'
    os.makedirs(os.path.dirname(pub_path), exist_ok=True)
    with open(pub_path, 'wb') as fp: fp.write(raw_3ds)
    written.append((key, len(raw_3ds)))
    print(f'Wrote composite model: {key}.3ds ({len(raw_3ds)} bytes)')

print(f'\nSuccessfully generated {len(written)} 3D composite machine assemblies!')
