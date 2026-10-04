import { fullUrl } from '../config';

export const GET = () => new Response(`User-agent: *\nAllow: /\n\nSitemap: ${fullUrl('/sitemap.xml')}\n`);
