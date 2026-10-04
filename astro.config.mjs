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
  // The built server accepts connections on every address unless HOST is set.
  // The default ("localhost") can end up IPv6-only, which a host's proxy may not reach.
  server: ({ command }) => ({ host: command !== 'dev' }),
  // Origin checks are done in src/middleware.ts, which also works behind the nginx proxy.
  security: { checkOrigin: false },
});
