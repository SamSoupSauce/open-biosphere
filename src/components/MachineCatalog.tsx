import React, { useState, useMemo } from 'react';
import { Search, Wrench, DollarSign, ExternalLink, ChevronDown, ChevronUp, Layers, CheckCircle2 } from 'lucide-react';

export interface StagedBOMItem {
  name: string;
  sourcing: string;
  cost: number;
}

export interface StagedBOM {
  manual: {
    title: string;
    description: string;
    cost: number;
    items: StagedBOMItem[];
  };
  semiAuto: {
    title: string;
    description: string;
    addonCost: number;
    cumulativeCost: number;
    items: StagedBOMItem[];
  };
  agentic: {
    title: string;
    description: string;
    addonCost: number;
    cumulativeCost: number;
    items: StagedBOMItem[];
  };
}

export interface OpenMachine {
  id: string;
  name: string;
  category: 'Harvesters & Separators' | 'Mobile & Flying Robotics' | 'Grow Chambers & Bioreactors' | 'Automation & Dosing';
  tagline: string;
  standaloneUseCase: string;
  biosphereRole: string;
  estCostUSD: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  primaryCOTS: string[];
  docSlug: string;
  controls: {
    manual: string;
    buttons: string;
    ai: string;
  };
  stagedBOM: StagedBOM;
}

export const MACHINES_DATA: OpenMachine[] = [
  {
    id: 'fluidic-skimmer',
    name: 'Fluidic Skimmer & Dewatering Separator',
    category: 'Harvesters & Separators',
    tagline: 'Continuous aquatic surface biomass skimming & wedge-wire solids dewatering',
    standaloneUseCase: 'Duckweed & azolla harvesting on farm ponds, IBC aquaponics biofiltration, off-grid protein paste processor.',
    biosphereRole: 'Harvests continuous Wolffia protein mat and powers the 5,200-gal moving-bed biological filter loop in Central Basin.',
    estCostUSD: 437,
    difficulty: 'Intermediate',
    primaryCOTS: ['316L Wedge-Wire Screen', '24V Brushless Mag-Pump', 'NEMA 23 Auger', 'ESP32-S3'],
    docSlug: 'fluidic-skimmer-loop',
    controls: {
      manual: 'Counterweighted hand lever raises/lowers weir gate; removable hand crank presses dewatering auger; bypass ball valve.',
      buttons: 'Waterproof IP67 toggle for pump speed (Low/Med/High); momentary push-button for auger forward/reverse jog.',
      ai: 'Overhead optical line-scanner measures frond mat thickness (>8 mm); edge AI dynamically modulates pump GPM and auger speed.',
    },
    stagedBOM: {
      manual: {
        title: 'Stage 1: Manual (Zero-Power Mechanical Base)',
        description: 'Complete gravity-fed skimming, counterweighted weir lever, and hand-crank auger press.',
        cost: 180,
        items: [
          { name: 'Flume Body (1/4" Acrylic / HDPE Chamber)', sourcing: 'Hardware / plastic supply', cost: 45 },
          { name: '316L Stainless Wedge-Wire Screen (150µm)', sourcing: 'Industrial filtration supplier', cost: 65 },
          { name: 'Counterweighted Hand Lever & Weir Gate', sourcing: '3D printed PETG + Delrin pin', cost: 16 },
          { name: 'Dewatering Auger & Hex Hand Crank', sourcing: '3D printed PETG + steel hex shaft', cost: 22 },
          { name: '3-Way Manual L-Port PVC Ball Valve (1.5")', sourcing: 'Plumbing supply', cost: 18 },
          { name: 'K1 Filter Media (10L) + Retention Screen', sourcing: 'Aquaculture supplier', cost: 14 },
        ],
      },
      semiAuto: {
        title: 'Stage 2: Semi-Auto (Push-Button Electromechanical)',
        description: 'Electric magnetic circulation pump, motorized auger drive, and IP67 jog control box.',
        addonCost: 160,
        cumulativeCost: 340,
        items: [
          { name: '24V DC Brushless Magnetic Pump (55 GPM)', sourcing: 'Solar / pond pump supplier', cost: 58 },
          { name: 'NEMA 23 Geared Stepper for Auger Drive', sourcing: '3D printer / CNC supplier', cost: 32 },
          { name: 'IP67 Box with Fwd/Rev Jog & Potentiometer', sourcing: 'Industrial control supplier', cost: 24 },
          { name: 'Dual TB6600 Driver & High-Current Relay', sourcing: 'Maker electronics', cost: 18 },
          { name: '24V 150W MeanWell Power Supply & Breaker', sourcing: 'Industrial electrical supply', cost: 28 },
        ],
      },
      agentic: {
        title: 'Stage 3: Agentic (Autonomous Edge AI & Closed-Loop)',
        description: 'Computer vision frond scanner, automated linear weir positioning, and CAN bus telemetry.',
        addonCost: 97,
        cumulativeCost: 437,
        items: [
          { name: 'Overhead IMX219 NIR/RGB Camera Scanner', sourcing: 'Raspberry Pi / camera supplier', cost: 25 },
          { name: 'ESP32-S3 Dual-Core MCU with CAN Bus', sourcing: 'Open-source maker supply', cost: 18 },
          { name: 'Waterproof Ultrasonic Level Sensor (JSN-SR04T)', sourcing: 'Maker electronics', cost: 14 },
          { name: '12V Micro Linear Actuator (50mm feedback)', sourcing: 'Robotics supplier', cost: 28 },
          { name: 'IP67 M12 CAN/RS-485 Interlock Harness', sourcing: 'Automation supplier', cost: 12 },
        ],
      },
    },
  },
  {
    id: 'sprout-bioreactor',
    name: 'Revolving Sprout Bioreactor Drum',
    category: 'Grow Chambers & Bioreactors',
    tagline: 'Photophobic rotating drum for continuous 4-day hypocotyl protein generation',
    standaloneUseCase: 'Kitchen counter or off-grid cabin appliance producing 3.5 kg of fresh mung bean sprouts every 96 hours without soil or sunlight.',
    biosphereRole: 'Docks into Perimeter Lower Tier maintenance lanes; serviced autonomously by Ground Track AGV.',
    estCostUSD: 281,
    difficulty: 'Beginner',
    primaryCOTS: ['2020 Aluminum Extrusion', 'Perforated Stainless Mesh', 'NEMA 17 Stepper', '12V Ozone Module', 'ESP32-S3'],
    docSlug: 'revolving-sprout-bioreactor',
    controls: {
      manual: 'Removable hand-crank handle with ratchet pawl turns drum twice daily; manual brass valve drains rinse water by gravity.',
      buttons: 'Green tactile panel button jogs drum rotation; rotary mechanical countdown timer dials in misting intervals (0–60 min).',
      ai: 'ESP32-S3 executes precise 96-hour growth schedule, tracking humidity and triggering ozone washes; signals AGV when ripe.',
    },
    stagedBOM: {
      manual: {
        title: 'Stage 1: Manual (Off-Grid Mechanical Tumbler)',
        description: 'Rigid aluminum chassis, perforated stainless drum, detachable hand crank, and gravity drainage.',
        cost: 113,
        items: [
          { name: '2020 T-Slot Black Anodized Extrusion', sourcing: 'Extrusion supplier', cost: 28 },
          { name: '304 Stainless Perforated Drum (300mm dia)', sourcing: 'Metal mesh fabricator', cost: 42 },
          { name: '3D Printed PETG Endcaps & Spindles', sourcing: 'FDM 3D printed', cost: 12 },
          { name: '608-2RS Sealed Ball Bearings (4x)', sourcing: 'Skate hardware supplier', cost: 6 },
          { name: 'Detachable Hand Crank with Ratchet Pawl', sourcing: '3D printed + steel pin', cost: 14 },
          { name: '3/4" Manual Brass Drain Ball Valve', sourcing: 'Plumbing supply', cost: 11 },
        ],
      },
      semiAuto: {
        title: 'Stage 2: Semi-Auto (Push-Button Jog & Dial Mist)',
        description: 'Motorized drum rotation, high-pressure mist pump, and mechanical countdown misting timer.',
        addonCost: 99,
        cumulativeCost: 212,
        items: [
          { name: 'NEMA 17 Geared Planetary Stepper (5.18:1)', sourcing: '3D printer supplier', cost: 24 },
          { name: '24V Diaphragm Mist Pump (100 PSI) & Nozzles', sourcing: 'Hydroponics mist supplier', cost: 34 },
          { name: 'Rotary Countdown Mechanical Timer Dial', sourcing: 'Appliance component', cost: 15 },
          { name: 'Green Tactile Jog Button & Toggle Switch', sourcing: 'Industrial switch supplier', cost: 10 },
          { name: '24V 60W DC Desktop Power Supply', sourcing: 'Electronics supplier', cost: 16 },
        ],
      },
      agentic: {
        title: 'Stage 3: Agentic (Closed-Loop 96h Bioreactor with AGV Handshake)',
        description: 'Autonomous 96h growth cycle controller, humidity tracking, automated ozone wash, and AGV docking.',
        addonCost: 69,
        cumulativeCost: 281,
        items: [
          { name: 'ESP32-S3 NodeMCU Mainboard (FreeRTOS)', sourcing: 'Open-source maker supplier', cost: 14 },
          { name: 'TMC2209 Silent Stepper Driver (Sensorless)', sourcing: '3D printer mainboard parts', cost: 8 },
          { name: 'Sensirion SHT40 Temp/Humidity Probe', sourcing: 'Precision sensor supplier', cost: 12 },
          { name: '12V 200mg/h Ozone Module & Diffuser', sourcing: 'Aquarium sanitation supplier', cost: 19 },
          { name: 'AGV Magnetic Dock Latch & Optical Target', sourcing: 'Robotics maker parts', cost: 16 },
        ],
      },
    },
  },
  {
    id: 'mantis-crawler',
    name: 'Mantis Branch-Crawler Robot',
    category: 'Mobile & Flying Robotics',
    tagline: 'Soft silicone pinch-roller climbing robot with vacuum fruit harvesting pod',
    standaloneUseCase: 'Trellis & espalier orchard harvester navigating guide wires to pick soft berries (figs, mulberries, blackberries) without bruising.',
    biosphereRole: 'Climbs the North-East vertical Trellised Espalier wall wires to harvest dwarf mulberries and goldenberries.',
    estCostUSD: 405,
    difficulty: 'Advanced',
    primaryCOTS: ['Shore 40A Cast Silicone Rollers', 'NEMA 14 Pancake Steppers', 'Raspberry Pi 5 + Hailo AI', 'Micro Rotary Shear'],
    docSlug: 'mantis-branch-crawler',
    controls: {
      manual: 'Bowden cable hand-squeeze lever clamps rollers onto wire/branch; spring-loaded snips on extension pole trim pedicels.',
      buttons: 'Handheld 2.4 GHz RC transmitter with dual thumbsticks for driving and clamping; tactile index trigger fires shear & vacuum.',
      ai: 'On-device YOLOv8 on Raspberry Pi 5 / Jetson Orin detects ripe berries, controls clamping torque to 8.5 N, and auto-shears pedicels.',
    },
    stagedBOM: {
      manual: {
        title: 'Stage 1: Manual (Pole-Mounted Extension Snip & Gripper)',
        description: 'Telescopic manual pole, silicone pinch rollers, Bowden-cable squeeze clamp, and gravity harvest funnel.',
        cost: 93,
        items: [
          { name: 'Cast Shore 40A Silicone Pinch Rollers (2x)', sourcing: 'DIY 3D printed mold casting', cost: 18 },
          { name: 'Telescopic Extension Pole (1.8m to 3.6m)', sourcing: 'Hardware store tool', cost: 24 },
          { name: 'Bowden-Cable Hand Squeeze Clamp Lever', sourcing: 'Bicycle brake lever / cable', cost: 14 },
          { name: 'Spring-Loaded Micro Snips & Gravity Funnel', sourcing: 'Bonsai tools + 3D printed PETG', cost: 19 },
          { name: 'Laser-Cut 2mm Aluminum Frame Plates', sourcing: 'SendCutSend / local CNC', cost: 18 },
        ],
      },
      semiAuto: {
        title: 'Stage 2: Semi-Auto (Tethered RC Joystick Harvester)',
        description: 'Motorized pinch drive, high-speed rotary shear disc, vacuum pod, and handheld RC thumbstick control.',
        addonCost: 135,
        cumulativeCost: 228,
        items: [
          { name: 'NEMA 14 Planetary Steppers (2x)', sourcing: '3D printer extruder supplier', cost: 36 },
          { name: 'High-Speed Coreless 12V Shear Motor', sourcing: 'Micro-robotics supplier', cost: 15 },
          { name: '24V Centrifugal Vacuum Blower Pod', sourcing: '5015 blower fan supplier', cost: 18 },
          { name: '2.4 GHz 4-Channel RC Radio Transmitter', sourcing: 'Hobby RC supplier', cost: 28 },
          { name: 'Dual TMC2208 Stepper Driver Board', sourcing: 'Maker electronics', cost: 16 },
          { name: '4S 1500mAh LiPo / 24V Umbilical Tether', sourcing: 'Battery supplier', cost: 22 },
        ],
      },
      agentic: {
        title: 'Stage 3: Agentic (Autonomous YOLO Vision Branch Harvester)',
        description: 'On-device neural vision on Raspberry Pi 5, stereo pedicel depth tracking, and dynamic torque limiting.',
        addonCost: 177,
        cumulativeCost: 405,
        items: [
          { name: 'Raspberry Pi 5 (4GB) + Hailo-8L AI HAT', sourcing: 'Raspberry Pi ecosystem', cost: 95 },
          { name: 'Dual Sony IMX219 Stereo RGB-NIR Cameras', sourcing: 'Camera supplier', cost: 35 },
          { name: 'Micro-Load Cell Clamping Sensor (8.5N)', sourcing: 'HX711 maker load cell', cost: 14 },
          { name: 'Dual 5V/5A & 12V/3A Buck Regulators', sourcing: 'Power electronics supplier', cost: 15 },
          { name: 'Overhead Gantry Slip-Ring Auto-Dock Latch', sourcing: 'Custom 3D printed + pogo pins', cost: 18 },
        ],
      },
    },
  },
  {
    id: 'ground-agv',
    name: 'Ground Track AGV Pod Carrier',
    category: 'Mobile & Flying Robotics',
    tagline: 'Narrow-aisle continuous-track utility rover with quick-docking canister latch',
    standaloneUseCase: 'Greenhouse & hoop house narrow-aisle material shuttling, seedling tray transport, and low-canopy selective bush harvesting.',
    biosphereRole: 'Traverses Perimeter Lower Tier magnetic tracks to exchange 4-day sprout canisters and pick dwarf bush beans.',
    estCostUSD: 497,
    difficulty: 'Intermediate',
    primaryCOTS: ['Tracked Tank Drive Chassis', 'Dual DC Motor Driver', '24V LiFePO4 Battery', 'LiDAR C1', 'ESP32-S3'],
    docSlug: 'ground-track-agv',
    controls: {
      manual: 'Fold-out steel push tiller handle with gearbox neutral lever; mechanical foot pedal unlatches cargo canister clamp.',
      buttons: 'Heavy-duty 3-button wired pendant (Forward, Reverse, Stop) with speed dial potentiometer; toggle switch for docking latch.',
      ai: 'Autonomous ROS2 stack navigates perimeter magnetic line tape and 2D LiDAR SLAM, shuttling canisters on scheduled cycles.',
    },
    stagedBOM: {
      manual: {
        title: 'Stage 1: Manual (Push-Tiller Utility Cart & Foot Pedal)',
        description: 'All-metal tracked chassis with neutral freewheel gearbox release, push handle, and foot latch pedal.',
        cost: 119,
        items: [
          { name: 'Tracked Chassis & Rubber Treads', sourcing: 'Robotics tank chassis kit', cost: 55 },
          { name: 'Fold-Out Steel Tubular Push Handle', sourcing: 'Hardware store metal stock', cost: 22 },
          { name: 'Mechanical Dog-Clutch Neutral Levers', sourcing: 'Machined / 3D printed dog clutch', cost: 14 },
          { name: 'Mechanical Foot-Pedal Cam Latch', sourcing: 'Cabinet / gate hardware', cost: 16 },
          { name: 'Polyurethane Perimeter Guide Rollers (4x)', sourcing: 'Roller hardware supplier', cost: 12 },
        ],
      },
      semiAuto: {
        title: 'Stage 2: Semi-Auto (Pendant-Driven Power Tug)',
        description: 'Dual 24V planetary gearmotors, 15A smart driver, wired industrial pendant, and LiFePO4 battery pack.',
        addonCost: 213,
        cumulativeCost: 332,
        items: [
          { name: 'Dual 24V 250W Brushed Planetary Motors', sourcing: 'Robotics drive supplier', cost: 48 },
          { name: 'Dual Channel 15A Smart Motor Driver', sourcing: 'Cytron / Sabertooth', cost: 38 },
          { name: 'Heavy-Duty 3-Button Industrial Pendant', sourcing: 'Crane / hoist pendant supplier', cost: 24 },
          { name: '24V 15Ah LiFePO4 Battery Pack with BMS', sourcing: 'Electric mobility / solar store', cost: 85 },
          { name: '12V High-Force Solenoid Canister Latch', sourcing: 'Industrial automation solenoid', cost: 18 },
        ],
      },
      agentic: {
        title: 'Stage 3: Agentic (Autonomous LiDAR & Magnetic Line-Follower)',
        description: 'Autonomous ROS2 pathing, 2D LiDAR obstacle avoidance, magnetic guide navigation, and inductive charging.',
        addonCost: 165,
        cumulativeCost: 497,
        items: [
          { name: 'ESP32-S3 Main Board with CAN Bus', sourcing: 'Maker electronics', cost: 18 },
          { name: '5-Channel Magnetic Track Induction Sensor', sourcing: 'Robotics line sensor supplier', cost: 16 },
          { name: '360° 2D LiDAR Scanner (RPLiDAR C1 / LD06)', sourcing: 'Robotics LiDAR supplier', cost: 68 },
          { name: '3-Axis Articulated Transfer Arm & Servos', sourcing: '3D printed arm kit + MG996R', cost: 38 },
          { name: 'Inductive Floor Wireless Charge Receiver', sourcing: 'Wireless power supplier', cost: 25 },
        ],
      },
    },
  },
  {
    id: 'overhead-gantry',
    name: '2-Axis Precision Overhead Gantry Array',
    category: 'Harvesters & Separators',
    tagline: 'Rigid Cartesian motion array with kinematic magnetic quick-swap toolheads',
    standaloneUseCase: 'Scalable automated garden/greenhouse gantry (FarmBot style) for laser weeding, micro-seeding, and saffron harvesting.',
    biosphereRole: 'Spans the pool perimeter at Z=1,200 mm to position macro optical cameras, micro-tweezers, and purslane shears with 0.15mm precision.',
    estCostUSD: 589,
    difficulty: 'Intermediate',
    primaryCOTS: ['2040 V-Slot Extrusions', 'GT2 9mm Steel Belts', 'NEMA 23 Steppers', 'BTT Octopus Pro (Klipper)', '4K Macro Camera'],
    docSlug: 'overhead-gantry-system',
    controls: {
      manual: 'Disengageable belt-clamp tensioners allow gliding carriages freely by hand; squeeze-cable hand trigger operates toolhead shears.',
      buttons: 'Industrial 6-button directional CNC pendant (X+/-, Y+/-, Z+/-) with Fast/Slow toggle switch; manual toolhead fire button.',
      ai: 'Klipper CAN bus receives Cartesian trajectories from macro vision models to extract saffron stigmas and shear microgreens.',
    },
    stagedBOM: {
      manual: {
        title: 'Stage 1: Manual (Free-Gliding Inspection Carriage & Tool Shears)',
        description: 'Rigid 2040 V-slot frame, aluminum gantry plates, dual V-wheels, and manual hand-squeeze toolhead wand.',
        cost: 177,
        items: [
          { name: '2040 V-Slot Aluminum Extrusions (X/Y Rails)', sourcing: 'OpenBuilds / extrusion supplier', cost: 78 },
          { name: 'Laser-Cut 4mm 6061 Aluminum Wheel Plates (4x)', sourcing: 'SendCutSend / OpenBuilds', cost: 32 },
          { name: 'POM Dual V-Wheels & 625-2RS Bearings (16x)', sourcing: '3D printer wheel kits', cost: 22 },
          { name: 'Quick-Release Belt Clamps for Hand Gliding', sourcing: '3D printed PETG / CNC hardware', cost: 16 },
          { name: 'Handheld Bowden-Cable Toolhead Squeeze Wand', sourcing: 'Bicycle cable + hand lever', cost: 15 },
          { name: 'Kinematic Magnetic Toolhead Base (N52)', sourcing: 'PETG printed + neodymium magnets', cost: 14 },
        ],
      },
      semiAuto: {
        title: 'Stage 2: Semi-Auto (CNC Directional Jog Pendant Array)',
        description: 'NEMA 23 stepper drives, 9mm steel-core belts, industrial 6-button directional jog pendant, and drag chains.',
        addonCost: 216,
        cumulativeCost: 393,
        items: [
          { name: 'GT2 9mm Steel-Core Belts & Pulleys (20m)', sourcing: 'CNC timing belt supplier', cost: 26 },
          { name: 'NEMA 23 High-Torque Steppers (3x: dual Y/X)', sourcing: 'CNC stepper supplier', cost: 68 },
          { name: 'Industrial 6-Button Directional Jog Pendant', sourcing: 'CNC pendant supplier', cost: 28 },
          { name: 'Multi-Axis Stepper Driver Board (TB6600 x3)', sourcing: 'Stepper driver supplier', cost: 34 },
          { name: '24V 250W MeanWell Industrial Power Supply', sourcing: 'Industrial electrical supply', cost: 36 },
          { name: 'Heavy-Duty 15x30mm Nylon Drag Chains (8m)', sourcing: 'CNC cable carrier supplier', cost: 24 },
        ],
      },
      agentic: {
        title: 'Stage 3: Agentic (Autonomous Vision & Kinematic Multi-Toolhead)',
        description: 'Klipper CAN bus orchestration, 4K macro RGB/NIR camera, closed-loop optical encoders, and specialized micro-toolheads.',
        addonCost: 196,
        cumulativeCost: 589,
        items: [
          { name: 'BigTreeTech Octopus Pro (Klipper + CAN)', sourcing: '3D printer / Klipper hardware', cost: 55 },
          { name: 'Sony IMX519 4K RGB Camera & NIR Illuminator', sourcing: 'Precision camera module supplier', cost: 42 },
          { name: 'Closed-Loop Optical Encoders (0.05mm)', sourcing: 'Optical encoder supplier', cost: 45 },
          { name: 'Saffron Micro-Tweezer Silicone Toolhead', sourcing: 'Custom micro-servo + pogo bus', cost: 26 },
          { name: 'Purslane Reciprocating Lateral Shear Toolhead', sourcing: 'Oscillating micro-blade assembly', cost: 28 },
        ],
      },
    },
  },
  {
    id: 'aerial-drone',
    name: 'Aerial Spotter & Pollination Drone',
    category: 'Mobile & Flying Robotics',
    tagline: 'Autonomous ducted micro-quadcopter for resonant buzz-pollination & canopy multispectral mapping',
    standaloneUseCase: 'Indoor greenhouse non-contact acoustic flower pollinator for tomatoes and peppers without bees, plus early disease detection.',
    biosphereRole: 'Flies within canopy airspace using AprilTag localization to pollinate perimeter peppers and scan ripeness indices.',
    estCostUSD: 324,
    difficulty: 'Advanced',
    primaryCOTS: ['85mm Whoop Ducted Frame', '1103 Brushless Motors', 'AIO STM32 Flight Controller', 'PMW3901 Optical Flow', 'AprilTag Tracker'],
    docSlug: 'aerial-pollination-drone',
    controls: {
      manual: 'Handheld telescopic extension wand with passive mechanical vibrating head for direct flower sweeping during inspections.',
      buttons: 'Standard 2.4 GHz RC radio with dual gimbals and physical toggle switch for one-touch locked hover and buzz vibration.',
      ai: 'Optical flow and AprilTag visual fiducial navigation autonomously flies waypoint grid, holding station over blossoms to vibrate pollen.',
    },
    stagedBOM: {
      manual: {
        title: 'Stage 1: Manual (Acoustic Sweep Wand & Inspection Mirror)',
        description: 'Telescopic carbon-fiber wand, mechanical resonant vibration fork, inspection mirror, and pollen brush.',
        cost: 52,
        items: [
          { name: 'Telescopic Carbon-Fiber Wand (1.2m to 2.4m)', sourcing: 'Outdoor / photography tool', cost: 18 },
          { name: 'Passive Mechanical Resonant Vibration Tip', sourcing: 'Acoustic tuning fork assembly', cost: 14 },
          { name: 'Convex Swiveling Inspection Mirror & Loupe', sourcing: 'Inspection tool supplier', cost: 11 },
          { name: 'Camel-Hair Pollen Dusting Brush & Tray', sourcing: 'Botanical supply', cost: 9 },
        ],
      },
      semiAuto: {
        title: 'Stage 2: Semi-Auto (Manual RC Pilot Hover & Buzz Drone)',
        description: 'Ducted whoop quadcopter, brushless motors, flight controller, piezo flower vibrator, and handheld RC radio.',
        addonCost: 173,
        cumulativeCost: 225,
        items: [
          { name: '85mm Ducted Polycarbonate Frame & Guards', sourcing: 'Micro FPV supplier', cost: 14 },
          { name: '1103 10,000KV Brushless Motors & 2" Props (4x)', sourcing: 'Drone motor supplier', cost: 38 },
          { name: 'AIO STM32F4 Flight Controller (12A ESC)', sourcing: 'Betaflight AIO supplier', cost: 42 },
          { name: '2.4 GHz ExpressLRS Radio & Receiver Kit', sourcing: 'RC transmitter store', cost: 45 },
          { name: '2S 450mAh High-Discharge LiPo Flight Packs (4x)', sourcing: 'FPV battery store', cost: 22 },
          { name: 'High-Frequency Piezo Buzz-Pollinator Payload', sourcing: 'Acoustic transducer supplier', cost: 12 },
        ],
      },
      agentic: {
        title: 'Stage 3: Agentic (Autonomous AprilTag Indoor Flight & Docking)',
        description: 'Optical flow hover hold, AprilTag spatial localization, RGB-NIR canopy stream, and automated recharge perch.',
        addonCost: 99,
        cumulativeCost: 324,
        items: [
          { name: 'PMW3901 Optical Flow & VL53L1X ToF Laser', sourcing: 'Maker robotics sensor', cost: 19 },
          { name: 'RunCam Split HD / Micro RGB-NIR Camera', sourcing: 'FPV camera supplier', cost: 32 },
          { name: 'Pi Zero 2W / ESP32-S3 AprilTag Tracker', sourcing: 'Single-board computer store', cost: 22 },
          { name: 'Conical Docking Perch & Copper PCB Charger', sourcing: '3D print + PCB contacts', cost: 26 },
        ],
      },
    },
  },
  {
    id: 'dosing-array',
    name: 'Microclimate & Automated Dosing Array',
    category: 'Automation & Dosing',
    tagline: '6-channel peristaltic nutrient doser, atmospheric CO2 injector, and PID climate regulator',
    standaloneUseCase: 'Universal brain for any grow tent, greenhouse, or DIY hydroponic rig to maintain pH, EC, CO2, and humidity autonomously.',
    biosphereRole: 'Orchestrates water chemistry across the entire 6,000-gal loop, dosing nitrates, phosphates, micronutrients, and pH regulators at 1 Hz.',
    estCostUSD: 436,
    difficulty: 'Beginner',
    primaryCOTS: ['12V Peristaltic Pumps (6x)', 'Isolated pH & EC Probes', 'Sensirion SCD41 CO2', 'ESP32-S3 / Pi CM4', 'MeanWell PSU'],
    docSlug: 'microclimate-dosing-array',
    controls: {
      manual: 'Manual 3-way L-port ball valves gravity-drain measured stock from wall burettes; manual brass needle valve on CO2 tank.',
      buttons: '6 tactile momentary push-buttons for manual pump priming; analog potentiometer dials set dosing volume directly.',
      ai: 'Closed-loop 1 Hz PID algorithm reads isolated pH, EC, temperature, and CO2 electrodes, dispensing micro-doses automatically.',
    },
    stagedBOM: {
      manual: {
        title: 'Stage 1: Manual (Gravity Burettes & Manual Valve Panel)',
        description: 'Acrylic backplane, 6 graduated wall burettes with PTFE stopcocks, 3-way bypass valves, and brass CO2 needle valve.',
        cost: 122,
        items: [
          { name: 'Wall-Mount Pre-Drilled Acrylic Backplane', sourcing: 'Plastics fabricator / maker shop', cost: 22 },
          { name: '250ml Graduated Wall Burettes with Stopcocks (6x)', sourcing: 'Laboratory glassware supplier', cost: 38 },
          { name: '3-Way Manual L-Port PVC Valves (6x 1/4" NPT)', sourcing: 'Plumbing supplier', cost: 28 },
          { name: 'Brass High-Precision CO2 Needle Valve', sourcing: 'Welding / homebrew gas supply', cost: 18 },
          { name: 'Manual Liquid pH & EC Chemical Drop Test Kit', sourcing: 'Hydroponics test supply', cost: 16 },
        ],
      },
      semiAuto: {
        title: 'Stage 2: Semi-Auto (Push-Button Priming & Dial Dosing)',
        description: '6 peristaltic pumps, momentary channel prime push-buttons, volume potentiometer dials, and 12V CO2 solenoid.',
        addonCost: 130,
        cumulativeCost: 252,
        items: [
          { name: '12V DC Peristaltic Pumps & Silicone Tubes (6x)', sourcing: 'Aquarium dosing supplier', cost: 48 },
          { name: 'Waterproof Momentary Prime Push-Buttons (6x)', sourcing: 'Electronics components store', cost: 12 },
          { name: 'Multi-Turn Speed Calibration Potentiometers (6x)', sourcing: 'Electronics supply', cost: 16 },
          { name: 'ULN2803A Darlington Transistor / Relay Array', sourcing: 'Maker electronics', cost: 12 },
          { name: '12V 5A MeanWell Power Supply & Rocker Switch', sourcing: 'Industrial electrical supplier', cost: 24 },
          { name: '12V DC Brass CO2 Solenoid Valve', sourcing: 'Aquarium / brewery supplier', cost: 18 },
        ],
      },
      agentic: {
        title: 'Stage 3: Agentic (Closed-Loop PID Chemistry & CAN Telemetry)',
        description: 'Electrically isolated industrial pH/EC sensors, SCD41 photoacoustic CO2 sensor, ESP32-S3 brain, and CAN bus.',
        addonCost: 184,
        cumulativeCost: 436,
        items: [
          { name: 'Atlas Scientific Isolated pH & EC Probes + EZO', sourcing: 'Precision water sensors', cost: 85 },
          { name: 'Sensirion SCD41 Photoacoustic CO2/Temp/RH', sourcing: 'Maker sensor supplier', cost: 28 },
          { name: 'ESP32-S3 Dev Board / Pi CM4 with Carrier', sourcing: 'Embedded compute supplier', cost: 35 },
          { name: 'Isolated RS-485 Modbus / CAN Bus Module', sourcing: 'Industrial interface supplier', cost: 14 },
          { name: 'IP65 Weatherproof ABS Enclosure & Glands', sourcing: 'Electrical supply', cost: 22 },
        ],
      },
    },
  },
  {
    id: 'tps-chamber',
    name: 'TPS Aeroponic Root-Zone Chamber',
    category: 'Grow Chambers & Bioreactors',
    tagline: 'Light-sealed aeroponic root misting box for continuous true potato seed mini-tuber generation',
    standaloneUseCase: 'Pathogen-free seed potato production from lightweight botanical seeds, saving 95% water with zero soil handling.',
    biosphereRole: 'Suspended in Central Basin misting bays; allows gantry suction toolhead to pick tubers while vines stay productive for 120+ days.',
    estCostUSD: 290,
    difficulty: 'Beginner',
    primaryCOTS: ['Heavy-Duty HDPE Tub', 'EPDM Light Seals', '120 PSI Booster Pump', 'Brass Misting Nozzles', 'ESP32-C3 Relay'],
    docSlug: 'tps-root-chamber',
    controls: {
      manual: 'External hand-pump garden sprayer connects to silicone misting port; light-baffled inspection hatch opens for hand picking.',
      buttons: 'Rocker switch for continuous pump power; spring-wound mechanical dial timer runs 15-minute misting sessions without code.',
      ai: 'ESP32-C3 cycles 50 µm ultrasonic mist every 180 seconds based on transpiration; signals overhead gantry to pick ripe tubers.',
    },
    stagedBOM: {
      manual: {
        title: 'Stage 1: Manual (Hand-Pump Sprayer & Baffled Inspection Hatch)',
        description: 'Opaque 160L HDPE tote, clone collar lid, labyrinth light seals, manual garden sprayer, and gravity drain.',
        cost: 105,
        items: [
          { name: 'Heavy-Duty Opaque HDPE Storage Tote (160L)', sourcing: 'Farm supply / hardware store', cost: 38 },
          { name: 'HDPE Lid with 2-inch Neoprene Collars (24x)', sourcing: 'Hydroponics cloning supply', cost: 18 },
          { name: 'Dual-Labyrinth EPDM Foam Light Seals', sourcing: 'Automotive weatherstrip supplier', cost: 16 },
          { name: '2-Gallon Hand-Pump Pressure Garden Sprayer', sourcing: 'Garden supply store', cost: 19 },
          { name: '1-inch PVC Bulkhead Drain & Sediment Trap', sourcing: 'Aquarium bulkhead supplier', cost: 14 },
        ],
      },
      semiAuto: {
        title: 'Stage 2: Semi-Auto (Mechanical Timer & High-Pressure Pump)',
        description: '120 PSI diaphragm booster pump, brass misting nozzles, spring-wound countdown dial timer, and DC power supply.',
        addonCost: 114,
        cumulativeCost: 219,
        items: [
          { name: '24V DC Booster Pump (120 PSI, 1.2 GPM)', sourcing: 'Reverse osmosis booster pump', cost: 48 },
          { name: 'Brass Misting Nozzles (0.3mm, 6x) + 1/4" Line', sourcing: 'Patio cooling kit supplier', cost: 22 },
          { name: 'Spring-Wound Countdown Dial Timer (0–60m)', sourcing: 'Mechanical timer supplier', cost: 16 },
          { name: 'Waterproof Rocker Switch & Thermal Fuse', sourcing: 'Marine electrical store', cost: 10 },
          { name: '24V 3A DC Desktop Power Supply', sourcing: 'Electronics supplier', cost: 18 },
        ],
      },
      agentic: {
        title: 'Stage 3: Agentic (Ultrasonic Transpiration Cycling & Gantry Handshake)',
        description: 'Transpiration IR temperature sensing, dry-run float protections, fast-cutoff solenoid, and gantry harvest interlock.',
        addonCost: 71,
        cumulativeCost: 290,
        items: [
          { name: 'ESP32-C3 Relay Module (Optoisolated)', sourcing: 'Maker electronics', cost: 14 },
          { name: 'Dual Optical Float Sensors (Dry-Run Guard)', sourcing: 'Aquarium level sensors', cost: 12 },
          { name: 'MLX90614 Non-Contact IR Root Temp Sensor', sourcing: 'Precision sensor store', cost: 16 },
          { name: '24V Depressurization Solenoid (Instant Cut)', sourcing: 'Pneumatics supplier', cost: 15 },
          { name: 'Gantry Suction Docking Collar & CAN Trigger', sourcing: '3D printed + CAN bus node', cost: 14 },
        ],
      },
    },
  },
];

export default function MachineCatalog() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'cost_asc' | 'cost_desc' | 'name'>('cost_asc');
  const [expandedControlId, setExpandedControlId] = useState<string | null>(null);
  const [expandedBOMId, setExpandedBOMId] = useState<string | null>(null);
  const [activeStageTab, setActiveStageTab] = useState<Record<string, 'manual' | 'semiAuto' | 'agentic'>>({});

  const categories = ['ALL', 'Harvesters & Separators', 'Mobile & Flying Robotics', 'Grow Chambers & Bioreactors', 'Automation & Dosing'];

  const filteredMachines = useMemo(() => {
    return MACHINES_DATA.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.standaloneUseCase.toLowerCase().includes(search.toLowerCase()) ||
        m.controls.manual.toLowerCase().includes(search.toLowerCase()) ||
        m.controls.buttons.toLowerCase().includes(search.toLowerCase()) ||
        m.primaryCOTS.some((c) => c.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;

      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      if (sortBy === 'cost_asc') return a.estCostUSD - b.estCostUSD;
      if (sortBy === 'cost_desc') return b.estCostUSD - a.estCostUSD;
      return a.name.localeCompare(b.name);
    });
  }, [search, selectedCategory, sortBy]);

  const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

  const getDifficultyBadge = (diff: OpenMachine['difficulty']) => {
    if (diff === 'Beginner') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (diff === 'Intermediate') return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  };

  return (
    <div className="space-y-6 not-content font-sans">
      {/* Search and Filter Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-emerald-400" />
              Open-Hardware Machine Registry
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Built from accessible COTS parts. Operable via <strong>Manual Levers/Valves</strong>, <strong>Physical Buttons/Servos</strong>, or <strong>Autonomous AI</strong>.
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search parts, controls, uses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Category Pills & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="cost_asc">Build Cost (Low to High)</option>
              <option value="cost_desc">Build Cost (High to Low)</option>
              <option value="name">Machine Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Machine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMachines.map((machine) => {
          const isControlsOpen = expandedControlId === machine.id;
          const isBOMOpen = expandedBOMId === machine.id;
          const currentStage = activeStageTab[machine.id] || 'manual';
          const currentStageData = machine.stagedBOM[currentStage];

          return (
            <div
              key={machine.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between shadow-md transition-all hover:shadow-emerald-950/20"
            >
              <div>
                {/* Header Badges */}
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                    {machine.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${getDifficultyBadge(machine.difficulty)}`}>
                      {machine.difficulty}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-200 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700">
                      <span className="text-amber-400 font-mono" title="Stage 1: Manual Base">${machine.stagedBOM.manual.cost}</span>
                      <span className="text-slate-500">/</span>
                      <span className="text-sky-400 font-mono" title="Stage 2: Semi-Auto Cumulative">${machine.stagedBOM.semiAuto.cumulativeCost}</span>
                      <span className="text-slate-500">/</span>
                      <span className="text-purple-400 font-mono" title="Stage 3: Full Agentic Build">${machine.stagedBOM.agentic.cumulativeCost}</span>
                    </div>
                  </div>
                </div>

                {/* Title & Tagline */}
                <h4 className="text-base font-bold text-slate-100 hover:text-emerald-300 transition-colors">
                  <a href={`${baseUrl}/hardware/${machine.docSlug}`}>
                    {machine.name}
                  </a>
                </h4>
                <p className="text-xs text-slate-400 mt-1 mb-3">
                  {machine.tagline}
                </p>

                {/* Standalone Use Case Card */}
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 text-xs mb-3 space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                    <span>🏡 Standalone Homestead & Off-Grid Use</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {machine.standaloneUseCase}
                  </p>
                </div>

                {/* Tri-Modal Controls Collapsible */}
                <div className="bg-slate-950/60 border border-slate-800/90 rounded-lg p-2.5 mb-2.5">
                  <button
                    onClick={() => setExpandedControlId(isControlsOpen ? null : machine.id)}
                    className="w-full flex justify-between items-center text-xs font-semibold text-slate-300 hover:text-emerald-300 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs">🕹️</span>
                      <span>Tri-Modal Controls (Manual / Buttons / AI)</span>
                    </span>
                    {isControlsOpen ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  {isControlsOpen && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-2 text-[11px]">
                      <div className="bg-amber-950/20 border border-amber-900/30 rounded p-2 text-amber-200">
                        <strong className="text-amber-300 block mb-0.5">✋ Tier 1: 100% Manual (Zero Electricity)</strong>
                        <p className="text-slate-300 text-[10.5px] leading-relaxed">{machine.controls.manual}</p>
                      </div>

                      <div className="bg-sky-950/20 border border-sky-900/30 rounded p-2 text-sky-200">
                        <strong className="text-sky-300 block mb-0.5">🔘 Tier 2: Buttons & Dials (No Code)</strong>
                        <p className="text-slate-300 text-[10.5px] leading-relaxed">{machine.controls.buttons}</p>
                      </div>

                      <div className="bg-purple-950/20 border border-purple-900/30 rounded p-2 text-purple-200">
                        <strong className="text-purple-300 block mb-0.5">🤖 Tier 3: Autonomous AI & Sensor Loop</strong>
                        <p className="text-slate-300 text-[10.5px] leading-relaxed">{machine.controls.ai}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Staged BOM Collapsible */}
                <div className="bg-slate-950/60 border border-slate-800/90 rounded-lg p-2.5 mb-3">
                  <button
                    onClick={() => setExpandedBOMId(isBOMOpen ? null : machine.id)}
                    className="w-full flex justify-between items-center text-xs font-semibold text-slate-300 hover:text-emerald-300 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Staged BOM (Manual / Semi-Auto / Agentic)</span>
                    </span>
                    {isBOMOpen ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  {isBOMOpen && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-2.5 text-[11px]">
                      {/* Stage Tab Buttons */}
                      <div className="grid grid-cols-3 gap-1 bg-slate-900/80 p-1 rounded-md border border-slate-800 text-[10px]">
                        <button
                          onClick={() => setActiveStageTab(prev => ({ ...prev, [machine.id]: 'manual' }))}
                          className={`py-1 px-1.5 rounded font-medium transition-colors text-center ${
                            currentStage === 'manual'
                              ? 'bg-amber-600/90 text-white shadow-sm'
                              : 'text-amber-300/80 hover:bg-slate-800'
                          }`}
                        >
                          1. Manual (${machine.stagedBOM.manual.cost})
                        </button>
                        <button
                          onClick={() => setActiveStageTab(prev => ({ ...prev, [machine.id]: 'semiAuto' }))}
                          className={`py-1 px-1.5 rounded font-medium transition-colors text-center ${
                            currentStage === 'semiAuto'
                              ? 'bg-sky-600/90 text-white shadow-sm'
                              : 'text-sky-300/80 hover:bg-slate-800'
                          }`}
                        >
                          2. Semi (+${machine.stagedBOM.semiAuto.addonCost})
                        </button>
                        <button
                          onClick={() => setActiveStageTab(prev => ({ ...prev, [machine.id]: 'agentic' }))}
                          className={`py-1 px-1.5 rounded font-medium transition-colors text-center ${
                            currentStage === 'agentic'
                              ? 'bg-purple-600/90 text-white shadow-sm'
                              : 'text-purple-300/80 hover:bg-slate-800'
                          }`}
                        >
                          3. AI (+${machine.stagedBOM.agentic.addonCost})
                        </button>
                      </div>

                      {/* Selected Stage Content */}
                      <div className="bg-slate-950/70 border border-slate-800 rounded p-2.5 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h5 className="font-semibold text-slate-200 text-xs">
                              {currentStageData.title}
                            </h5>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {currentStageData.description}
                            </p>
                          </div>
                          <span className="font-mono font-bold text-xs text-emerald-400 shrink-0">
                            {currentStage === 'manual'
                              ? `$${machine.stagedBOM.manual.cost}`
                              : `+$${(currentStageData as any).addonCost} (Total: $${(currentStageData as any).cumulativeCost})`}
                          </span>
                        </div>

                        {/* Itemized Parts Table */}
                        <div className="space-y-1 pt-1.5 border-t border-slate-800/60">
                          {currentStageData.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[10px] py-0.5 border-b border-slate-900/60 last:border-0">
                              <span className="text-slate-300 truncate pr-2">{item.name}</span>
                              <span className="font-mono text-slate-400 shrink-0">${item.cost}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Master Biosphere Role */}
                <div className="text-[11px] text-slate-400 mb-3">
                  <strong className="text-slate-300">Biosphere Interlock: </strong>
                  {machine.biosphereRole}
                </div>

                {/* COTS Parts Pills */}
                <div className="mb-4">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1.5">
                    Core COTS / Standard Parts
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {machine.primaryCOTS.map((part, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-800/90 text-slate-300 border border-slate-700/60 px-2 py-0.5 rounded"
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Link Button */}
              <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                <span className="text-slate-500 text-[11px]">COTS BOM & Assembly Guide</span>
                <a
                  href={`${baseUrl}/hardware/${machine.docSlug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
                >
                  <span>Full Open-Hardware Spec</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
