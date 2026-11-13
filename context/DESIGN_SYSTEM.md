# NASA Space Apps – Mars Website: Design System & Visual Identity

> **Purpose:** This file is the single source of truth for the UI/UX of the project.
> Any AI assistant or developer generating code MUST follow it strictly.
> Do NOT invent new colors, fonts, layouts, components, or copy. If something is not specified here, reuse the closest existing pattern and ask before deviating.
>
> **Note:** Hex values and sizes below are *approximated from the design mock-ups* (Home.pdf, map.pdf). Treat them as design tokens: define them once as CSS variables / Tailwind theme and never hard-code them elsewhere. If the Figma file gives exact values, Figma wins.

---

## 1. Project Overview

- **Project:** NASA Space Apps – Mars website.
- **Pages:** `Home` and `Map` (nav also lists `Action Plan` and `Documents`, which are not designed yet – render them as nav items only).
- **Theme:** Dark, cinematic, sci-fi. Deep space navy + Martian orange/rust. Glassmorphism on the Map page.
- **Tone of voice:** Inspiring, adventurous, professional ("Become a Martian", "reliable Travel Agency"). Home page is marketing/travel-agency style; Map page is a scientific mission-planning dashboard.
- **Language / direction:** English, LTR.
- **Backend (already built, Django API):** `GET /map/`, `GET /path/`, `GET /vehicles/`.

---

## 2. Design Tokens

### 2.1 Colors

| Token | Approx. value | Usage |
|---|---|---|
| `--bg-space-black` | `#05060A` | Hero background, deepest areas |
| `--bg-navy-900` | `#0B1030` | Home page section backgrounds (Services, Fact section) |
| `--bg-navy-800` | `#141A45` | Raised navy containers / rounded section wrappers |
| `--bg-charcoal` | `#1C1E26` | "How reliable we are" section, footer overlay |
| `--bg-card-dark` | `#262932` | Reliability cards |
| `--mars-orange` | `#E8743B` | "MARS" fact title, "AMAZING FACT" badge, Route B, accents |
| `--mars-rust` | `#B5502C` | Mars surface tones, secondary accent |
| `--cream` | `#F6EEDC` | Fact card background |
| `--text-primary` | `#FFFFFF` | Headings and main text on dark |
| `--text-secondary` | `#C9CBD6` | Paragraphs, captions, footer links |
| `--text-muted` | `#8A8EA3` | Hints, data-source labels |
| `--accent-cyan` | `#4FD1E8` | "IMAGINE:" text, chart cursor, mineral bars, icon highlights |
| `--accent-gold` | `#B8A24A` | Icons in "How reliable we are" cards (olive/gold outline) |
| `--route-safe` | `#3DF07A` | Route A (recommended), "Low" risk, success |
| `--route-alt` | `#F5A524` | Route B (alternative), warning marker, Slope line |
| `--risk-red` | `#F0425A` | High risk, hazard zones, Terrain Risk line, "High" label |
| `--science-purple` | `#B44CE6` | Scientific target marker, Radiation line |
| `--elev-blue` | `#6C7BFF` | Elevation line/area in Terrain Profile |
| `--glass-bg` | `rgba(60, 30, 20, 0.55)` | Map-page glass panels (dark translucent brown) |
| `--glass-border` | `rgba(255,255,255,0.12)` | Panel borders |

**Layer indicator dots (Map → Layers panel):**
Satellite Imagery = green · Elevation = yellow · Slope = cyan · Terrain Hazards = red · Scientific Targets = purple.

### 2.2 Typography

- **Display font (headings "MARS", section titles):** wide, geometric, futuristic sans-serif with generous letter-spacing (similar to *Orbitron / Michroma / Syncopate / Krona One*). Pick ONE and use it everywhere for display text.
- **Body / UI font:** clean humanist sans-serif (similar to *Inter / Rubik / Noto Sans / Open Sans*). One family only.
- **Rules:**
  - Hero "MARS": huge, ultra-wide letter-spacing (~0.3em), white, weight regular/medium.
  - Hero "PLANET": tiny, uppercase, extremely wide letter-spacing (~0.5em), above "MARS".
  - Section titles ("Our Services", "HOW RELIABLE WE ARE", "DISCOVER THE THRILL OF SPACE TRAVEL"): centered, display font, letter-spaced. Some are Title Case, some are UPPERCASE – **keep each exactly as written in §4**.
  - Body text: 12–16px, `--text-secondary`, centered in marketing sections, line-height ~1.5–1.6.
  - Map-page panel titles: 14–16px semi-bold white; labels 11–12px; big numbers 16–20px semi-bold.

### 2.3 Radius, Borders, Shadows, Spacing

- **Pill buttons / nav:** `border-radius: 9999px`.
- **Large section wrappers (Services container):** radius ~32–40px.
- **Cards (home):** radius ~16–24px.
- **Map glass panels:** radius ~16px, 1px `--glass-border`, soft dark shadow.
- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px. Generous vertical rhythm between Home sections (≥ 64px).
- **Glassmorphism (Map page only):** `background: var(--glass-bg); backdrop-filter: blur(12–16px); border: 1px solid var(--glass-border);`

### 2.4 Buttons

| Variant | Look |
|---|---|
| **Primary pill (home)** | Dark grey/charcoal (`~#3A3D47`) pill, white uppercase-or-title text, small padding (~10×28px), subtle hover lighten |
| **Active nav item** | Solid black pill, white text |
| **Inactive nav item** | Transparent, white text |
| **Toggle (2M / 3M)** | Two-segment pill; active segment = solid black, inactive = translucent |

Button labels are used **exactly** as written: `Explore Mars`, `WATCH VIDEOS`, `EXPLORE MORE`, `LEARN MORE`.

### 2.5 Icons

- Outline/line icons, ~1.5px stroke, rounded caps (Lucide / Phosphor / Tabler style). Never filled or multi-color icon sets.
- Home reliability icons: gold/olive outline inside a rounded-square frame.
- Map icons: white/light outline inside small dark circles or squares.

---

## 3. Global Components

### 3.1 Top Navigation Bar (both pages)

- Floating, **not** a full-width solid bar – three separate floating elements on the same row:
  1. **Left:** Logo pill – NASA "meatball" logo (circle) + text **"NASA Space Apps"** (semi-transparent glass pill).
  2. **Center:** Nav pill (glass) with 4 items: `Home`, `Map`, `Action Plan`, `Documents`. Active item = solid black pill.
  3. **Right (Map page only):** `2M | 3M` toggle and a **"Mode Of Destination"** dropdown (globe-with-magnifier icon + chevron).
- On Home, the right side has no extra controls.
- Sticky/overlay over the hero / map; transparent-to-glass look.

---

## 4. Page 1 – HOME

Single long scroll page, sections in this exact order:

### 4.1 Hero
- Full-bleed black space background with a **huge Mars planet** partially cropped in the top-right, glowing orange city lights on its dark side.
- Centered text stack:
  - `PLANET` (tiny, wide-spaced)
  - `MARS` (huge, wide-spaced, white)
  - `BECOME A MARTIAN` (small caps, letter-spaced)
  - Paragraph: *"Embark on an extraordinary journey to Mars and unlock the secrets of the Red Planet's captivating landscapes and ancient mysteries"*
  - Two pill buttons side by side: **Explore Mars** · **WATCH VIDEOS**
- Bottom of hero fades into the navy section below.

### 4.2 Our Services
- Dark navy (`--bg-navy-900/800`) **rounded container** (large radius) wrapping the section.
- Title: **Our Services** (centered).
- **3 tall portrait image cards** in a row, rounded corners, equal size, with a centered caption under each:
  1. **Desert City** – domed colony / habitat buildings on Mars
  2. **Exploration** – astronaut on orange Martian terrain
  3. **Travel** – rocket/spaceship on launch pad
- Sub-heading: **We are reliable Travel Agency** (display font, letter-spaced, lighter weight)
- Paragraph: *"Our team of experienced professionals is dedicated to providing you with a safe and unforgettable Mars exploration experience"*
- Button: **EXPLORE MORE**

### 4.3 Amazing Fact Card Section
- Navy background with a large **rounded dark frame** in the center.
- Title: **MARS** (orange, bold, centered at top).
- Large hero illustration: Mars planet in space with a **rover on the Martian surface** in the foreground.
- Overlapping the bottom of the image: a **cream card** containing:
  - Orange pill badge **AMAZING FACT**
  - Text: *"Mars is cold, dusty, and rusty red. Long ago, rivers and lakes may have flowed across its surface. Today, rovers explore its rocks while scientists search for clues about ancient water."*
  - A dark-navy rounded strip with cyan bold text: **IMAGINE: Where would you send a Mars rover next?**
- Small pagination dot(s) below the frame (it behaves like a slider/story card).

### 4.4 Discover the Thrill of Space Travel
- Background: blurred spaceship interior (metallic corridor), dark overlay.
- Title: **DISCOVER THE THRILL OF SPACE TRAVEL** (uppercase, centered).
- **Image carousel** of 3–4 portrait images (space station, Earth through a round porthole window, satellite/spacecraft, astronaut). The **center image is largest**; side images smaller/dimmed (coverflow-style).
- Caption: *"Panoramic Views: Enjoy breathtaking views of the cosmos through large, specially designed windows, offering a glimpse into the wonders of space."*
- Button: **EXPLORE MORE**

### 4.5 Mars Landings Map Banner
- Full-width image of a **dual-hemisphere Mars poster** titled "MARS LANDINGS" (decorative; no text in code besides alt text).

### 4.6 How Reliable We Are
- Charcoal (`--bg-charcoal`) background.
- Title: **HOW RELIABLE WE ARE** (uppercase, centered).
- **4 equal cards** in a row (dark, rounded, subtle border), each with a gold outline icon, a title and a paragraph:
  | Title | Text |
  |---|---|
  | **Cheap** | Experience the wonders of Mars with our affordable tickets, ensuring a seamless and hassle free journey of a lifetime |
  | **Health** | Rest assured with our round the clock medical facility onboard, providing continuous care and dedicated quarantine chambers for your well-being |
  | **Secure** | Uncompromising safety measures for astronauts on their Mars journey, ensuring a secure mission |
  | **Quick** | Effortlessly embark on your Mars adventure with our expedited preparations, eliminating long wait times |
- Button: **LEARN MORE**

### 4.6.1 Icons for reliability cards
Cheap = ticket/price tag · Health = heart with pulse line · Secure = shield with keyhole/lock · Quick = clock.

### 4.7 Footer
- Background: dim photo of an astronaut on Mars with dark overlay.
- **4 link columns** (heading in semi-bold white, links in `--text-secondary`):
  | Flight | Company | Apointments *(spelling as in design)* | Contact us |
  |---|---|---|---|
  | Departure | About us | Schedule | Call us |
  | Arrival | Consultation | Explore | Email |
  | Duration | Mission statement | Accommodation | Address |
  | Spaceship | Safety standards | Customize | Social |
  | Schedule | | Book | Enquiry |
- > Keep the heading **"Apointments"** exactly as in the design unless the team decides to fix the typo (then fix everywhere).

---

## 5. Page 2 – MAP (Mission-planning dashboard)

**Layout concept:** The Mars satellite map fills the **entire viewport** as the background. All UI is **floating glass panels** on top of it. Panels never push the map; the map stays visible in the center.

### 5.1 Panel Map (screen zones)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Logo]        [ Home Map Action Plan Documents ]   [2M|3M] [Mode ▾]  │
│ ┌─Layers────┐                                     ┌─Science Target─┐ │
│ │           │                                     │  image 1/3     │ │
│ └───────────┘             MAP CANVAS              │  Jezero Crater │ │
│ ┌─Route     │   (routes, hazards, markers,        └────────────────┘ │
│ │ Comparison│    crater heat-zone, labels)        ┌─Environmental──┐ │
│ └───────────┘                                     │  Conditions    │ │
│                       [zoom − · ⌖]                └────────────────┘ │
│ ┌─Terrain Profile──┐ ┌─Temp & Radiation─┐ ┌─Vehicle─┐ ┌─Mineral──┐  │
│ └──────────────────┘ └──────────────────┘ └─────────┘ └──────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.2 Map Canvas
- Background: orange-red satellite/elevation imagery of Mars with large faint white **landmark labels** (uppercase, wide letter-spacing, ~40% opacity): `PHOENIX`, `VIKING 1`, `PATHFINDER`, `OPPORTUNITY`.
- **Jezero Crater:** circular **heat-zone gradient** (blue center → green → yellow → transparent orange edge) with label "Jezero Crater" (white, light weight).
- **Route A (Recommended):** solid, glowing **green** line (`--route-safe`) from **Start** to **End**.
- **Route B (Alternative):** **dashed orange** line (`--route-alt`) from Start to End, passing a hazard.
- **Terrain hazard zones:** semi-transparent **red polygons** (`--risk-red`, ~35–45% opacity) and a few translucent yellow/olive polygons.
- **Markers (each = icon in circle + dark pill label):**
  - **Start** – green marker, label "Start"
  - **End** – orange-red pin, label "End"
  - **Science Target** – purple flask icon, label "Science Target"
  - **Warning** – orange triangle with "!" on Route B
- **Scale bar** at bottom-left of map (km units, 0–8) and **zoom controls** (zoom-out `−`, zoom-in/reset, locate/target icon) in a small dark glass pill at the bottom-center-left.
- **2M / 3M toggle** switches between 2D and 3D map view.

### 5.3 Layers Panel (top-left)
- Title **Layers** with stacked-layers icon.
- 5 rows, each: **teal checkbox** + icon + label + colored dot on the right. All checked by default.
  1. Satellite Imagery (green dot)
  2. Elevation (yellow dot)
  3. Slope (cyan dot)
  4. Terrain Hazards (red dot)
  5. Scientific Targets (purple dot)
- Toggling a row shows/hides that layer on the map.

### 5.4 Route Comparison Panel (left, under Layers)
- Title **Route Comparison** with swap-arrows icon.
- **Route A card** – green border/tint:
  - Title `Route A (Recommended)`, green badge **Safer**
  - 3 stats in columns: **Distance** `8.4 km` · **Est. time** `2.1 hours` · **Slope risk** `Low` (green text + short green progress bar)
- **Route B card** – orange border/tint:
  - Title `Route B (Alternative)`, orange badge **Shorter**
  - **Distance** `6.7 km` · **Est. time** `1.6 hours` · **Slope risk** `High` (red text + warning triangle icon + red progress bar)
- Selecting a card highlights its route on the map.

### 5.5 Science Target Panel (top-right)
- Title **Science Target** with flask icon.
- **Image slider** (rounded photo of Martian rock layers) with `‹` `›` arrow buttons and counter badge **`1 / 3`** (bottom-right).
- Name **Jezero Crater** (bold) + **Geology** tag pill (right).
- Description placeholder: *"this place where the information about the scientific target will appear."* (dynamic text from API).
- Rows with icon + label + value:
  - **Distance from current position** → `4.8 km`
  - **Data source** → `Mars Reconnaissance Orbiter (HiRISE)`
  - **Confidence level** → `Medium` + green/yellow progress bar + `75%`

### 5.6 Environmental Conditions Panel (right, below Science Target)
- Title **Environmental Conditions** with wave icon.
- **2×2 grid** of small dark rounded tiles (icon in circle + label + value):
  | Radiation `0.4 mSv/h` | Temperature `Avg 210 K` |
  |---|---|
  | **Wind Speed** `8 m/s` | **Speed** `60 Km/h` |
- Footer: info icon + `Data source:` (small, muted).

### 5.7 Bottom Row (4 panels, same height)
1. **Terrain Profile** (widest)
   - Line/area chart, X = `Distance (km)` 0–8+, left Y = `Elevation (m)` 0–800, right Y = `Slope (°)` 0–60.
   - Legend: **Elevation** (blue `--elev-blue`, filled gradient area), **Slope** (orange), **Terrain Risk** (red, filled).
   - **Hover tooltip + vertical cursor line** (cyan/white) with dots on each series. Example tooltip: `4.8 km · Elevation: 432 m · Slope: 12°`.
2. **Temperature & Radiation**
   - Dual-axis line chart, X = `Distance (km)`, left Y = `Temperature (K)` 100–300, right Y = `Radiation (mSv/h)` 0.0–2.0.
   - **Temperature** = orange line, **Radiation** = purple line (with soft purple fill). Same vertical-cursor interaction, synced with Terrain Profile.
3. **Vehicle**
   - Title **Vehicle** with `‹` `›` arrows to switch vehicles (from `GET /vehicles/`).
   - Below: large empty **dark navy rounded box** reserved for the vehicle image / 3D model viewer.
4. **Mineral Composition**
   - Title with atom icon. Three horizontal progress bars (teal/cyan fill on dark track) with label left and % right:
     - Water (H₂O) – 52%
     - Silicon (Si) – 60%
     - Iron (Fe) – 20%
   - Footer: info icon + `Data source: MRO (CRISM)`.

### 5.8 Map-page interactions (behavior)
- Hover on charts moves a synced cursor across Terrain Profile and Temperature & Radiation and can highlight the matching point on the route.
- Layers checkboxes toggle map overlays.
- Route cards toggle the active route.
- Science Target slider cycles images (`1/3 → 2/3 → 3/3`).
- Vehicle arrows cycle vehicles.
- 2M/3M switches the map mode; "Mode Of Destination" dropdown changes the destination mode.

---

## 6. Data ↔ UI Mapping (Backend)

| Endpoint | Feeds |
|---|---|
| `GET /map/` | Map canvas: base imagery, landmarks, hazard polygons, science targets, layers |
| `GET /path/` | Route A / Route B geometry, distance, est. time, slope risk, terrain profile & temperature/radiation series |
| `GET /vehicles/` | Vehicle panel (name/image/model), and `Speed` value |

> Never hard-code the sample values shown in this document (8.4 km, 210 K, etc.). They are **placeholder data from the design**; real values must come from the API, formatted with the same units and labels.

---

## 7. Responsiveness

- **Home:** sections stack vertically on mobile; 3 service cards → horizontal scroll or 1-column; 4 reliability cards → 2×2 then 1-column; footer columns → 2×2 then accordion/stack; nav pill collapses into a hamburger menu.
- **Map:** desktop-first dashboard. On tablet/mobile: map stays full-screen, panels become **collapsible bottom sheets / drawers** (Layers, Routes, Target, Conditions, Charts) – keep glass styling and the same content order.
- Min design width targeted by mock-ups: ~1366px (Map), ~1440px (Home).

---

## 8. Accessibility & Quality

- Text contrast ≥ 4.5:1 on glass panels (adjust blur/opacity, never change the palette).
- All images need `alt`; the Mars Landings poster alt = "Mars landing sites map".
- Interactive elements need visible focus states (cyan outline).
- Charts must have tooltips and accessible labels; do not rely on color alone (use legends + labels for Route A/B).
- Respect `prefers-reduced-motion` for carousels / hero animation.

---

## 9. STRICT RULES FOR AI CODE GENERATION

**DO**
1. Use only the tokens in §2 (CSS variables / Tailwind theme extension).
2. Keep section order, titles, button labels and copy exactly as in §4 and §5 (including casing).
3. Reuse shared components: `NavBar`, `PillButton`, `GlassPanel`, `SectionTitle`, `ServiceCard`, `ReliabilityCard`, `StatTile`, `ProgressBar`, `ChartPanel`, `LayerToggle`, `RouteCard`, `Slider`.
4. Keep Map page = full-screen map + floating glass panels. Keep Home = dark, cinematic, centered, generous spacing.
5. Keep chart colors: Elevation=blue, Slope=orange, Terrain Risk=red, Temperature=orange, Radiation=purple.
6. Keep route colors: Route A=green solid, Route B=orange dashed, hazards=red.
7. Build components so values come from props/API, not hard-coded.

**DON'T**
1. Don't add light mode, new colors, gradients, emojis, or new fonts.
2. Don't replace glass panels with solid white cards, Material/Bootstrap default styling, or a sidebar layout.
3. Don't add new sections, pages, or features that are not in the designs.
4. Don't change the nav structure (`Home, Map, Action Plan, Documents`) or turn the floating nav into a full-width bar.
5. Don't use filled or colorful icon packs; stay with thin outline icons.
6. Don't "improve" the design silently – if a better idea exists, propose it separately and wait for approval.

---

## 10. Suggested Component Checklist

**Home:** `Hero`, `ServicesSection`, `AmazingFactCard`, `SpaceTravelCarousel`, `MarsLandingsBanner`, `ReliabilitySection`, `Footer`.
**Map:** `MapCanvas`, `LayersPanel`, `RouteComparisonPanel`, `ScienceTargetPanel`, `EnvironmentalConditionsPanel`, `TerrainProfileChart`, `TemperatureRadiationChart`, `VehiclePanel`, `MineralCompositionPanel`, `MapControls (zoom/scale)`, `ViewToggle (2M/3M)`, `DestinationModeDropdown`.
**Shared:** `NavBar`, `GlassPanel`, `PillButton`, `SectionTitle`, `Icon`.
