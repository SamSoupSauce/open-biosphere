import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://samsoupsauce.github.io',
  base: '/open-biosphere',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    starlight({
      title: 'Open Biosphere',
      description: 'Autonomous Closed Biosphere Agriculture, Robotics & Continuous Crop Auditing Wiki',
      logo: {
        dark: './src/assets/logo-dark.svg',
        light: './src/assets/logo-light.svg',
        replacesTitle: false,
      },
      customCss: ['./src/styles/global.css'],
      social: {
        github: 'https://github.com/SamSoupSauce/open-biosphere',
      },
      sidebar: [
        {
          label: 'Overview & Blueprint',
          items: [
            { label: 'System Architecture & Umbrella Philosophy', slug: 'overview/architecture' },
            { label: 'Tri-Modal Control Standard (Manual, Buttons, AI)', slug: 'overview/tri-modal-control' },
            { label: 'Master Biosphere Assembly Guide', slug: 'overview/master-assembly' },
            { label: 'Spatial Envelope & Datum', slug: 'overview/spatial-datum' },
            { label: 'Audit & Ticket Pipeline', slug: 'overview/pipeline' },
          ],
        },
        {
          label: 'Open-Hardware Machine Registry',
          items: [
            { label: 'Interactive Machine Catalogue', slug: 'hardware/catalog' },
            {
              label: 'Fluidic Skimmer & Dewatering Separator',
              collapsed: true,
              items: [
                { label: 'Overview & Specifications', slug: 'hardware/fluidic-skimmer-loop' },
                { label: 'Stage 0: Zero-Power Baseline', slug: 'hardware/fluidic-skimmer-loop/stage-0' },
                { label: 'Stage 1: BLE Electromechanical', slug: 'hardware/fluidic-skimmer-loop/stage-1' },
                { label: 'Stage 2: Agentic Autonomous AI', slug: 'hardware/fluidic-skimmer-loop/stage-2' },
              ],
            },
            {
              label: 'Revolving Sprout Bioreactor Drum',
              collapsed: true,
              items: [
                { label: 'Overview & Specifications', slug: 'hardware/revolving-sprout-bioreactor' },
                { label: 'Stage 0: Zero-Power Baseline', slug: 'hardware/revolving-sprout-bioreactor/stage-0' },
                { label: 'Stage 1: BLE Electromechanical', slug: 'hardware/revolving-sprout-bioreactor/stage-1' },
                { label: 'Stage 2: Agentic Autonomous AI', slug: 'hardware/revolving-sprout-bioreactor/stage-2' },
              ],
            },
            {
              label: 'Mantis Branch-Crawler Robot',
              collapsed: true,
              items: [
                { label: 'Overview & Specifications', slug: 'hardware/mantis-branch-crawler' },
                { label: 'Stage 0: Zero-Power Baseline', slug: 'hardware/mantis-branch-crawler/stage-0' },
                { label: 'Stage 1: BLE Electromechanical', slug: 'hardware/mantis-branch-crawler/stage-1' },
                { label: 'Stage 2: Agentic Autonomous AI', slug: 'hardware/mantis-branch-crawler/stage-2' },
              ],
            },
            {
              label: 'Ground Track AGV Pod Carrier',
              collapsed: true,
              items: [
                { label: 'Overview & Specifications', slug: 'hardware/ground-track-agv' },
                { label: 'Stage 0: Zero-Power Baseline', slug: 'hardware/ground-track-agv/stage-0' },
                { label: 'Stage 1: BLE Electromechanical', slug: 'hardware/ground-track-agv/stage-1' },
                { label: 'Stage 2: Agentic Autonomous AI', slug: 'hardware/ground-track-agv/stage-2' },
              ],
            },
            {
              label: '2-Axis Overhead Gantry Array',
              collapsed: true,
              items: [
                { label: 'Overview & Specifications', slug: 'hardware/overhead-gantry-system' },
                { label: 'Stage 0: Zero-Power Baseline', slug: 'hardware/overhead-gantry-system/stage-0' },
                { label: 'Stage 1: BLE Electromechanical', slug: 'hardware/overhead-gantry-system/stage-1' },
                { label: 'Stage 2: Agentic Autonomous AI', slug: 'hardware/overhead-gantry-system/stage-2' },
              ],
            },
            {
              label: 'Aerial Spotter & Pollinator Drone',
              collapsed: true,
              items: [
                { label: 'Overview & Specifications', slug: 'hardware/aerial-pollination-drone' },
                { label: 'Stage 0: Zero-Power Baseline', slug: 'hardware/aerial-pollination-drone/stage-0' },
                { label: 'Stage 1: BLE Electromechanical', slug: 'hardware/aerial-pollination-drone/stage-1' },
                { label: 'Stage 2: Agentic Autonomous AI', slug: 'hardware/aerial-pollination-drone/stage-2' },
              ],
            },
            {
              label: 'Microclimate & Automated Dosing Array',
              collapsed: true,
              items: [
                { label: 'Overview & Specifications', slug: 'hardware/microclimate-dosing-array' },
                { label: 'Stage 0: Zero-Power Baseline', slug: 'hardware/microclimate-dosing-array/stage-0' },
                { label: 'Stage 1: BLE Electromechanical', slug: 'hardware/microclimate-dosing-array/stage-1' },
                { label: 'Stage 2: Agentic Autonomous AI', slug: 'hardware/microclimate-dosing-array/stage-2' },
              ],
            },
            {
              label: 'TPS Aeroponic Root-Zone Chamber',
              collapsed: true,
              items: [
                { label: 'Overview & Specifications', slug: 'hardware/tps-root-chamber' },
                { label: 'Stage 0: Zero-Power Baseline', slug: 'hardware/tps-root-chamber/stage-0' },
                { label: 'Stage 1: BLE Electromechanical', slug: 'hardware/tps-root-chamber/stage-1' },
                { label: 'Stage 2: Agentic Autonomous AI', slug: 'hardware/tps-root-chamber/stage-2' },
              ],
            },
          ],
        },
        {
          label: 'Candidate Crop Database',
          items: [
            { label: 'Interactive Crop Matrix', slug: 'crops/matrix' },
            { label: 'Wolffia globosa (Asian Watermeal)', slug: 'crops/wolffia-globosa' },
            { label: 'Wasabia japonica (True Wasabi)', slug: 'crops/wasabia-japonica' },
            { label: 'Portulaca oleracea (Purslane)', slug: 'crops/portulaca-oleracea' },
            { label: 'Solanum tuberosum (Aeroponic Potato)', slug: 'crops/solanum-tuberosum' },
            { label: 'Crocus sativus (Saffron)', slug: 'crops/crocus-sativus' },
            { label: 'Physalis peruviana (Goldenberry)', slug: 'crops/physalis-peruviana' },
            { label: 'Abelmoschus esculentus (Dwarf Okra)', slug: 'crops/abelmoschus-esculentus' },
            { label: 'Monostroma nitidum (Sea Lettuce)', slug: 'crops/monostroma-nitidum' },
            { label: 'Morus alba (Bush Mulberry)', slug: 'crops/morus-alba' },
            { label: 'Phaseolus vulgaris (Bush Bean)', slug: 'crops/phaseolus-vulgaris' },
            { label: 'Capsicum annuum (Bush Pepper)', slug: 'crops/capsicum-annuum' },
            { label: 'Vigna radiata (Mung Bean Hypocotyl)', slug: 'crops/vigna-radiata' },
          ],
        },
        {
          label: 'Spatial Zones',
          items: [
            { label: 'Interactive Enclosure Blueprint', slug: 'zones/map' },
            { label: 'Central Basin (160 sq ft)', slug: 'zones/central-basin' },
            { label: 'Perimeter Lower Tier (40 sq ft)', slug: 'zones/perimeter-lower-tier' },
            { label: 'Perimeter Mid Tier (40 sq ft)', slug: 'zones/perimeter-mid-tier' },
            { label: 'Trellised Espalier (40 sq ft)', slug: 'zones/trellised-espalier' },
          ],
        },
        {
          label: 'Global Part Registry',
          items: [
            { label: 'Canonical Part Catalog', slug: 'parts/catalog' },
            { label: 'Mechanical Components', slug: 'parts/mechanical' },
            { label: 'Electrical & Compute', slug: 'parts/electrical' },
            { label: 'Fluidic & Pneumatic', slug: 'parts/fluidic' },
            { label: 'Custom Fabricated', slug: 'parts/custom-fab' },
          ],
        },
        {
          label: 'Specifications & RFCs',
          items: [
            { label: 'RFC Kanban Board', slug: 'rfcs/board' },
            { label: 'RFC-0001: Biosphere Baseline', slug: 'rfcs/rfc-0001-biosphere-baseline' },
            { label: 'RFC-0002: Mantis Roller Kinematics', slug: 'rfcs/rfc-0002-mantis-crawler-kinematics' },
            { label: 'RFC-0003: TPS Aeroponic Root Shields', slug: 'rfcs/rfc-0003-tps-potato-root-shields' },
            { label: 'RFC-0004: Controller-Node-Tool Architecture', slug: 'rfcs/rfc-0004-controller-node-tool' },
            { label: 'RFC-0005: Hardware Interlocks & BLE Virtual Panel', slug: 'rfcs/rfc-0005-hardware-interlocks-ble-virtual-panel' },
            { label: 'RFC-0006: Agnostic Controller Runtime', slug: 'rfcs/rfc-0006-agnostic-controller-runtime' },
            { label: 'RFC-0007: Multi-Stage Machine Sub-Page Architecture', slug: 'rfcs/rfc-0007-multi-stage-sub-page-architecture' },
            { label: 'RFC-0008: Global Part Registry & BOM Schema', slug: 'rfcs/rfc-0008-global-part-registry-bom-schema' },
            { label: 'RFC-0009: Helical Shutter Solar Roof', slug: 'rfcs/rfc-0009-helical-shutter-solar-roof' },
          ],
        },
      ],
    }),
    react(),
  ],
});
