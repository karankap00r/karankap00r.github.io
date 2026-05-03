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

## Subscribers (email + RSS)

The footer has a subscribe form and an RSS feed. They run on different infrastructure but stay in sync — one source of truth (the markdown files in `_posts/`), two delivery channels.

### How it works

```
                ┌──────────────────────┐
                │  _posts/*.md (repo)  │ ← single source of truth
                └─────────┬────────────┘
                          │  git push → GitHub Pages build
                          ▼
                ┌──────────────────────┐
                │  /feed.xml (static)  │ ← jekyll-feed plugin generates on every build
                └─────────┬────────────┘
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
    ┌──────────────┐           ┌────────────────────┐
    │ RSS readers  │           │  Buttondown        │
    │ (Feedly etc) │           │  watches the feed  │
    └──────────────┘           │  → emails subs     │
                               └────────────────────┘
```

The `jekyll-feed` plugin (already enabled) renders `/feed.xml` from `_posts/` on every build. RSS readers poll it directly — no extra service needed for that channel.

For email, we point the footer subscribe form at [Buttondown](https://buttondown.com), which:

- hosts the form and stores subscriber emails in their database (so we don't run one),
- watches `https://yoursite.com/feed.xml` on a schedule,
- sends an email when a new `<item>` appears in the feed,
- handles unsubscribes, double-opt-in confirmation, and bounce/complaint compliance.

### Setting it up

1. Sign up at [buttondown.com](https://buttondown.com) with your email. Free tier (up to 100 subscribers, ~unlimited emails).
2. In Buttondown, go to Settings → Email Setup → enable "RSS-to-email" and paste your live feed URL (e.g. `https://kk1610.github.io/feed.xml`). Set the schedule to hourly.
3. Pick your Buttondown handle (e.g. `karankapoor`). Replace `CHANGE_ME` in `_config.yml` (`buttondown_username:`) with that handle. The footer form auto-posts there.
4. Optional: under Settings → Domain, configure a custom email-from domain so emails come from `karan@karankapoor.me` rather than `karan@buttondown.email`.

### Where each piece of data lives

| Data | Lives in | Why |
|---|---|---|
| Post content | `_posts/*.md` in your GitHub repo | One source of truth, version-controlled |
| Rendered HTML + RSS | GitHub Pages CDN | Static, fast, free |
| Subscriber email addresses | Buttondown's database | They handle GDPR/CAN-SPAM/CASL compliance |
| Email send logs / bounces | Buttondown | Audit trail and deliverability |
| Unsubscribe tokens | Buttondown | Required by law, handled by their links |

### Reliability

Failure modes and what happens:

- **GitHub Pages outage** → site and feed unreachable for the duration; subs queue up in RSS readers, Buttondown's poller retries on its next interval. No data lost.
- **Buttondown outage** → email sends delayed; new subs may fail to register during the window (form submission errors gracefully). RSS still works. They publish status at `status.buttondown.com`.
- **You delete or rewrite a post** → RSS reflects the change on next build. Buttondown only sends for *new* `<guid>` items, so editing an existing post doesn't re-send. Republishing a post (changing its date and slug) will re-send.
- **Spam signups** → Buttondown handles double-opt-in; the user has to click a confirm link before they're added.

### Alternative backends

If you outgrow Buttondown or want something different:

- **Substack** — heavier, more newsletter-y branding, but the simplest end-to-end. Trade-off: less control over the look.
- **ConvertKit / Beehiiv** — bigger feature surface (sequences, segments). Free tiers exist.
- **Roll your own** — a Cloudflare Worker + KV for storage + Resend for sending. ~150 lines of code, but you maintain it. Worth it only if you want full control.

The Buttondown choice is the right default: free for your size, opinionated, doesn't lock content into their platform (your posts stay in markdown in your repo).

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
