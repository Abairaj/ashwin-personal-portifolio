# Ashwin Raj K — Portfolio

An [Astro](https://astro.build) site running as a Node.js server, with blog posts stored in
PostgreSQL and written through a built-in admin area.

## Run locally

```sh
npm install
cp .env.example .env     # then fill in; see "Local settings" below
npm run db:local         # terminal 1: starts a local PostgreSQL (no install needed)
npm run db:migrate       # once: creates the tables
npm run db:import        # once, optional: loads the sample posts
npm run dev              # terminal 2: http://localhost:4321
```

### Local settings

In `.env` for local work:

```ini
SITE_URL=http://localhost:4321
ADMIN_HOST=
DATABASE_URL=postgres://postgres:postgres@localhost:5433/portfolio
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=      # paste the output of: npm run hash-password
SESSION_SECRET=           # any long random string
```

With `ADMIN_HOST` empty, the admin area is at http://localhost:4321/admin/.

## Writing posts

Sign in to the admin area (in production: the admin subdomain). **Write a post** opens the
editor:

- Type the title, press Enter, and write.
- Select text for bold, italic, headings, quotes and links.
- On an empty line, use the buttons underneath to insert an image, heading, quote, list or divider.
  Images can also be pasted or dragged in.
- **Add a cover image** is optional; posts without one use the default image.
- **Save draft** keeps it private. **Publish** puts it on the site straight away.
- The post list has **Edit**, **View** and **Delete** for every post.

A post's web address is made from its title when it is first saved and does not change afterwards.

## How it fits together

| Part | Where |
| --- | --- |
| Public pages | `src/pages/index.astro`, `src/pages/writing/` |
| Admin pages and editor | `src/pages/admin/`, `src/components/Editor.astro` |
| Post API, uploads | `src/pages/api/admin/`, `src/pages/uploads/` |
| Login, sessions, admin-host rule | `src/lib/auth.ts`, `src/middleware.ts` |
| Database access | `src/lib/posts.ts`, `db/schema.sql` |
| Site-wide text and links | `src/config.ts` |

Uploaded images are converted to WebP and stored in `UPLOAD_DIR` on the server.

## Hosting

Step-by-step guide for a Hostinger VPS: [DEPLOY.md](DEPLOY.md).

## Before launch

- `src/config.ts` — email, social links, business URLs, book URL, optional form endpoint.
- `src/assets/sample.jpg` — the placeholder photo used across the site and as the default post cover.
- The five imported posts are samples; delete them in the admin area.
