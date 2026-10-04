# Ashwin Raj K — Portfolio

Static site built with [Astro](https://astro.build). No database: blog posts are Markdown files in this repo.

## Run locally

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # output in dist/
```

## Write a blog post

**Quickest way, on github.com:** open `src/content/blog/next-blog.md` → pencil icon (Edit) →
replace the title and text → change the file name at the top from `next-blog.md` to your own
(e.g. `my-first-post.md`) → Commit changes. The post is published in a minute or two, and a
fresh `next-blog.md` is put back automatically for the next post.

`next-blog.md` itself is never shown on the site, so a post saved without changing the file name
stays hidden until it is renamed. The template it is restored from is `.github/blog-template.md`.


Posts can also be written as plain files: add a `.md` file to `src/content/blog/`. A post only
needs a title and a date:

```md
---
title: My Post Title
date: 2026-10-03
---

Post text in Markdown.
```

Optional extras, on their own lines between the `---` markers:

| Line | What it does | If left out |
| --- | --- | --- |
| `category: Marketing` | Label on the card and a filter chip. Any text works; new ones appear automatically. | `General` |
| `description: ...` | Summary on cards and in search results. | First paragraph of the post |
| `cover: my-photo.jpg` | Cover image: the name of an image file you put in `src/content/blog/images/`, or an image link (`https://...`). | Default image (`src/assets/sample.jpg`) |
| `draft: true` | Hides the post from the site. | Published |

The page address comes from the file name: `My first_post.md` → `/writing/my-first-post/`.

**From the GitHub website:** open `src/content/blog/` → Add file → Create new file → name it
`my-post.md` → paste the example above → Commit changes. The site republishes itself in a minute or two.

## Publish on GitHub Pages

Step-by-step guide: [DEPLOY.md](DEPLOY.md).

## Before launch

- `src/config.ts` — email, social links, business URLs, book URL, optional form endpoint.
- `src/assets/sample.jpg` — the one placeholder photo used everywhere; replace it, or
  import different images per section in `src/pages/index.astro`.
- `src/content/blog/` — the four posts are samples.
# ashwin-personal-portifolio
