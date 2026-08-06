# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: **pnpm** (lockfile is `pnpm-lock.yaml`).

```bash
pnpm dev      # next dev (http://localhost:3000)
pnpm build    # next build
pnpm start    # next start (serves the production build)
pnpm lint     # eslint (uses eslint-config-next: core-web-vitals + typescript)
```

There is no test suite configured.

## Environment variables

Required at runtime (see `.env`):

- `GITHUB_TOKEN`, `GITHUB_USERNAME` — used by `src/lib/github.ts` for the GitHub insights section on `/about`.
- `BREVO_API_KEY`, `CONTACT_EMAIL` — used by the contact form handler at `src/app/api/contact/route.ts` to send emails via the Brevo transactional API.

## Architecture

Single-locale English site on the Next.js App Router. Pages live directly under `src/app/` (no `[locale]` segment, no i18n middleware).

### Content model: `src/content/site.json` is the single source of truth

Almost every page reads from one big JSON blob — person bio, routes, SEO copy, experience, research, projects, awards, skills, and "insights for copy" (recommended featured sections). `src/lib/content.ts` is the only layer that should touch `site.json` directly; pages import typed selectors from it:

- `getSite()`, `getPerson()`, `getExperienceSorted()`, `getFeaturedProjects()`, `getFeaturedResearch()`, `getInsights()`, etc.
- `getRoutes()` produces the nav from `site.routes`.
- `formatDateRange(start, end)` formats experience timelines (open-ended entries render as "Present").
- `buildCanonical(path)` builds absolute URLs from `site.domain` for sitemaps / metadata.

### Pages

Every page is a Server Component that pulls data from `@/lib/content` and renders composed primitives from `src/components/` (`Section`, `Card`, `Timeline`, `TimelineItem`, `ProjectCard`, `ResearchCard`, etc.).

**Hero** — `src/components/hero/` holds just `Hero.tsx` and `HeroPortrait.tsx`. Both are Server Components with **no** `"use client"` and ship zero client JS. There is no 3D and no animation library — everything is plain CSS in `src/app/globals.css`:

- Static utilities: `.hero-grid` (the schematic background grid, a pure gradient — **not** animated) and `.hero-frame`.
- Animated utilities `.hero-reveal`, `.hero-reveal-x`, `.hero-rise`, `.hero-frame`, `.hero-scan`, backed by exactly five `@keyframes`: `hero-reveal`, `hero-reveal-x`, `hero-rise`, `hero-frame-pulse`, `hero-scan`. Entrance reveals are staggered with an inline `animationDelay` in the TSX.
- An **unlayered** `@media (prefers-reduced-motion: reduce)` block disables them (it must stay outside `@layer utilities` to win the cascade). The portrait is a plain `next/image` (`public/images/frontal_portrait.webp`) with `priority` + `fill` + `object-cover`.

**GitHub section** — `src/components/github/` (`GithubInsights`, `GithubStats`, `LanguageDonut`, `ActivityPulse`, `ContributionGraph`) is server-rendered and also carries no `"use client"`. Charts are hand-written inline SVG — no charting library. Data comes from `fetchGithubInsights()` in `src/lib/github.ts` (GitHub GraphQL, cached via `next: { revalidate }`), with the contribution-snake SVG fetched by `src/lib/github-snake.ts`. `/about` sets `export const revalidate = 21600` — it must stay a literal, since Next requires that segment config to be statically analyzable.

**Animation** — GSAP is used in exactly one place, `src/components/Section.tsx` (a client component that fades `[data-gsap-item]` in on scroll). It is the only animation dependency left; `three`, `@react-three/*`, `framer-motion` and `d3` are gone.

### SEO

- Metadata is generated in `src/app/layout.tsx` via `generateMetadata` from `site.json` (title, description, OG, canonical).
- `src/app/layout.tsx` also injects a `Person` JSON-LD block via `src/app/components/json-ld.tsx`, assembled from `person`, `skills`, `experience`, and `education` in `site.json`.
- `src/app/sitemap.ts` and `src/app/robots.ts` derive URLs from `site.json`.

### Styling

Tailwind CSS **v4** via the `@tailwindcss/postcss` plugin (no `tailwind.config.js` — config is CSS-first in `src/app/globals.css`). Merge class lists with `cn(...)` from `src/lib/utils.ts` (clsx + tailwind-merge). Path alias `@/*` maps to `src/*`.

## Gotchas

- When adding a new route, add it to `site.routes` in `site.json` (with `path` and `label`) **and** create the page under `src/app/<path>/page.tsx`. The Navbar and Footer read the route list from `site.json`.
