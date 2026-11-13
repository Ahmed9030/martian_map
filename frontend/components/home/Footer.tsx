import Image from "next/image";
import Link from "next/link";
import {
  footerBackground,
  footerGroups,
  type FooterLink,
} from "@/lib/constants/home";

const linkClassName =
  "mt-2.5 block w-fit text-[10px] text-home-body transition-colors duration-200 hover:text-home-glow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-telemetry";

function FooterAnchor({ link }: { link: FooterLink }) {
  if (link.href.startsWith("http")) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        {link.label}
      </a>
    );
  }

  if (link.href.startsWith("/")) {
    return (
      <Link href={link.href} className={linkClassName}>
        {link.label}
      </Link>
    );
  }

  return (
    <a href={link.href} className={linkClassName}>
      {link.label}
    </a>
  );
}

export function Footer() {
  return (
    <footer
      id="contact"
      className="relative isolate scroll-mt-24 overflow-hidden bg-home-plum px-[clamp(24px,8vw,110px)] pb-5 pt-[52px]"
    >
      <Image
        src={footerBackground.src}
        alt={footerBackground.alt}
        fill
        sizes="100vw"
        aria-hidden="true"
        className="-z-20 object-cover object-[center_54%]"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(26_21_37_/_88%),rgb(34_22_37_/_76%),rgb(27_23_43_/_88%))]" />
      <div className="mx-auto w-full max-w-[1000px]">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-home-glow">
              Martian Map
            </p>
            <p className="mt-2 max-w-[380px] text-[11px] leading-5 text-home-body">
              Route planning for the next generation of Martian explorers.
            </p>
          </div>
          <Link
            href="/map"
            className="w-fit rounded-full border border-white/25 bg-white/5 px-5 py-2.5 text-[10px] uppercase tracking-[0.14em] text-home-cream transition-colors duration-200 hover:border-home-ember/70 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-telemetry"
          >
            Plan Your Mission
          </Link>
        </div>

        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-x-7 gap-y-[26px] sm:grid-cols-4 sm:gap-y-7"
        >
          {footerGroups.map((group) => (
            <div key={group.heading}>
              <h2 className="mb-[15px] text-[10px] font-semibold tracking-[0.08em] text-home-cream">
                {group.heading}
              </h2>
              <ul>
                {group.links.map((link) => (
                  <li key={link.label}>
                    <FooterAnchor link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-9 flex flex-col gap-3.5 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-[10px] font-semibold tracking-[0.2em] text-home-cream">
            NASA SPACE APPS
          </span>
          <span className="text-[9px] text-home-muted">
            © Martian Map. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
