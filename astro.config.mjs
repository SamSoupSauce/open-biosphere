import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://open-biosphere.github.io',
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
        github: 'https://github.com/open-biosphere/open-biosphere',
      },
      sidebar: [
        {
          label: 'Overview & Blueprint',
          items: [
            { label: 'System Architecture', slug: 'overview/architecture' },
            { label: 'Spatial Envelope & Datum', slug: 'overview/spatial-datum' },
            { label: 'Audit & Ticket Pipeline', slug: 'overview/pipeline' },
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
          label: 'Hardware & Robotics Subsystems',
          items: [
            { label: 'Aerial Spotter & Pollinator Drone', slug: 'hardware/aerial-pollination-drone' },
            { label: 'Mantis Branch-Crawler Robot', slug: 'hardware/mantis-branch-crawler' },
            { label: 'Ground Track AGV Pod Carrier', slug: 'hardware/ground-track-agv' },
            { label: 'Fluidic Skimmer & Dewatering Loop', slug: 'hardware/fluidic-skimmer-loop' },
            { label: '2-Axis Overhead Gantry Array', slug: 'hardware/overhead-gantry-system' },
            { label: 'Microclimate Hood & Dosing Unit', slug: 'hardware/microclimate-dosing-array' },
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
          label: 'Specifications & RFCs',
          items: [
            { label: 'RFC Kanban Board', slug: 'rfcs/board' },
            { label: 'RFC-0001: Biosphere Baseline', slug: 'rfcs/rfc-0001-biosphere-baseline' },
            { label: 'RFC-0002: Mantis Roller Kinematics', slug: 'rfcs/rfc-0002-mantis-crawler-kinematics' },
            { label: 'RFC-0003: TPS Aeroponic Root Shields', slug: 'rfcs/rfc-0003-tps-potato-root-shields' },
          ],
        },
      ],
    }),
    react(),
  ],
});
