import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Canonical URLs, the sitemap, RSS and Open Graph tags are built from `site` + `base`.
// On GitHub Actions they follow the repo: "<user>.github.io" is served from the
// root, any other repo name from "/<repo-name>". Set SITE_URL to override both
// (e.g. for a custom domain, which is served from the root).
const { SITE_URL, GITHUB_REPOSITORY } = process.env;
const [owner, repo] = (GITHUB_REPOSITORY ?? '').split('/');
const isUserSite = repo?.toLowerCase() === `${owner?.toLowerCase()}.github.io`;

const site = SITE_URL ?? (owner ? `https://${owner.toLowerCase()}.github.io` : 'http://localhost:4321');
const base = SITE_URL || !repo || isUserSite ? '/' : `/${repo}`;

export default defineConfig({
  site,
  base,
  integrations: [sitemap()],
});
