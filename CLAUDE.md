# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev        # Start dev server
bun run build      # Production build
bun run preview    # Preview production build
```

No linter or test suite is configured.

## Architecture

**Quality Time Design Agency** — a static portfolio site built with Astro 5 (SSG), vanilla CSS, and MDX content collections. No Tailwind; no React. Deployed to Netlify.

### Content Model

Content lives in `src/content/` with Zod schemas in `src/content/config.ts`:

- **`projects/`** — MDX files at `{slug}/index.mdx`, each with typed frontmatter (title, client, year, heroImage, thumbnail, gallery[], services[], accentColor, order, etc.). Non-draft projects are rendered at `/projects/[id]`.
- **`designers/`** — Markdown profiles used in designer spotlight/carousel components on the homepage.
- **`src/data/homepage.json`** — Drives which gallery images render in `ProjectGallery.astro` on the homepage (configures which index from each project's `gallery[]` array to use).

### Routing

| Route | File |
|---|---|
| `/` | `src/pages/index.astro` |
| `/projects` | `src/pages/projects.astro` — filters drafts, sorts by date |
| `/projects/[id]` | `src/pages/projects/[...slug].astro` — dynamic project detail |
| `/about`, `/contact` | Static pages |

### Styling System

Pure CSS with design tokens in `src/styles/tokens/`:
- **`colors.css`** — Collins-inspired palette. Key vars: `--color-ink`, `--color-paper`, `--color-accent` (red `#DC2626`). Dark mode via `prefers-color-scheme`.
- **`spacing.css`** — 4px base scale, main container at 1244px, responsive gutters with `clamp()`. Spring easing: `cubic-bezier(0.34, 1.56, 0.64, 1)`.
- **`typography.css`** — Display: Instrument Serif; body: Satoshi; fluid type scales using `clamp()`.

Components use scoped `<style>` blocks. CSS modules are available (camelCase convention) but not the primary pattern.

### Animation & Interactivity

- **Scroll reveals** — elements with `data-animate` are driven by `src/scripts/animations.ts`, initialized on `astro:page-load`. Stagger delays via `--stagger` CSS custom property.
- **Scroll-driven theming** — `src/scripts/scrollBackground.ts` switches the page theme based on scroll position.
- **View transitions** — `ClientRouter` from `astro:transitions` gives SPA-like navigation. Components that should persist across navigations use `transition:persist`.

### Path Aliases

Configured in `tsconfig.json`:
```
@/*           → src/*
@components/* → src/components/*
@layouts/*    → src/layouts/*
@styles/*     → src/styles/*
@content/*    → src/content/*
@assets/*     → src/assets/*
```

### Images

Remote images are served from `storage.googleapis.com/quality-time-assets/`. Local images live in `public/media/`. Use Astro's `<Image>` component with `widths` and `sizes` props; set `loading="eager"` only for above-the-fold images (first 1–2 cards).
