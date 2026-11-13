Act as an expert Frontend Developer proficient in Next.js (App Router), TypeScript, and Tailwind CSS. 

Based on the Martian Map / Space Apps design reference (featuring an ultra-dark space theme `#121214`, glassmorphism effects with backdrop-blur, subtle white borders `border-white/10`, and Martian orange accents `#E05638`), please build the following 4 shared UI components inside `components/ui/`:

1. **`GlassCard.tsx`**:
   - A reusable translucent, blurred card container.
   - Background: `bg-[#121214]/70` with `backdrop-blur-md`.
   - Border: Subtle white/10 border.
   - Hover effect: Subtle border and shadow glow using Martian orange (`#E05638`).

2. **`Button.tsx`**:
   - Supports variants: `primary` (solid Martian orange `#E05638` with glow), `secondary`, and `glass` (translucent backdrop).
   - Smooth transitions and active scale effect (`active:scale-95`).

3. **`Navbar.tsx`**:
   - A fixed floating glass header (`fixed top-4 left-1/2 -translate-x-1/2`).
   - Includes Mars branding logo with an animated pulse dot, four navigation links (Home, Map, Action Plan, Documents), and a primary call-to-action button ("Explore Mars").

4. **`TelemetryCard.tsx`**:
   - A specialized glass card for space metrics (temperature, radiation, slope, or speed as seen in the Mars maps).
   - Includes a data source label (e.g., "Data source: MRO / HiRISE"), stat numbers, and a progress bar or visual indicator matching the dark sci-fi aesthetic.

Please write clean, modular, and fully typed TypeScript code for each component using Tailwind CSS utility classes.
