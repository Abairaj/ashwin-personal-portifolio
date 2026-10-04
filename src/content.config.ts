import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { slugify } from './slug';

// Kept deliberately loose so a post can't break the build over a typo:
// only a date is required, everything else has a fallback in src/posts.ts.
const blog = defineCollection({
  loader: glob({
    // Ignored: next-blog.md (the template writers rename to publish), files
    // starting with "_", and the images folder.
    pattern: ['**/*.md', '!next-blog.md', '!**/_*.md', '!images/**'],
    base: './src/content/blog',
    // URL comes from the file name: "My_First Post.md" → /writing/my-first-post/
    generateId: ({ entry }) => slugify(entry.replace(/\.md$/, '')),
  }),
  schema: z
    .object({
      title: z.coerce.string().optional(),
      description: z.coerce.string().optional(),
      date: z.coerce.date().optional(),
      pubDate: z.coerce.date().optional(),
      updatedDate: z.coerce.date().optional(),
      category: z.coerce.string().optional(),
      // An image URL, or a path to an image file relative to the post.
      cover: z.string().optional(),
      draft: z.boolean().default(false),
    })
    .refine((data) => data.date || data.pubDate, {
      message: 'Add a date to the top of the post, e.g. "date: 2026-10-03"',
    }),
});

export const collections = { blog };
