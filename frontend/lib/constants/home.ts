export type ImageAsset = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type Cta = {
  label: string;
  href: string;
};

export type IconId =
  | "destination"
  | "vehicle"
  | "route"
  | "safe"
  | "science"
  | "data";

export type MissionStep = {
  id: string;
  title: string;
  description: string;
  icon: IconId;
};

export type TerrainSlide = {
  id: string;
  location: string;
  caption: string;
  image: ImageAsset;
};

export type Reason = {
  id: string;
  title: string;
  description: string;
  icon: IconId;
};

export type FooterLink = {
  label: string;
  href: string;
};

export type FooterGroup = {
  heading: string;
  links: readonly FooterLink[];
};

export const MAP_ROUTE = "/map";

export const hero = {
  eyebrow: "PLANET",
  title: "MARS",
  subtitle: "BECOME A MARTIAN",
  description:
    "Plan safe and science-driven routes across the Martian surface. Choose your destination, pick your vehicle, and explore Mars with real terrain data.",
  primaryCta: { label: "Explore Mars", href: MAP_ROUTE },
  secondaryCta: { label: "How It Works", href: "#mission" },
  planet: {
    src: "/images/home/mars-planet.svg",
    alt: "The planet Mars with city lights on its night side",
    width: 1000,
    height: 1000,
  } satisfies ImageAsset,
} as const;

export const mission = {
  eyebrow: "Mission planning",
  title: "Our Impact",
  description:
    "Every Martian expedition starts with three decisions: where to go, what to drive, and which way to travel. Martian Map turns real orbital data into a route an astronaut can trust.",
  cta: { label: "Plan Your Mission", href: MAP_ROUTE },
  steps: [
    {
      id: "time",
      title: "Save Your Time",
      description:
        "compute the fastest route to your destination, taking into account each rover’s speed and terrain limits.",
      icon: "destination",
    },
    {
      id: "vehicle",
      title: "Choose Your Vehicle",
      description:
        "Each rover has a different top speed, slope, temperature and wind tolerance — limits that directly change travel time and mission cost.",
      icon: "vehicle",
    },
    {
      id: "destination",
      title: "Choose Your Destination",
      description:
        "Pick a target such as Jezero Crater straight from the map. Every site carries its own terrain, climate and mineral profile.",
      icon: "route",
    },
  ] satisfies readonly MissionStep[],
} as const;

export const terrain = {
  title: "EXPLORE THE RED PLANET’S TERRAIN",
  description:
    "Seven regions — from the north polar cap to Olympus Mons — each one a terrain sample Martian Map can route an astronaut through.",
  cta: { label: "Explore the Map", href: MAP_ROUTE },
  backdrop: {
    src: "/images/home/terrain/valles-marineris.jpg",
    alt: "",
    width: 675,
    height: 900,
  } satisfies ImageAsset,
  slides: [
    {
      id: "north-polar-cap",
      location: "North Polar Cap",
      caption: "Layered water-ice deposits · seasonal frost",
      image: {
        src: "/images/home/terrain/north-polar-cap.jpg",
        alt: "Spiral layers of ice and dust in the Martian north polar cap",
        width: 675,
        height: 900,
      },
    },
    {
      id: "tharsis-montes",
      location: "Tharsis Montes",
      caption: "Three shield volcanoes · steep slope hazards",
      image: {
        src: "/images/home/terrain/tharsis-montes.jpg",
        alt: "Orbital view of the three Tharsis Montes shield volcanoes",
        width: 675,
        height: 900,
      },
    },
    {
      id: "hellas-planitia",
      location: "Hellas Planitia",
      caption: "Deepest basin on Mars · low elevation target",
      image: {
        src: "/images/home/terrain/hellas-planitia.jpg",
        alt: "Layered deposits on the floor of the Hellas Planitia basin",
        width: 675,
        height: 900,
      },
    },
    {
      id: "jezero-crater",
      location: "Jezero Crater",
      caption: "Ancient river delta · clay-rich science target",
      image: {
        src: "/images/home/terrain/jezero-crater.jpg",
        alt: "Topographic map of Jezero Crater and the Nili Fossae region",
        width: 675,
        height: 900,
      },
    },
    {
      id: "gale-crater",
      location: "Gale Crater",
      caption: "Mount Sharp · layered sedimentary record",
      image: {
        src: "/images/home/terrain/gale-crater.jpg",
        alt: "The rim and floor of Gale Crater in a 3D perspective view",
        width: 675,
        height: 900,
      },
    },
    {
      id: "valles-marineris",
      location: "Valles Marineris",
      caption: "Canyon system · extreme relief and shadow",
      image: {
        src: "/images/home/terrain/valles-marineris.jpg",
        alt: "Canyon walls of Valles Marineris under a Martian sunset",
        width: 675,
        height: 900,
      },
    },
    {
      id: "olympus-mons",
      location: "Olympus Mons",
      caption: "Tallest volcano in the solar system",
      image: {
        src: "/images/home/terrain/olympus-mons.jpg",
        alt: "Shaded relief of Olympus Mons and its summit caldera",
        width: 675,
        height: 900,
      },
    },
  ] satisfies readonly TerrainSlide[],
} as const;

export const marsLandings = {
  image: {
    src: "/images/home/mars-landings.png",
    alt: "Mars landing sites map",
    width: 1440,
    height: 802,
  } satisfies ImageAsset,
} as const;

export const whyMartianMap = {
  eyebrow: "Built on mission data",
  title: "WHY MARTIAN MAP",
  description:
    "Four guarantees that make every planned route survivable and worth the journey.",
  cta: { label: "Open the Map", href: MAP_ROUTE },
  reasons: [
    {
      id: "safe-routes",
      title: "Safe Routes",
      description:
        "Slope, temperature and wind limits are checked along the whole path, not only at the destination.",
      icon: "safe",
    },
    {
      id: "science-targets",
      title: "Science Targets",
      description:
        "Rank routes by water, iron and silicon richness so crews reach the samples that matter most.",
      icon: "science",
    },
    {
      id: "vehicle-aware",
      title: "Vehicle-Aware",
      description:
        "Travel time and mission cost are computed from each rover’s own speed and terrain limits.",
      icon: "vehicle",
    },
    {
      id: "real-data",
      title: "Real Data",
      description:
        "Grounded in Mars Reconnaissance Orbiter imagery: HiRISE surface detail and CRISM mineral maps.",
      icon: "data",
    },
  ] satisfies readonly Reason[],
} as const;

export const footerBackground: ImageAsset = {
  src: "/images/home/mars-settlement.png",
  alt: "",
  width: 364,
  height: 544,
};

export const footerGroups: readonly FooterGroup[] = [
  {
    heading: "Mission",
    links: [
      { label: "Map", href: MAP_ROUTE },
      { label: "Action Plan", href: "/action-plan" },
      { label: "Documents", href: "/docs" },
    ],
  },
  {
    heading: "Data",
    links: [
      { label: "Elevation", href: MAP_ROUTE },
      { label: "Thermal", href: MAP_ROUTE },
      { label: "Wind", href: MAP_ROUTE },
      { label: "Minerals", href: MAP_ROUTE },
    ],
  },
  {
    heading: "Project",
    links: [
      { label: "About", href: "#mission" },
      { label: "NASA Space Apps", href: "https://www.spaceappschallenge.org/" },
      { label: "GitHub", href: "https://github.com/spaceappschallenge" },
    ],
  },
  {
    heading: "Contact",
    links: [
      { label: "Email", href: "#contact" },
      { label: "Support", href: "#contact" },
      { label: "Feedback", href: "#contact" },
      { label: "Community", href: "#contact" },
    ],
  },
];
