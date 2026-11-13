# Task: Refactor the Map page UI (Location Details card + Vehicle card)

## Context
- Project: Martian Map (NASA Space Apps), Next.js 16 (App Router), React 19, TypeScript, **Tailwind CSS v4**, MapLibre GL JS.
- Relevant files: `frontend/components/Map.jsx`, `frontend/components/ui/GlassCard.tsx`, `frontend/components/ui/Button.tsx`, `frontend/components/ui/TelemetryCard.tsx`, `frontend/app/globals.css` (design tokens + glass utilities).
- Design source of truth: `context/DESIGN_SYSTEM.md` and `design/map.pdf` (dark cinematic theme, Mars orange/rust accents, cyan telemetry, glassmorphism).

## Problems to fix

### 1. Location details card is badly positioned
Currently, the card (image, description, Temperature / Slope / Speed telemetry) opens on the right side and:
- Overlaps the Vehicle card sitting next to it.
- Collides with the top bar ("Explore Mars" button, Tharsis/Jezero switcher).
- Long description text overflows and runs underneath the telemetry cards.

**Required:**
- Reposition it so it never overlaps other panels. Use one consistent layout, for example a fixed right-side panel below the top bar:
  `fixed right-4 top-24 bottom-4 w-[360px] max-w-[calc(100vw-2rem)]`, and make the Vehicle card sit in its own non-overlapping slot (see section 3).
- Use `flex flex-col` with three zones: fixed header (title + close button), a scrollable body (`flex-1 overflow-y-auto`, with a thin custom scrollbar), and a fixed footer for the telemetry cards, so text can never run under them.
- On mobile (`< md`), render it as a bottom sheet: `inset-x-0 bottom-0 max-h-[60vh] rounded-t-2xl`.
- Add a smooth enter/exit transition (`transition-all duration-300`, translate and opacity), driven by state rather than conditional unmounting.
- Fix the mojibake in the description text (`MarsÆ` should be `Mars'`). Make sure the file and API responses are read as UTF-8.

### 2. No way to close the details card
- Add a close button (X icon, `lucide-react` or an inline SVG) in the card header, top-right.
- It needs `aria-label="Close location details"`, a visible focus ring, and a hover state, with a hit area of at least 36x36px.
- Also close it when the user presses **Escape** or clicks an empty area of the map.
- Closing should clear the selected-point state, but must **not** remove the point from Start/End/Science Target selections.

### 3. Vehicle card is cramped and the buttons look plain
- Add real internal spacing: `p-5` (or `p-6`), `gap-4` between sections, and `space-y-3` for text blocks. Text must never touch the card edges.
- Give the image its own rounded container (`rounded-xl overflow-hidden aspect-[4/3] object-cover`).
- Title: `text-base font-semibold text-center`. Description: `text-sm leading-relaxed text-white/70`, clamped with `line-clamp-4` plus a "Read more" toggle, so it never gets cut off mid-word.
- Restyle the ← / → buttons as circular or pill glass buttons:
  `size-10 rounded-full border border-white/15 bg-white/5 backdrop-blur hover:bg-orange-500/20 hover:border-orange-400/50 active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none`,
  each with an `aria-label` ("Previous vehicle" / "Next vehicle").
- Replace the "1 / 4" counter with the same glass styling, plus small dot indicators.
- Add a primary "Select Vehicle" button in Mars orange, using the existing `Button` component rather than new ad-hoc styles.
- Vehicle data comes from `GET /vehicles/` (fields: `name`, `description`, `photo`, `maxSpead`, `maxTherm`, `minTherm`, `maxWind`, ...). Do not hardcode vehicle text.

## Code quality requirements (important)
- **Tailwind only.** No inline `style={{}}` except for truly dynamic values. Do not add new CSS to `globals.css` unless it is a reusable token or utility.
- **Reuse existing components**: `ui/GlassCard`, `ui/Button`, `ui/TelemetryCard`. Do not create a third GlassCard (a duplicate `components/GlassCard.tsx` already exists and causes confusion; use the `ui/` one and flag the duplicate).
- **Split the large Map component** into small, single-purpose components, for example:
  - `components/map/LocationDetailsPanel.tsx`
  - `components/map/VehicleCarousel.tsx`
  - `components/map/PanelCloseButton.tsx`
  - `components/map/useMapSelection.ts` (selected point state and handlers)
- Type everything in TypeScript (props interfaces, no `any`). Convert `Map.jsx` to `.tsx` if it doesn't break the build.
- No magic numbers: put sizes, z-index layers, and offsets in named constants or Tailwind classes (define a z-index scale: map < panels < top bar < modals).
- Extract repeated class strings into small components, or use `cn()` (clsx + tailwind-merge) for conditional classes.
- Accessibility: use `role="dialog"` or `aria-labelledby` on the details panel, keyboard-operable carousel, and visible focus states.
- Keep the existing MapLibre behavior unchanged (markers, route line, Start/End logic). Only the UI layer should change.
- No new dependencies unless clearly justified; if you add one, say why.

## Deliverables
1. The updated and new files, complete, not snippets.
2. A short summary of what changed and why, as a list per file.
3. A note on anything you found that I should fix separately (duplicate GlassCard, encoding issue, etc.).
4. Confirm it passes `pnpm lint` and `pnpm build`.