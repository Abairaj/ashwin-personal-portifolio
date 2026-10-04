import { readingTime } from '../config';
import { slugify } from '../slug';
import { query } from './db';
import { cleanImageUrl, sanitizeContent, textOnly } from './sanitize';

export interface Post {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  // An uploaded image path (/uploads/…) or an https link; null uses the default image.
  cover: string | null;
  content: string;
  published: boolean;
  date: Date;
  updated: Date;
  minutes: number;
}

interface Row {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  cover: string | null;
  content: string;
  published: boolean;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

const toPost = (row: Row): Post => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description,
  category: row.category,
  cover: row.cover,
  content: row.content,
  published: row.published,
  date: row.published_at ?? row.created_at,
  updated: row.updated_at,
  minutes: readingTime(textOnly(row.content)),
});

export async function listPublished(limit = 500) {
  const { rows } = await query<Row>(
    'SELECT * FROM posts WHERE published ORDER BY published_at DESC, id DESC LIMIT $1',
    [limit],
  );
  return rows.map(toPost);
}

// For public pages that should still render if the database is unreachable.
export async function listPublishedOrEmpty(limit?: number) {
  try {
    return await listPublished(limit);
  } catch (error) {
    console.error('Could not load posts:', error);
    return [];
  }
}

export async function getPublishedBySlug(slug: string) {
  const { rows } = await query<Row>('SELECT * FROM posts WHERE published AND slug = $1', [slug]);
  return rows[0] ? toPost(rows[0]) : null;
}

export async function listAll() {
  const { rows } = await query<Row>('SELECT * FROM posts ORDER BY updated_at DESC');
  return rows.map(toPost);
}

export async function getById(id: number) {
  const { rows } = await query<Row>('SELECT * FROM posts WHERE id = $1', [id]);
  return rows[0] ? toPost(rows[0]) : null;
}

export class InvalidPost extends Error {}

// Cleans what the editor sends: required title, safe HTML, fallback summary and category.
function normalise(input: Record<string, unknown>) {
  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
  const title = text(input.title).slice(0, 200);
  if (!title) throw new InvalidPost('Please give the post a title.');
  const content = sanitizeContent(text(input.content));
  const summary = text(input.description) || textOnly(content);
  return {
    title,
    content,
    description: summary.length > 200 ? `${summary.slice(0, 197).trimEnd()}…` : summary,
    category: text(input.category).slice(0, 60) || 'General',
    cover: cleanImageUrl(input.cover),
    published: input.published === true,
  };
}

async function uniqueSlug(title: string) {
  const base = slugify(title).slice(0, 80) || 'post';
  const { rows } = await query<{ slug: string }>('SELECT slug FROM posts WHERE slug = $1 OR slug LIKE $2', [
    base,
    `${base}-%`,
  ]);
  const taken = new Set(rows.map((row) => row.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export async function createPost(input: Record<string, unknown>) {
  const post = normalise(input);
  const { rows } = await query<Row>(
    `INSERT INTO posts (slug, title, description, category, cover, content, published, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $7 THEN now() END)
     RETURNING *`,
    [await uniqueSlug(post.title), post.title, post.description, post.category, post.cover, post.content, post.published],
  );
  return toPost(rows[0]);
}

// The slug (and so the public address) is kept when a post is edited.
export async function updatePost(id: number, input: Record<string, unknown>) {
  const post = normalise(input);
  const { rows } = await query<Row>(
    `UPDATE posts
     SET title = $2, description = $3, category = $4, cover = $5, content = $6, published = $7,
         published_at = CASE WHEN $7 THEN COALESCE(published_at, now()) ELSE published_at END,
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, post.title, post.description, post.category, post.cover, post.content, post.published],
  );
  return rows[0] ? toPost(rows[0]) : null;
}

export async function deletePost(id: number) {
  const { rowCount } = await query('DELETE FROM posts WHERE id = $1', [id]);
  return Boolean(rowCount);
}
