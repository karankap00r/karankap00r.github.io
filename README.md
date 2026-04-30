# Portfolio

Source for my portfolio site, built with Jekyll and hosted on GitHub Pages.

## Add a project

Each project is one markdown file in `_projects/`. Front matter is the metadata shown in listings; the body is what renders on the per-project detail page (the page reached by "read more →").

Create `_projects/<slug>.md`:

```markdown
---
title: Project name
date: 2026-04-30
tags: [vibe-coded, ai-skills]
description: One sentence on what it is. A second sentence on why it exists.
links:
  demo: https://...
  source: https://github.com/...
---

A short intro paragraph. What is this thing? Who's it for?

## How it works

Implementation notes, architecture, key decisions.

## What's next

Where it's headed, open questions.
```

The slug becomes the URL: `_projects/my-tool.md` → `/projects/my-tool/`. Newest dates render first across all listings. Tags must match a category in `_config.yml` (`vibe-coded`, `open-source`, `ai-skills`, `prototypes`) or the project won't appear in any section.

If you leave the body empty, the project still has its own page (just metadata) but the "read more →" link is hidden in listings — so listing-only projects work too.

Commit and push. GitHub Pages rebuilds in ~30 seconds.

The fastest edit path is `github.dev`: open the repo on github.com and press `.` to launch VS Code in the browser. Edit, commit, done — no clone needed.

## Tags

Tags are display-only labels shown on the right side of each project row (and on its detail page). Use anything that's useful — `vibe-coded`, `open-source`, `ai-skills`, `prototypes`, `infra`, etc. There's no separate page per tag; everything lives under `/prototypes/` and tags are just metadata.

## Add a blog post

Drop a markdown file in `_posts/` named `YYYY-MM-DD-slug.md`. The date in the filename has to match the `date` in the front matter.

```markdown
---
title: My post
date: 2026-04-30
description: Optional one-liner shown in listings.
tags: [meta]
---

Body content in markdown.
```

Posts appear on `/blogs/` and the homepage.

## Run locally

```bash
bundle install
bundle exec jekyll serve
```

Then visit `http://localhost:4000`. Saved file changes auto-rebuild.

## Deploy

Push to GitHub. In repo Settings → Pages, set Source to "Deploy from a branch" → `main` → `/ (root)`. First build takes a minute; subsequent ones are ~30s.

- **User site** (`<username>.github.io` repo) → live at `https://<username>.github.io`. Leave `baseurl` empty in `_config.yml`.
- **Project site** (any other repo name) → live at `https://<username>.github.io/<repo-name>`. Set `baseurl: "/<repo-name>"` in `_config.yml`.
- **Custom domain** → add a `CNAME` file with your domain on one line, point a CNAME DNS record at `<username>.github.io`, set `url:` in `_config.yml`.

## Structure

```
_config.yml              site config
_projects/               ← one .md per project (your main editing surface)
  project-alpha.md
  project-beta.md
  ...
_posts/                  ← one .md per blog post (YYYY-MM-DD-slug.md)
  2026-04-29-welcome.md
_layouts/
  default.html           HTML shell
  category.html          /prototypes/ listing
  page.html              about page
  project.html           per-project detail page
  post.html              per-blog-post detail page
_includes/
  header.html            site header + nav + theme toggle
  footer.html
  project_row.html       reusable project card
index.html               homepage: hero + recent projects + recent posts
prototypes.html          all projects, year-grouped
blogs.html               all blog posts, year-grouped
about.md
assets/style.css
```
