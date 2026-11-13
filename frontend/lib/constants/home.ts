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

export type Service = {
  title: string;
  category: string;
  description: string;
  image: ImageAsset;
};

export type BenefitId = "cheap" | "health" | "secure" | "quick";

export type Benefit = {
  id: BenefitId;
  title: string;
  description: string;
};

export type FooterGroup = {
  heading: string;
  links: string[];
};

export const hero = {
  eyebrow: "PLANET",
  title: "MARS",
  subtitle: "BECOME A MARTIAN",
  description:
    "Embark on an extraordinary journey to Mars and unlock the secrets of the Red Planet’s captivating landscapes and ancient mysteries",
  primaryCta: { label: "Explore Mars", href: "#services" },
  secondaryCta: { label: "WATCH VIDEOS", href: "#travel" },
  caption: {
    label: "The red planet",
    text: "A world of ancient valleys, endless skies, and new beginnings.",
  },
} as const satisfies {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  primaryCta: Cta;
  secondaryCta: Cta;
  caption: { label: string; text: string };
};

export const servicesIntro = {
  title: "Our Services",
  heading: "We are reliable Travel Agency",
  description:
    "Our team of experienced professionals is dedicated to providing you with a safe and unforgettable Mars exploration experience",
  cta: { label: "EXPLORE MORE", href: "#reliability" },
} as const;

export const services: readonly Service[] = [
  {
    title: "Desert City",
    category: "A NEW HOME",
    description: "Imagine what life could look like beyond Earth.",
    image: {
      src: "/images/home/mars-settlement.png",
      alt: "An artist’s concept of a future settlement on the surface of Mars",
      width: 364,
      height: 544,
    },
  },
  {
    title: "Exploration",
    category: "DISCOVERY",
    description: "See the red planet through an explorer’s eyes.",
    image: {
      src: "/images/home/mars-exploration.png",
      alt: "An astronaut exploring the surface of Mars",
      width: 360,
      height: 544,
    },
  },
  {
    title: "Travel",
    category: "THE JOURNEY",
    description: "A new route to the red planet starts here.",
    image: {
      src: "/images/home/mars-rocket.png",
      alt: "A rocket ready for departure to Mars",
      width: 357,
      height: 544,
    },
  },
];

export const marsFeature = {
  eyebrow: "Field notes · 01",
  title: "Get to know",
  titleAccent: "Mars",
  description:
    "From ancient rivers to rugged red valleys, discover what makes Mars our next great frontier.",
  cta: { label: "Continue the journey", href: "#travel" },
  image: {
    src: "/images/home/mars-feature.png",
    alt: "A Mars rover beneath the red planet, with an overview of its surface",
    width: 1152,
    height: 1490,
  },
} as const;

export const travel = {
  title: "DISCOVER THE THRILL OF SPACE TRAVEL",
  description:
    "Panoramic Views: Enjoy breathtaking views of the cosmos through large, specially designed windows, offering a glimpse into the wonders of space.",
  cta: { label: "EXPLORE MORE", href: "#landing" },
  backdrop: {
    src: "/images/home/iss-cupola.jpg",
    alt: "",
    width: 1280,
    height: 850,
  },
  views: [
    {
      src: "/images/home/mars-rocket.png",
      alt: "A rocket prepared for a journey to Mars",
      width: 357,
      height: 544,
    },
    {
      src: "/images/home/iss-cupola.jpg",
      alt: "Earth seen through the cupola windows of the International Space Station",
      width: 1280,
      height: 850,
    },
    {
      src: "/images/home/mars-settlement.png",
      alt: "An artist’s concept of life in a future Mars settlement",
      width: 364,
      height: 544,
    },
  ],
} as const satisfies {
  title: string;
  description: string;
  cta: Cta;
  backdrop: ImageAsset;
  views: readonly ImageAsset[];
};

export const marsLandings = {
  image: {
    src: "/images/home/mars-landings.png",
    alt: "Mars landing sites map",
    width: 1440,
    height: 802,
  },
} as const satisfies { image: ImageAsset };

export const reliability = {
  eyebrow: "Every step of the way",
  title: "HOW RELIABLE WE ARE",
  cta: { label: "LEARN MORE", href: "#home" },
  benefits: [
    {
      id: "cheap",
      title: "Cheap",
      description:
        "Experience the wonders of Mars with our affordable tickets, ensuring a seamless and hassle-free journey of a lifetime",
    },
    {
      id: "health",
      title: "Health",
      description:
        "Rest assured with our round-the-clock medical facility onboard, providing continuous care and dedicated quarantine chambers for your well-being",
    },
    {
      id: "secure",
      title: "Secure",
      description:
        "Uncompromising safety measures for astronauts on their Mars journey, ensuring a secure mission",
    },
    {
      id: "quick",
      title: "Quick",
      description:
        "Effortlessly embark on your Mars adventure with our expedited preparations, eliminating long wait times",
    },
  ],
} as const satisfies {
  eyebrow: string;
  title: string;
  cta: Cta;
  benefits: readonly Benefit[];
};

export const footerBackground: ImageAsset = {
  src: "/images/home/mars-settlement.png",
  alt: "",
  width: 364,
  height: 544,
};

export const footerGroups: readonly FooterGroup[] = [
  {
    heading: "Flight",
    links: ["Departure", "Arrival", "Duration", "Spaceship", "Schedule"],
  },
  {
    heading: "Company",
    links: ["About us", "Consultation", "Mission statement", "Safety standards"],
  },
  {
    heading: "Apointments",
    links: ["Schedule", "Explore", "Accommodation", "Customize", "Book"],
  },
  {
    heading: "Contact us",
    links: ["Call us", "Email", "Address", "Social", "Enquiry"],
  },
];
