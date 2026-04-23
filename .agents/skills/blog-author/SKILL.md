---
name: blog-author
description: Author a new blog entry for reqhiem.dev. Use when the user asks to add, write, draft, or publish a blog post / entry / article. Handles the full authoring flow — markdown file creation under src/content/blog/ with the correct frontmatter schema, LaTeX + code conventions, slug/date rules, and verification steps. Triggers on phrases like "agregar un post", "nueva entrada del blog", "draft a blog post", "write an article about X", "publicar en el blog".
metadata:
  priority: 6
  pathPatterns:
    - 'src/content/blog/**'
    - 'src/lib/blog.ts'
    - 'src/app/blog/**'
    - 'src/components/blog/**'
retrieval:
  aliases:
    - blog post
    - nueva entrada
    - add post
    - publish article
    - escribir entrada
    - draft post
  intents:
    - add a new blog entry to the site
    - publish a technical article
    - write a blog post about X
    - draft a new blog entry
  examples:
    - agrega una nueva entrada sobre agentic RAG
    - quiero publicar un post sobre transformers
    - write a blog post about TypeScript satisfies
---

# Blog author — reqhiem.dev

Use this skill to add a new blog entry. The blog module lives at `src/app/blog/*`, reads markdown files from `src/content/blog/`, and compiles them at build time with `unified` (remark + rehype: GFM, KaTeX, Shiki dual-theme, slugified anchors).

**The authoring flow is one file.** Create `src/content/blog/<slug>.md` with correct frontmatter. Everything else — route generation, sitemap entry, navbar filter counts, TOC, JSON-LD, OG metadata — is derived automatically.

## When to use

- The user asks to add, write, draft, or publish a blog entry.
- The user says something like "nueva entrada sobre …", "write a post about …", "draft an article on …".
- The user asks you to convert an existing doc, notebook, or transcript into a published blog post.

Do **not** use this skill for: editing the blog UI itself (cards, filters, layout), performance tuning, or adding new categories to the codebase — those touch `src/lib/blog.ts`, `src/components/blog/**`, or `src/app/blog/**`.

## Before writing

1. **Ask the user to confirm the topic, angle, and desired depth** if the brief is one line. Technical posts on reqhiem.dev are deep, opinionated, and grounded in real usage — avoid generic "intro to X" content unless the user explicitly wants it.
2. **Site is English-only** (since commit `Remove Spanish i18n; English-only site with /es redirects`). Write posts in English even if the request came in Spanish, unless the user explicitly overrides this.
3. **Choose a category.** Must be one of:
   - `"Software Engineering"` — backend, system design, languages, APIs.
   - `"AI"` — ML/DL, agents, retrieval, LLMs, applied ML.
   - `"Research"` — academic-leaning write-ups, paper summaries, experiments.
   - `"Tooling"` — dev tooling, package managers, editors, CI/CD, DX.

   These values live in `BlogCategory` at `src/lib/blog.ts`. Adding a new category requires editing that union — only do it with explicit user approval.

## File location and slug

- Path: `src/content/blog/<slug>.md` (relative to the repo root).
- Slug: lowercase, hyphenated, ASCII. Keep it short and descriptive; it becomes the URL (`/blog/<slug>`). Example: `uv-vs-conda-virtualenv`, `agentic-rag-failure-modes`.
- Don't include the date in the filename — the date lives in frontmatter.

## Frontmatter schema

Every post starts with YAML frontmatter between `---` fences. Matches `BlogFrontmatter` in `src/lib/blog.ts`.

```yaml
---
title: "Post title — short enough for a card, descriptive enough for SEO"
description: "One paragraph (≤ ~200 chars) used for the card blurb, OG description, and Twitter card."
date: "YYYY-MM-DD"           # ISO date, UTC-based; avoid timezone ambiguity
updated: "YYYY-MM-DD"        # optional, omit if same as date
category: "Tooling"          # one of the 4 values above
tags: ["python", "uv", "devtools"]  # 3–6 lowercase, hyphenated tags
featured: true               # optional; at most one featured post is promoted as hero on /blog
draft: false                 # optional; drafts show only in dev, never in production builds
author: "Joel Perca"         # optional; defaults implicitly to the site owner
cover: "/blog/covers/slug.png"  # optional; used for OG image
---
```

Rules of thumb:

- **`date`**: use today's date unless the user specifies otherwise. Formatted as UTC in the UI, so the day won't shift for viewers.
- **`tags`**: lowercase, short, reusable. They drive the tag filter chips on `/blog`, so avoid one-off tags.
- **`featured`**: set to `true` only if the user asks for it, and un-feature the previous hero post in the same commit.
- **`draft: true`** is useful when the user wants a WIP post visible only in `pnpm dev`. Production builds skip drafts.

## Writing the body

Markdown is compiled with GFM extensions, math, and syntax highlighting. The `prose-blog` stylesheet in `src/app/globals.css` assumes the following conventions.

### Headings

- Start the article at `## H2`. **Do not write `# H1`** — the page already renders the post title from frontmatter as `<h1>`.
- Use `## H2` for main sections and `### H3` for sub-sections. Only these two levels appear in the TOC.
- Heading IDs are generated with `github-slugger`, so the TOC anchors match GitHub's slug behavior automatically.

### Code blocks

Always include a language after the opening fence — `rehype-pretty-code` renders with Shiki in GitHub light + dark themes.

````markdown
```ts
const greet = (name: string) => `hello, ${name}`;
```
````

Extras supported by `rehype-pretty-code`:

- `{1,3-5}` highlight lines: `` ```ts {1,3-5} ``
- `{title="file.ts"}` filename caption.
- Inline code is **not** highlighted (we set `bypassInlineCode: true` to keep inline `` `snippets` `` styled as plain accent-colored code).

### Math / LaTeX

KaTeX renders both inline and block math. Import of `katex/dist/katex.min.css` is already global.

- Inline: `$E = mc^2$`
- Block:
  ```markdown
  $$
  \min_{v \in V} \sum_{i=1}^{n} \text{cost}(v_i) \quad \text{s.t.} \quad \bigwedge_{c \in C} c(v) = \text{true}
  $$
  ```

Use math sparingly — one or two formulas per article tends to land better than dense notation.

### Tables, callouts, and images

- GFM tables render with themed borders; use them for comparisons and benchmarks.
- `> blockquote` renders as an accented pull-quote.
- Images: prefer hosted URLs or files under `public/`. Use absolute paths from `/` (e.g. `/blog/covers/slug.png`). Always include alt text.
- Horizontal rule `---` renders as a dashed divider — good for a "Further reading" section at the end.

### Style

- Opinionated, first-person ("I migrated …", "I benchmarked …"). Avoid hedging.
- Ground claims in concrete numbers, file paths, or commands whenever possible.
- Include a short TL;DR section near the top for long posts.
- End with a "Further reading" list of canonical sources (specs, papers, official docs).

## Reference: minimal post template

```markdown
---
title: "Post title"
description: "One-paragraph summary for cards, OG, Twitter."
date: "YYYY-MM-DD"
category: "AI"
tags: ["topic", "subtopic"]
---

Opening hook — one or two sentences that say why this matters.

## TL;DR

- Key point 1.
- Key point 2.
- Key point 3.

## Section

Prose, code, and math as needed.

```python
def example():
    return 42
```

## Closing thought

One paragraph that either generalizes or points forward.

---

**Further reading**

- [Canonical source](https://example.com)
```

## Verification steps

After creating the file:

1. Run `pnpm lint` — ensures no TS regressions in the broader project.
2. Run `pnpm build` — confirms the post gets statically prerendered. Look for `/blog/<slug>` in the route table.
3. If the user has a dev server running, open `http://localhost:<port>/blog/<slug>` and visually check: math renders, code highlights (including theme toggle), TOC scrolls, no console errors.
4. Inspect the generated sitemap at `.next/server/app/sitemap.xml.body` — the new post URL should appear.

## Common pitfalls

- **Date timezone**: always use `YYYY-MM-DD`. `new Date("2026-04-23")` parses as UTC midnight and the UI forces `timeZone: "UTC"` when formatting, so the day stays stable.
- **Forgetting the language tag on fences**: `rehype-pretty-code` falls back to `plaintext` (configured as `defaultLang`), but syntax highlighting disappears — always specify the language.
- **Duplicate heading text**: `github-slugger` dedupes with `-1`, `-2` suffixes; this is fine but keep headings unique for readable anchors.
- **Adding a category that doesn't exist in `BlogCategory`**: the type is strict — pick an existing category or ask the user to extend the union (both in `src/lib/blog.ts` and in any docs/UX copy).
- **Featured drift**: setting `featured: true` on multiple posts is harmless (only the first in sort order is promoted), but confusing. When promoting a new post, flip the previous one's flag to `false` in the same change.

## Don't

- Don't edit `src/app/sitemap.ts`, `src/content/site.json`, `src/app/blog/page.tsx`, or the navbar to "register" the post — everything is discovered at build time from the filesystem.
- Don't write commentary in frontmatter comments or leave editor placeholders in the body.
- Don't generate a full article without confirming the topic and depth with the user first.
