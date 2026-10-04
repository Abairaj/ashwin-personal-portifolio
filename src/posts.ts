import { getCollection, type CollectionEntry } from 'astro:content';
import path from 'node:path';
import sample from './assets/sample.jpg';
import { readingTime } from './config';

export interface Post {
  id: string;
  entry: CollectionEntry<'blog'>;
  title: string;
  description: string;
  date: Date;
  updated?: Date;
  category: string;
  // Remote covers are URL strings, local ones are optimised image imports.
  cover: ImageMetadata | string;
  hasCover: boolean;
  minutes: number;
}

const IMAGES_DIR = 'src/content/blog/images';

const localImages = import.meta.glob<{ default: ImageMetadata }>('/src/**/*.{jpg,jpeg,png,webp,avif,gif}', {
  eager: true,
});

function resolveCover(entry: CollectionEntry<'blog'>): ImageMetadata | string | undefined {
  const cover = entry.data.cover?.trim();
  if (!cover) return undefined;
  if (/^https?:\/\//.test(cover)) return cover;
  // Look next to the post first, then in the shared images folder.
  const dir = path.posix.dirname(entry.filePath ?? 'src/content/blog/post.md');
  const candidates = [path.posix.join(dir, cover), path.posix.join(IMAGES_DIR, path.posix.basename(cover))];
  return candidates.map((file) => localImages[`/${file}`]?.default).find(Boolean);
}

// First real paragraph of the post, as plain text.
function excerpt(body = '') {
  const paragraph = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !/^(#|>|!\[|[-*+] |\d+\. |```|<)/.test(block));
  const text = (paragraph ?? '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ');
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text;
}

function titleFromId(id: string) {
  const words = id.split('/').pop()!.replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export async function getPosts(): Promise<Post[]> {
  const entries = await getCollection('blog', ({ data }) => !data.draft);
  return entries
    .map((entry) => {
      const cover = resolveCover(entry);
      const title = entry.data.title?.trim() || titleFromId(entry.id);
      return {
        id: entry.id,
        entry,
        title,
        description: entry.data.description?.trim() || excerpt(entry.body) || title,
        date: (entry.data.date ?? entry.data.pubDate)!,
        updated: entry.data.updatedDate,
        category: entry.data.category?.trim() || 'General',
        cover: cover ?? sample,
        hasCover: Boolean(cover),
        minutes: readingTime(entry.body),
      };
    })
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());
}
