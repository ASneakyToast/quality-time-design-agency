import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projectsCollection = defineCollection({
  loader: glob({ pattern: '**/index.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      client: z.string(),
      year: z.number().min(2000).max(2030),
      heroImage: image(),
      thumbnail: image(),
      gallery: z.array(image()).optional(),
      services: z.array(
        z.enum([
          'branding',
          'web-design',
          'ui-ux',
          'print',
          'packaging',
          'illustration',
          'motion',
          'photography',
        ])
      ),
      industry: z.string().optional(),
      featured: z.boolean().default(false),
      order: z.number().optional(),
      accentColor: z.string().optional(),
      clientLogo: image().optional(),
      description: z.string().max(200),
      publishedDate: z.coerce.date(),
      liveUrl: z.string().url().optional(),
      credits: z
        .array(
          z.object({
            role: z.string(),
            name: z.string(),
          })
        )
        .optional(),
      designer: z.union([z.string(), z.array(z.string())]).optional(),
      draft: z.boolean().default(false),
      category: z.enum(['branding', 'book']).default('branding'),
    }),
});

const designersCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/designers' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string(),
      bio: z.string(),
      photo: image().optional(),
      email: z.string().email().optional(),
      website: z.string().url().optional(),
      social: z
        .object({
          instagram: z.string().optional(),
          twitter: z.string().optional(),
          linkedin: z.string().optional(),
        })
        .optional(),
      order: z.number().default(0),
    }),
});

export const collections = {
  projects: projectsCollection,
  designers: designersCollection,
};
