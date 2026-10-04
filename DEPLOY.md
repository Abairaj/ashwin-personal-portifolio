# Hosting on GitHub Pages

GitHub builds and publishes the site automatically on every push; nothing has to be uploaded
by hand. The address depends on the repository name:

| Repository name | Site address |
| --- | --- |
| `<username>.github.io` | `https://<username>.github.io` |
| anything else, e.g. `ashwin-personal-portifolio` | `https://<username>.github.io/ashwin-personal-portifolio/` |

The build works this out by itself; nothing needs to be configured for either case.
This project's repo is `Abairaj/ashwin-personal-portifolio`, so it is published at
**https://abairaj.github.io/ashwin-personal-portifolio/**.

Replace `<username>` and `<repo>` below with your own.

## 1. Create the repository on GitHub

1. Sign in at [github.com](https://github.com) and press **+ → New repository**.
2. **Repository name:** `<username>.github.io` for the short address, or any other name.
3. **Visibility:** Public (GitHub Pages on a free account needs a public repo).
4. Leave "Add a README", ".gitignore" and "license" **unticked**; the project already has them.
5. Press **Create repository**.

## 2. Push the project from your computer

In a terminal, inside the project folder:

```sh
git init -b main
git add .
git commit -m "Initial site"
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

GitHub asks you to sign in the first time you push.

## 3. Turn on GitHub Pages

In the repository on github.com:

1. **Settings → Pages**
2. Under **Build and deployment → Source**, choose **GitHub Actions**.

GitHub then shows suggestion cards such as "GitHub Pages Jekyll" and "Static HTML", each with
a **Configure** button. Ignore them and do not press Configure: they would add a second,
wrong workflow. This project already has its own (`.github/workflows/deploy.yml`). The Source
setting saves itself as soon as you pick it; there is nothing else to press on this page.

The **Save** button further down belongs only to the **Custom domain** box. Leave that box
empty; the site is served at its `github.io` address without it.

## 4. Allow the template file to be restored

The `next-blog.md` writing template is put back automatically after each post. For that:

1. **Settings → Actions → General**
2. Under **Workflow permissions**, choose **Read and write permissions** and press **Save**.

## 5. Run the first deploy

The push in step 2 happened before Pages was switched on, so start the first deploy by hand:

1. Open the **Actions** tab.
2. Choose **Deploy** in the left list → **Run workflow** → **Run workflow**.
3. Wait for the green tick (about one to two minutes).

The site is now live at the address from the table at the top.

From here on, every push to `main` publishes by itself.

## 6. Check it worked

- Open the site address, and the same address with `writing/` added at the end.
- In the **Actions** tab, both **Deploy** and **Restore next-blog template** should show green ticks.

## Publishing a blog post

1. On github.com open `src/content/blog/next-blog.md` and press the pencil icon.
2. Replace the title, category and text.
3. Change the file name at the top from `next-blog.md` to your own, e.g. `my-first-post.md`.
4. Press **Commit changes**.

The post is live in a minute or two, and a fresh `next-blog.md` appears for the next one.

## Letting other people post

**Settings → Collaborators → Add people.** Anyone added there can publish posts the same way.
Remove them there to take access away.

## If something goes wrong

| What you see | What to do |
| --- | --- |
| Red cross on **Deploy** | Open the run and read the failing step. The build needs Node 22, which `deploy.yml` sets with `node-version: 22`. A post with no `date:` line is the usual cause; the message says which file. |
| Red cross on **Restore next-blog template** | Step 4 was skipped. Set workflow permissions to read and write, then re-run it. |
| Site shows a 404 | Check step 3 is set to **GitHub Actions**, the **Deploy** run has a green tick, and you are using the address from the table at the top (including the repo name, if it has one). |
| A new post does not appear | Check its file is not still named `next-blog.md`, and that it has no `draft: true` line. |

## Using your own domain later

1. **Settings → Pages → Custom domain**: enter the domain and follow GitHub's DNS instructions.
2. In `.github/workflows/deploy.yml`, add to the `build` job:

   ```yaml
       env:
         SITE_URL: https://yourdomain.com
   ```

   This makes the sitemap, RSS and search-engine tags use the new address.
