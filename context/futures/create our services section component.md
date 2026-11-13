You are working on the Martian Map frontend (Next.js 16 App Router, React 19, Tailwind CSS v4, pnpm).

TASK
Build the "Our Services" section as a single component at
`frontend/components/OurServices.jsx` (default export, "use client"), and render it
in `app/page.tsx` in place of the existing comment placeholder for this section.
Do NOT build the Hero section (leave its comment untouched). Do NOT touch Map.jsx or API code.
Reuse existing tokens/utilities from `app/globals.css` and `components/ui/*` (Button.tsx) where they fit;
don't hardcode values if a token exists.

LAYOUT (match the design screenshot)
- The section is a large dark navy panel (deep blue/indigo, ~#0a0a2a → #11113a subtle vertical gradient)
  with big rounded corners (~48px), sitting directly under the hero and slightly overlapping its bottom edge.
  Generous vertical padding (~120px top, ~80px bottom on desktop).
- Everything is center-aligned in a container (max-w ~1150px).
- Title: "Our Services" — large (~40–48px), wide/extended geometric display font with letter spacing,
  muted gray-lavender color (not pure white). Use the display font already in the project/design system;
  if none exists, pick a wide display font via next/font (e.g. Orbitron / Syncopate / Krona One) and mention it.
- Three portrait image cards in a row (gap ~30px), each ~355px wide × ~535px tall (aspect ≈ 2:3),
  `object-cover`, small border radius (~8px). Below each image, a centered caption in white (~20px):
  "Desert City", "Exploration", "Travel".
  Images (put placeholders if files are missing, and keep paths in one array):
    /images/services/desert-city.jpg  → Mars base with domes and a long greenhouse
    /images/services/exploration.jpg  → astronaut next to a rover on red desert
    /images/services/travel.jpg       → rocket standing on Mars surface
  Use `next/image` with explicit width/height or `fill` + sizes, and meaningful alt text.
- Subheading: "We are reliable Travel Agency" — same display font as the title, ~32px, same muted color.
- Paragraph (white, ~18px, centered, max-w ~760px, line-height ~1.4):
  "Our team of experienced professionals is dedicated to providing you with a safe and unforgettable Mars exploration experience"
- CTA: pill button "EXPLORE MORE" — uppercase, condensed bold font, slate-blue/gray background (~#666a84),
  white text, fully rounded, ~240×54px.
Keep all copy/image data in a `const services = [...]` array at the top of the file.

ANIMATIONS (light, performance-friendly)
1. Scroll reveal: title, each image card, subheading, paragraph, and button fade in + slide up
   (~24px, 600ms, ease-out) when they enter the viewport. Small `useInView` hook with
   IntersectionObserver, trigger once, threshold ~0.2.
2. Stagger: the 3 cards appear one after another (~150ms delay each); then subheading → paragraph → button
   follow with small delays.
3. Card hover: image zooms slightly inside its rounded container (scale 1.05, overflow-hidden, 400ms),
   card lifts translateY(-6px), soft orange (Mars accent) glow/shadow, caption brightens.
4. Button hover: slight lift + lighter background + soft glow; active state scales to 0.98.
5. Optional: very subtle parallax/float on the images (CSS only, a few px).
Rules:
- No external animation library. CSS transitions/keyframes + Tailwind only.
- Animate only `transform` and `opacity` (+ box-shadow on hover only).
- Respect `prefers-reduced-motion` (disable animations, show content immediately).

RESPONSIVE
- lg+: 3 columns as in the design.
- md: 3 columns with smaller images, or 2 + 1 centered.
- mobile: single column, images full width (max ~360px), reduced panel radius/padding, smaller titles.

ACCESSIBILITY
- `<section aria-labelledby="services-title">` with `<h2 id="services-title">`; subheading as `<h3>`.
- Visible focus-visible ring on the button; images have alt text.

DELIVERABLES
- `components/OurServices.jsx`
- Updated `app/page.tsx` rendering `<OurServices />` at the placeholder.
- Run `pnpm lint` and fix issues. Reply with a short summary and note any deviations from the design.