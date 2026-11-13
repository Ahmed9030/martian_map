I am working on a Next.js project (with Tailwind CSS and TypeScript) inspired by space exploration and Mars mapping interfaces (featuring dark space themes, glassmorphism effects, and neon/orange accents matching Martian UI). 

Please help me define and set up the **Design Tokens** and configuration files based on this aesthetic:

1. **Colors (Tailwind Config `tailwind.config.js` / CSS Variables):**
   - Background Primary: Deep space dark (`#121214` or similar ultra-dark charcoal/black).
   - Surface / Glass Backgrounds: Semi-transparent dark layers with backdrop blur (e.g., `rgba(18, 18, 20, 0.7)`).
   - Accent / Brand: Martian Orange / Rust (`#E05638` or similar vivid Mars tone) and subtle space blue/cyan for telemetry data.
   - Text: High-contrast white/light gray for headers, muted gray (`#9CA3AF`) for secondary text.

2. **Typography:**
   - Define clean modern sans-serif font families (e.g., Inter or system-ui equivalents) with proper scale weights for telemetry data, headings, and body text.

3. **Spacing & Border Radius:**
   - Consistent spacing scale for futuristic dashboard cards, map overlays, and sidebar panels.
   - Rounded corners tailored for modern glass cards (e.g., `rounded-xl`, `rounded-2xl`).

4. **Glass Effect (Glassmorphism Utilities):**
   - Create reusable CSS utility classes or Tailwind shortcuts for glass cards: `backdrop-blur-md`, subtle border (`border border-white/10`), and soft shadows.

Please provide:
- The updated `tailwind.config.js` (or Tailwind v4 `@theme` configuration if applicable).
- The updated `app/globals.css` containing CSS custom properties and utility classes for the glass effects.
- A quick usage example of a glass card component with Martian styling.
