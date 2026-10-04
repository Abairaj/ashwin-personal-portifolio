// One-off: loads the Markdown posts in db/seed-posts into the database.
// Posts whose address already exists are skipped, so it is safe to run again.
import { readFile, readdir } from 'node:fs/promises';
import { marked } from 'marked';
import pg from 'pg';
import sanitizeHtml from 'sanitize-html';

const dir = new URL('../db/seed-posts/', import.meta.url);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

for (const file of (await readdir(dir)).filter((name) => name.endsWith('.md'))) {
  const [, head, body] = (await readFile(new URL(file, dir), 'utf8')).match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const data = Object.fromEntries(
    head
      .split('\n')
      .map((line) => line.match(/^(\w+):\s*(.*)$/))
      .filter(Boolean)
      .map(([, key, value]) => [key, value.replace(/^"(.*)"$/, '$1')]),
  );
  const content = sanitizeHtml(await marked.parse(body.replace(/<!--[\s\S]*?-->/g, '')), {
    allowedTags: ['p', 'h2', 'h3', 'blockquote', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'pre', 'a', 'img', 'hr', 'br'],
    allowedAttributes: { a: ['href'], img: ['src', 'alt'] },
  });
  const cover = /^https:\/\//.test(data.cover ?? '') ? data.cover : null;
  const { rowCount } = await client.query(
    `INSERT INTO posts (slug, title, description, category, cover, content, published, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, true, $7)
     ON CONFLICT (slug) DO NOTHING`,
    [slugify(file.replace(/\.md$/, '')), data.title, data.description ?? '', data.category ?? 'General', cover, content, data.date ?? data.pubDate],
  );
  console.log(`${rowCount ? 'imported' : 'skipped '} ${file}`);
}

await client.end();
