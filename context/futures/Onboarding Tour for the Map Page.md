# Task: First-Visit Onboarding Tour for the Map Page

## Context
Project: Martian Map (NASA Space Apps). The frontend uses Next.js (App Router), React 19,
TypeScript, Tailwind CSS v4, and MapLibre GL JS. The Map page is a full-screen map with
floating glass panels on top (Layers, Route Comparison, Science Target, Environmental
Conditions, Vehicle, Mineral Composition). Review context/DESIGN_SYSTEM.md, the tokens in
app/globals.css, and the existing components in components/ui (GlassCard, Button).
The project has no authentication, so "first visit" is determined per browser (localStorage).

## Goal
Build an interactive onboarding tour that appears automatically the first time any user
(logged in or not) visits the Map page. It should teach users how to use the site with
practical examples and real results, with excellent UX.

## Required Flow

### 1) Welcome Step (before any explanation)
A small centered glass-style modal with a friendly title, one short sentence, and two buttons:
- "Start the tour" -> begins the tour
- "Skip, let me explore" -> closes the modal and lets the user use the site immediately
- Optional checkbox: "Don't show this again"
If the user chooses Skip, record that they've seen the tour so it does not auto-show again.

### 2) Tour Steps
Each step spotlights a specific element and shows a tooltip card beside it. Steps:
1. Map canvas: drag and zoom to navigate the Martian surface; click to pick Start/End points.
2. Layers panel: toggle layers (Satellite, Elevation, Slope, Terrain Hazards, Scientific Targets).
3. Vehicle panel: choose a vehicle (its limits map to maxSlope/maxTherm/minTherm/maxWind/speed).
4. Select Start & End: a practical example (see "Practical Example" below).
5. Route Comparison: the difference between Route A (Safer) and Route B (Shorter), and how to
   read Distance / Est. time / Slope risk.
6. Charts (Terrain Profile / Terrain Risk / Temperature): how to read them.
7. Science Target + Mineral Composition (H2O, Si, Fe): science mode.
8. Environmental Conditions: temperature, wind, radiation.
9. Finish: closing message + "Done" button + a note that "Replay tour" is available later.

### 3) Controls on Every Step
- Next / Back
- Skip tour (always visible)
- Progress indicator (e.g. "3 / 9" plus dots or a progress bar)
- Close (X) + Esc key
- Keyboard: ArrowRight / ArrowLeft / Esc, with a focus trap inside the tooltip
- If the user skips mid-tour, show a small toast: "You can replay the tour anytime from the (?) button"

## Focus / Spotlight Effect (very important)
- A dark overlay (about rgba(0,0,0,0.65) with a light backdrop-blur) covering the whole screen.
- A "cutout" around the target element (spotlight) with border-radius, small padding, and a
  subtle glow using the Mars orange/cyan design tokens.
- The target element stays clear and bright; everything else is dimmed.
- The overlay blocks interaction with the rest of the page during the tour (unless the step is interactive).
- The tooltip positions itself automatically (top/bottom/left/right) based on available space,
  stays inside the viewport, and updates on resize and scroll.
- If a target element is missing or its panel is closed: open it automatically or skip the
  step gracefully, without crashing.

## Practical Example (Interactive Demo Step)
In the "Select Start & End" and "Route Comparison" steps:
- A "Try an example" button loads a ready-made scenario on Jezero Crater:
  1. Places Start and End markers with a pulse animation.
  2. Draws a route on the map with a progressive line-draw animation.
  3. Shows real results: Distance, Est. time, Slope risk, Max slope, Temperature range.
- Data source: a real call to GET /path/ using the API base URL from env
  (https://raheemelnashar.pythonanywhere.com), with vehicle limits from /vehicles/ and
  destination coordinates from /map/?map=1.
- Fallback: if the API fails or is slow, use static mock data and show a "Sample data" badge.
- Include a loading state (skeleton/spinner) and error handling that never breaks the tour.
- When the tour ends, clear the demo route/markers and restore the map to its original state.

## Animations
- Use GSAP if it's already installed in the project, otherwise Framer Motion or CSS
  transitions (pick the best fit without adding a new dependency unless necessary).
- Light fade + scale for the modal and tooltip.
- Smooth spotlight transition between steps (it moves and resizes fluidly).
- Pulse ring around the key element.
- Respect prefers-reduced-motion (reduce or disable animations).
- Keep animation duration between 200-400ms with no lag.

## Persistence (when it shows)
- localStorage key, e.g. `martian-map:onboarding`, with value
  { status: "completed" | "skipped", version: 1, at: ISO date }.
- Auto-show only if the key doesn't exist or its version is older (so we can re-trigger
  the tour after UI changes).
- No SSR hydration issues: read localStorage inside useEffect only and render the tour client-side.
- A persistent (?) / "Help" button in the UI (Navbar or map corner) to replay the tour manually.
- If login is added in the future, keep this layer abstracted (e.g. a useOnboardingState hook)
  so storage can be swapped to a backend easily.

## Architecture / Code Quality
- Suggested components in components/onboarding/:
  - OnboardingProvider.tsx (Context: state, start, next, back, skip, finish)
  - OnboardingWelcome.tsx
  - TourOverlay.tsx (spotlight + overlay)
  - TourTooltip.tsx
  - steps.ts (config array: id, target selector, title, description, placement, optional action)
  - useOnboardingState.ts (persistence hook)
- Targets are identified with attributes like `data-tour="layers-panel"` instead of brittle class selectors.
- Steps live in a separate, data-driven config so content is easy to edit.
- Reuse the existing GlassCard and Button from components/ui and the design tokens
  (don't duplicate styles).
- Use 'use client' only where needed. TypeScript strict, no `any`.
- Don't heavily modify Map.jsx; only add data-tour attributes and any hooks needed for the demo.
- Render the overlay in a Portal with a calculated z-index so it sits above MapLibre controls.

## UX & Accessibility
- Mobile responsive: on small screens the tooltip becomes a bottom sheet.
- Short, clear copy (max two sentences per step), simple English.
- role="dialog" + aria-labelledby/aria-describedby + aria-live for updates.
- Focus management: focus moves to the tooltip and returns to the trigger on close.
- Sufficient text contrast over the overlay.
- Never trap the user: Skip is available at any moment.

## Acceptance Criteria
- [ ] First visit: the Welcome modal appears with two options (Start / Skip) with no noticeable delay.
- [ ] The tour spotlights each panel correctly with a dim overlay and a well-placed tooltip.
- [ ] Next / Back / Skip / Esc / Arrow keys all work.
- [ ] The practical example draws a real route from the API, with a fallback and no crash on failure.
- [ ] The tour does not auto-show again after completed/skipped, and "Replay tour" works.
- [ ] No hydration warnings, no layout shift, and pnpm lint and pnpm build pass.
- [ ] Works on both mobile and desktop.

## Deliverables
1. Complete code with the suggested file structure.
2. A short explanation of how to add or edit a step.
3. Notes on any assumptions made (e.g. panel names if they differ from the existing code).