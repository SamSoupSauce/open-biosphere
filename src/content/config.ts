import { defineCollection, z } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    schema: docsSchema({
      extend: z.object({
        id: z.string().optional(),
        classification: z.string().optional(),
        fabrication_method: z.string().optional(),
        material: z.string().optional(),
        model_file: z.string().optional(),
        estimated_cost: z.number().optional(),
        dimensions: z.object({
          x_mm: z.number().optional(),
          y_mm: z.number().optional(),
          z_mm: z.number().optional(),
        }).optional(),
      }),
    }),
  }),
};

