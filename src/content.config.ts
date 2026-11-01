/**
 * Kolekcje treści (docs/sections/03-realizacje.md, Dane).
 *
 * realizacje: jeden plik .md na projekt w src/content/realizacje/, nazwa pliku to slug w URL.
 * Układ strony projektu stoi w frontmatterze (blocks), body pliku nie jest używane.
 * Wpisy z demo: true to treść DEMO do oceny wyglądu, do usunięcia przed wdrożeniem (D3).
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { techKeys } from './data/tech-keys';

const tags = z.enum(['Aplikacja', 'Integracje', 'Automatyzacja', 'AI', 'Utrzymanie']);

const realizacje = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/realizacje' }),
  schema: ({ image }) => {
    const text = z.object({
      type: z.literal('text'),
      title: z.string(),
      body: z.array(z.string()).min(1),
    });
    const media = z.object({
      type: z.literal('media'),
      image: image(),
      alt: z.string(),
      caption: z.string().optional(),
    });
    const pair = z.object({
      type: z.literal('pair'),
      desktop: image(),
      desktopAlt: z.string(),
      mobile: image(),
      mobileAlt: z.string(),
    });
    const tech = z.object({
      type: z.literal('tech'),
      title: z.string(),
      body: z.array(z.string()).default([]),
    });

    return z.object({
      title: z.string(),
      summary: z.string(),
      tags: z.array(tags).min(1),
      order: z.number().int(),
      featured: z.boolean().default(false),
      demo: z.boolean().default(false),
      cover: image(),
      coverAlt: z.string(),
      live: z.enum(['flota', 'faktury', 'przeplywy', 'serwis']).optional(),
      facts: z
        .object({
          industry: z.string().optional(),
          scope: z.string().optional(),
          year: z.number().int().optional(),
          status: z.string().optional(),
        })
        .default({}),
      tech: z.array(z.enum(techKeys)).default([]),
      url: z.url().optional(),
      blocks: z.array(z.discriminatedUnion('type', [text, media, pair, tech])).default([]),
    });
  },
});

export const collections = { realizacje };
