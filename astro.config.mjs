import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Canonical URLs, the sitemap, RSS and Open Graph tags are all built from `site`.
// On GitHub Actions it resolves to https://<username>.github.io; set SITE_URL
// to override it (e.g. for a custom domain).
const owner = process.env.GITHUB_REPOSITORY_OWNER;
const site =
  process.env.SITE_URL ?? (owner ? `https://${owner.toLowerCase()}.github.io` : 'http://localhost:4321');

export default defineConfig({
  site,
  integrations: [sitemap()],
});
