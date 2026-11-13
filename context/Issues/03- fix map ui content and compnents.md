You are working on the Martian Map project (NASA Space Apps – Mars). Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, pnpm. The frontend is in /frontend. Read context/DESIGN_SYSTEM.md first and follow its visual identity (dark cinematic theme, Mars orange/rust accents, cyan telemetry accents, glassmorphism). Reuse existing components in components/ui (Navbar, Button, GlassCard) instead of creating duplicates.

Our project is a Mars mission-planning tool. An astronaut picks a destination on a Martian map (e.g. Jezero Crater, Tharsis–Chryse Corridor), picks a vehicle (rover), and the system computes a safe or science-oriented route using elevation, slope, temperature, wind, and Fe/Si/H2O data. The result shows distance, estimated time, slope risk, temperature range, and resource richness. ALL copy on the Home page must relate to this challenge. No generic travel-agency text (no "cheap tickets", "medical facility onboard", "Travel Agency", "Spaceship schedule", etc.).

Edit the Home page (app/page.tsx and related components) with these 4 changes:

## 1) Replace "Our Services" with "Our Mission"
- Rename the section to "Our Mission".
- Content: explain that an astronaut can (a) choose a route based on the destination goal, either the safest route (least-cost) or a science route (rich in water, iron, silicon), and (b) choose their vehicle, because the vehicle's limits (max speed, max slope, temperature and wind tolerance) directly affect the route, the travel time, and the mission cost.
- Layout: a headline + short paragraph, then 3 glass cards:
  1. "Choose Your Destination" – pick a target such as Jezero Crater from the map.
  2. "Choose Your Vehicle" – each rover has different speed and safety limits that change time and cost.
  3. "Choose Your Route" – Safe route vs Science route, compared by distance, estimated time, and slope risk.
- Add a CTA button "Plan Your Mission" linking to /map.

## 2) Rebuild the "Discover the thrill of space travel" component
- Rename the title to something related to our challenge, e.g. "EXPLORE THE RED PLANET'S TERRAIN".
- It is a horizontal carousel of image cards that looks like the reference screenshot: 3 visible cards in a staggered/overlapping layout, the center card is larger and on top (higher z-index), the side cards are smaller, partially behind it, and dimmed (scale ~0.85, lower opacity). Rounded corners and a soft shadow.
- Auto-play: slides move automatically at a slow, calm pace (every ~4 seconds, smooth ease transition ~800ms). Pause on hover.
- Add left and right arrow buttons (glass style, Mars-orange hover) to navigate manually; the loop should be infinite. Optionally add dots indicators.
- Each card has a short caption related to the project (e.g. "Jezero Crater – ancient river delta", "Tharsis Region – volcanic highlands", "Safe Route Analysis", "Terrain Slope Hazards"). Use the existing images in public/ for now (or placeholders) and keep the images easy to replace.
- Implement it with React state + CSS transitions (or GSAP), make it a client component ("use client"), accessible (aria-labels on arrows), and responsive (on mobile show 1 card).

## 3) Rewrite all the Home page text so it fits our challenge
- Hero: Title "BECOME A MARTIAN" can stay, but the subtitle should be something like: "Plan safe and science-driven routes across the Martian surface. Choose your destination, pick your vehicle, and explore Mars with real terrain data."
- Primary button: "Explore Mars" → /map. Secondary button: "Watch Videos" can stay or become "How It Works".
- Remove the "How reliable we are" section (Cheap / Health / Secure / Quick) and replace it with "Why Martian Map" with 4 items tied to our data: Safe Routes (slope, temperature, wind limits), Science Targets (H2O, Fe, Si), Vehicle-Aware (speed and limits per rover), Real Data (Mars Reconnaissance Orbiter, HiRISE, CRISM).
- Footer: replace Flight/Company/Consultation/Explore/Contact columns with relevant ones: Mission (Map, Action Plan, Documents), Data (Elevation, Thermal, Wind, Minerals), Project (About, NASA Space Apps, GitHub), Contact.

## 4) Hero section: replace the Mars planet with my SVG + GSAP rotation
- Use /public/images/home/MArs 1.svg (note the exact filename with the space and capital A; if it causes URL issues, rename it to mars-1.svg and update the reference). Replace the current Mars image in the hero with it using next/image (or a plain <img> if next/image has trouble with the SVG; use unoptimized for SVG).
- Install GSAP: `pnpm add gsap`.
- In a client component, use gsap with useRef + useEffect (or @gsap/react's useGSAP) to rotate the planet continuously, like a planet spinning on its axis: gsap.to(ref.current, { rotation: 360, duration: 120, ease: "none", repeat: -1, transformOrigin: "50% 50%" }). Slow and smooth, no jumps.
- Optional extra: a very subtle floating motion (y: ±10px, yoyo) on a wrapper.
- Clean up the animation on unmount (ctx.revert()).
- Make sure the planet stays centered behind the hero text, doesn't overflow horizontally, and is responsive.

## General requirements
- TypeScript, no `any`, no unused code. Keep the existing Navbar.
- Keep the design system tokens from globals.css (don't hardcode new random colors).
- Create new components under components/home/ (HeroPlanet.tsx, MissionSection.tsx, SpaceCarousel.tsx, WhyMartianMap.tsx, Footer.tsx) and compose them in app/page.tsx.
- Run `pnpm lint` and `pnpm build` at the end and fix any errors.
- At the end, give me a short summary of the files changed.