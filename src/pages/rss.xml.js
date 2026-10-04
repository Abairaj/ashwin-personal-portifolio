import rss from '@astrojs/rss';
import { SITE, fullUrl, url } from '../config';
import { listPublishedOrEmpty } from '../lib/posts';

export async function GET() {
  const posts = await listPublishedOrEmpty(50);
  return rss({
    title: `${SITE.name} — Writing`,
    description: SITE.description,
    site: fullUrl('/'),
    items: posts.map((post) => ({
      title: post.title,
      description: post.description,
      pubDate: post.date,
      categories: [post.category],
      link: url(`/writing/${post.slug}/`),
    })),
  });
}
