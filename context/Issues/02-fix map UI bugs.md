# Task: Refactor the Map page UI (Location Details card + Vehicle card)

## Context
- Project: Martian Map (NASA Space Apps), Next.js 16 (App Router), React 19, TypeScript, **Tailwind CSS v4**, MapLibre GL JS.
- Relevant files: `frontend/components/Map.jsx`, `frontend/components/ui/GlassCard.tsx`, `frontend/components/ui/Button.tsx`, `frontend/components/ui/TelemetryCard.tsx`, `frontend/app/globals.css` (design tokens + glass utilities).
- Design source of truth: `context/DESIGN_SYSTEM.md` and `design/map.pdf` (dark cinematic theme, Mars orange/rust accents, cyan telemetry, glassmorphism).

## Target layout (no panel may overlap another)
- **Top:** navbar and Tharsis/Jezero switcher (unchanged).
- **Left:** "Selected Destinations" + "Route Analytics" panel (unchanged).
- **Right:** Vehicle card, collapsible (see section 3), placed below the top bar.
- **Bottom center:** Location Details card (see section 1).
- Define a z-index scale in one place (map < panels < top bar < modals) and use it everywhere.

## Problems to fix

### 1. Location details card: move to bottom center
Currently the card opens on the right side, overlaps the Vehicle card and the top bar, and its long text runs under the telemetry cards.

**Required:**
- Position it at the **bottom center** of the screen:
  `fixed bottom-4 left-1/2 -translate-x-1/2 w-[min(720px,calc(100vw-2rem))] max-h-[45vh]`.
- Layout inside the card (desktop `md+`): two columns using `grid md:grid-cols-[200px_1fr]`: image on the left; on the right a header (title + close button), a scrollable description, and the telemetry cards (Temperature / Slope / Speed) in a `grid grid-cols-3 gap-3` row at the bottom.
- Use `flex flex-col` so there are three zones: fixed header, scrollable body (`flex-1 overflow-y-auto`, thin custom scrollbar), and fixed footer for telemetry. Text must never run under the telemetry cards.
- On mobile (`< md`): a single column, full width bottom sheet (`inset-x-0 bottom-0 rounded-t-2xl max-h-[60vh]`), telemetry in a horizontally scrollable or 3-column compact row.
- Make sure it never covers the left panel or the right Vehicle card: on large screens, constrain its width so it stays between them (for example `lg:w-[min(720px,calc(100vw-740px))]`), and make the width values named constants or Tailwind theme tokens.
- Enter/exit animation driven by state, not conditional unmounting: `transition-all duration-300`, from `translate-y-4 opacity-0 pointer-events-none` to `translate-y-0 opacity-100`.
- Fix the mojibake in the description text (`MarsÆ` should be `Mars'`). Make sure files and API responses are read as UTF-8.

### 2. Close the details card
- Add a close button (X icon, `lucide-react` or inline SVG) in the card header, top-right.
- It needs `aria-label="Close location details"`, a visible focus ring, a hover state, and a hit area of at least 36x36px.
- Also close on **Escape** and on a click on an empty area of the map.
- Closing clears the selected-point state, but must **not** remove the point from Start/End/Science Target selections.

### 3. Vehicle card: collapsible, roomier, nicer buttons
**Open / close behavior**
- Add a toggle so the user can open and close the Vehicle card. When closed, it collapses to a small round or pill launcher button on the right edge (vehicle icon + "Vehicle" label on `md+`), with `aria-expanded`, `aria-controls`, and `aria-label="Open vehicle selector"` / `"Close vehicle selector"`.
- Inside the open card, add a close/collapse button in the header (same `PanelCloseButton` as the details card, for consistency).
- Animate with state: `transition-all duration-300`, sliding from the right (`translate-x-full opacity-0 pointer-events-none` when closed).
- Default state: **open on desktop, closed on mobile**. Selecting a vehicle must not force the card to close, but pressing Escape while it has focus may collapse it.
- Opening the Vehicle card must not hide or move the Location Details card.

**Spacing and style**
- Real internal spacing: `p-5` (or `p-6`), `gap-4` between sections, `space-y-3` for text blocks. Text must never touch the card edges.
- Image in its own rounded container: `rounded-xl overflow-hidden aspect-[4/3] object-cover`.
- Title: `text-base font-semibold text-center`. Description: `text-sm leading-relaxed text-white/70`, clamped with `line-clamp-4` plus a "Read more" toggle, so it is never cut off mid-word.
- Restyle the ← / → buttons as circular glass buttons:
  `size-10 rounded-full border border-white/15 bg-white/5 backdrop-blur hover:bg-orange-500/20 hover:border-orange-400/50 active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none`,
  each with `aria-label` ("Previous vehicle" / "Next vehicle"), and keyboard support (left/right arrow keys when the carousel is focused).
- Replace the plain "1 / 4" with a glass counter plus small dot indicators.
- Add a primary "Select Vehicle" button in Mars orange, using the existing `Button` component rather than ad-hoc styles.
- Vehicle data comes from `GET /vehicles/` (fields: `name`, `description`, `photo`, `maxSpead`, `maxTherm`, `minTherm`, `maxWind`, ...). Do not hardcode vehicle text.

## Code quality requirements (important)
- **Tailwind only.** No inline `style={{}}` except for truly dynamic values. No new CSS in `globals.css` unless it is a reusable token or utility.
- **Reuse existing components**: `ui/GlassCard`, `ui/Button`, `ui/TelemetryCard`. Do not create a third GlassCard (a duplicate `components/GlassCard.tsx` already exists; use the `ui/` one and flag the duplicate).
- **Split the large Map component** into small single-purpose pieces, for example:
  - `components/map/LocationDetailsPanel.tsx`
  - `components/map/VehicleCarousel.tsx`
  - `components/map/VehiclePanel.tsx` (open/close shell + launcher button)
  - `components/map/PanelCloseButton.tsx`
  - `components/map/useMapSelection.ts` (selected point state and handlers)
  - `components/map/usePanelState.ts` (open/close state, Escape handling)
- Type everything in TypeScript (props interfaces, no `any`). Convert `Map.jsx` to `.tsx` if it doesn't break the build.
- No magic numbers: sizes, z-index layers and offsets go in named constants or Tailwind classes.
- Extract repeated class strings into small components, or use `cn()` (clsx + tailwind-merge) for conditional classes.
- Accessibility: `role="dialog"` with `aria-labelledby` on the details panel, keyboard-operable carousel, visible focus states, and focus returned to the launcher button after the Vehicle card closes.
- Keep the existing MapLibre behavior unchanged (markers, route line, Start/End logic). Only the UI layer changes.
- No new dependencies unless clearly justified; if you add one, say why.

## Deliverables
1. The updated and new files, complete, not snippets.
2. A short summary of what changed and why, as a list per file.
3. A note on anything I should fix separately (duplicate GlassCard, encoding issue, etc.).
4. Confirmation that it passes `pnpm lint` and `pnpm build`.