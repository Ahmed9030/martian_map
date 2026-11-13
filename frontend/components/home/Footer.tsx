import Image from "next/image";
import { footerBackground, footerGroups } from "@/lib/constants/home";

export function Footer() {
  return (
    <footer className="relative isolate overflow-hidden bg-home-plum px-[clamp(24px,8vw,110px)] pb-5 pt-[52px]">
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
        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-x-7 gap-y-[26px] sm:grid-cols-4 sm:gap-y-7"
        >
          {footerGroups.map((group) => (
            <div key={group.heading}>
              <h2 className="mb-[15px] text-[10px] font-semibold tracking-[0.08em] text-home-cream">
                {group.heading}
              </h2>
              {group.links.map((link) => (
                <a
                  key={link}
                  href="#home"
                  className="mt-2.5 block w-fit text-[9px] text-home-body transition-colors duration-200 hover:text-home-glow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-telemetry"
                >
                  {link}
                </a>
              ))}
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
