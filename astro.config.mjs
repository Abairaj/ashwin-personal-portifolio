import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Loads .env for `astro dev` and `astro build`. In production the server is
// started with `node --env-file=.env` instead (see package.json "start").
try {
  process.loadEnvFile();
} catch {
  // no .env file
}

export default defineConfig({
  site: process.env.SITE_URL ?? 'http://localhost:4321',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  // Origin checks are done in src/middleware.ts, which also works behind the nginx proxy.
  security: { checkOrigin: false },
});
