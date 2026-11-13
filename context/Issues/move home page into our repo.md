You are a senior frontend engineer. Your task is to migrate the Home page from the standalone project `nasa-mars-app-main/` into our main Next.js app in `frontend/`.

## Context
- `nasa-mars-app-main/` is a separate project (sibling of `frontend/`) that contains only the Home page. It is the SOURCE. Do NOT modify it and do NOT import anything from it at runtime.
- `frontend/` is the TARGET: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, GSAP, MapLibre. Package manager: pnpm.
- Design reference: `design/Home.pdf` and `context/DESIGN_SYSTEM.md` (Mars identity: dark cinematic theme, rust/orange accents). The migrated page must match the design.

## Step 1 — Analyze first (do not write code yet)
1. Read the full structure of `nasa-mars-app-main/` (pages, components, assets, styles, fonts, package.json).
2. Read the current `frontend/` structure: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `components/`, `components/ui/`, `package.json`, and `components.json` (shadcn config).
3. Give me a short migration plan: which files map where, which dependencies exist in the source but are missing in the target, and what duplicates existing code (e.g. Navbar, Button, GlassCard already exist in `frontend/components/ui`).
Wait for my confirmation only if something is ambiguous; otherwise continue.

## Step 2 — Migration rules
**Styling**
- Use Tailwind CSS v4 utility classes only. Convert any plain CSS, CSS modules, styled-components, or inline styles to Tailwind.
- Reuse the design tokens already in `frontend/app/globals.css` (colors, glass utilities). If the source needs a new token, add it to `globals.css` under the theme instead of hard-coding hex values in components.
- Use `cn()` from `@/lib/utils` for conditional class names.

**Components**
- Use shadcn/ui for primitives (Button, Card, Accordion, etc.). If a needed shadcn component is not installed, add it with `pnpm dlx shadcn@latest add <component>`. Do not hand-write what shadcn already provides.
- Reuse existing components (`components/ui/Navbar.tsx`, `Button.tsx`, `GlassCard.tsx`) instead of duplicating them. If the Home version differs, extend the existing one with props/variants rather than creating a second copy.
- Split the page into small single-purpose section components under `frontend/components/home/` (e.g. `Hero.tsx`, `Services.tsx`, `Features.tsx`, `Reliability.tsx`, `Footer.tsx`). `app/page.tsx` should only compose these sections.
- Use Server Components by default. Add `"use client"` only to components that need hooks, GSAP, or browser APIs.
- Everything in TypeScript with typed props. No `any`.

**Animations (GSAP)**
- Replace any other animation library or CSS animation in the source with GSAP (use the version already installed in `frontend`).
- Use `@gsap/react` `useGSAP` hook if installed (otherwise `useEffect` + `gsap.context()`), always scoped to a ref and cleaned up with `ctx.revert()`.
- Register plugins (ScrollTrigger, etc.) once, safely for SSR. Respect `prefers-reduced-motion`.

**Data & content**
- Move hard-coded repeated content (services, features, footer links, nav items) into typed constant arrays (e.g. `lib/constants/home.ts`) and map over them in JSX.

**Assets**
- Copy images/videos/fonts used by the Home page into `frontend/public/` (organized, e.g. `public/images/home/`).
- Use `next/image` for images (with width/height or `fill` + `sizes`) and `next/font` for fonts. Do not add new font files if Geist is already used, unless the design requires it.

**Code quality**
- Clean, readable, no dead code, no commented-out blocks, no console.logs, no unused imports.
- Semantic HTML (`header`, `main`, `section`, `footer`, proper heading order), alt text on images, accessible buttons/links.
- Fully responsive (mobile-first, `sm/md/lg/xl`).
- Follow the existing ESLint config. Use absolute imports (`@/...`).

## Step 3 — Dependencies
- Install only what is truly missing, with `pnpm add` inside `frontend/`. Do not add libraries that duplicate Tailwind, shadcn, or GSAP functionality.
- Do not touch the Map page, `Map.jsx`, or the API integration.

## Step 4 — Verify
- Run `pnpm lint` and `pnpm build` inside `frontend/` and fix all errors and warnings you introduced.
- Confirm the Home page at `/` renders without hydration errors.

## Final output
Give me: (1) a list of files created/modified/deleted, (2) dependencies added, (3) anything from the source you intentionally dropped or changed and why, (4) anything I need to review manually.