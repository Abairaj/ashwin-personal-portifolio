import rss from '@astrojs/rss';
import { SITE } from '../config';
import { getPosts } from '../posts';

export async function GET(context) {
  const posts = await getPosts();
  return rss({
    title: `${SITE.name} — Writing`,
    description: SITE.description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.title,
      description: post.description,
      pubDate: post.date,
      categories: [post.category],
      link: `/writing/${post.id}/`,
    })),
  });
}
