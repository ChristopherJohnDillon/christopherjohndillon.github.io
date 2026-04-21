---
layout: post
title: "Hello, world"
date: 2026-04-21 18:00:00 +0100
tags:
  - meta
summary: "First post on the Observatory. A note about what this blog is for and how it's built."
---

This is the first post on the Observatory. If you're reading it, the blog scaffolding works.

## What this blog is

A low-pressure place to write things down — data work, Swift experiments, astrophysics footnotes, whatever. No posting schedule. Short is fine. Rough is fine.

## How it's built

It's plain Jekyll. Posts are markdown files in `_posts/` named `YYYY-MM-DD-slug.md` with a bit of YAML frontmatter at the top (`title`, `date`, `tags`, `summary`). GitHub rebuilds the site every time I commit a new one. No database, no CMS, no admin panel — just files.

## To add a new post

1. On GitHub, go to the `_posts/` folder and click **Add file → Create new file**.
2. Name it something like `2026-05-01-some-idea.md`.
3. Paste a frontmatter block at the top, then write in markdown below it.
4. Commit. The site rebuilds and `/blog/` updates.

That's it.
