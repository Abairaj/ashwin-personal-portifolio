import type { APIRoute } from 'astro';
import { fullUrl } from '../config';
import { listPublishedOrEmpty } from '../lib/posts';

export const GET: APIRoute = async () => {
  const posts = await listPublishedOrEmpty();
  const entries = [
    { loc: fullUrl('/') },
    { loc: fullUrl('/writing/') },
    ...posts.map((post) => ({ loc: fullUrl(`/writing/${post.slug}/`), lastmod: post.updated.toISOString() })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => `  <url><loc>${e.loc}</loc>${'lastmod' in e ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
