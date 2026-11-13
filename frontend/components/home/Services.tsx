import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { services, servicesIntro } from "@/lib/constants/home";
import { ArrowIcon } from "./icons";
import { Reveal } from "./Reveal";
import { SectionTitle } from "./SectionTitle";

export function Services() {
  return (
    <section
      id="services"
      aria-labelledby="services-title"
      className="scroll-mt-24 bg-home-deep px-4 pb-11 sm:pb-[74px] md:px-8"
    >
      <div className="mx-auto max-w-[1600px] rounded-[24px] border border-white/[0.08] bg-[radial-gradient(ellipse_at_50%_0%,rgb(79_75_132_/_18%),transparent_48%),linear-gradient(140deg,var(--home-panel),var(--home-panel-alt)_65%,var(--home-panel-alt))] px-[clamp(18px,5vw,64px)] pb-[38px] pt-[clamp(32px,4vw,52px)] shadow-[0_20px_60px_rgb(6_7_28_/_18%)] max-sm:rounded-[22px] max-sm:px-4 max-sm:pb-[30px] max-sm:pt-[34px]">
        <Reveal>
          <SectionTitle
            id="services-title"
            className="text-center text-[clamp(1.4rem,2.4vw,2rem)] tracking-[0.015em] text-home-lavender"
          >
            {servicesIntro.title}
          </SectionTitle>
        </Reveal>

        <div className="mx-auto mt-8 grid max-w-[1080px] grid-cols-1 gap-3 md:grid-cols-2 md:gap-5 lg:grid-cols-3 max-sm:gap-[11px]">
          {services.map((service, index) => (
            <Reveal key={service.title} delay={index * 120}>
              <a
                href="#discover"
                className="group grid overflow-hidden rounded-[18px] border border-white/10 bg-[linear-gradient(150deg,rgb(255_255_255_/_6%),rgb(255_255_255_/_2%))] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-[5px] hover:border-home-ember/40 hover:shadow-[0_16px_36px_rgb(3_5_24_/_25%)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-telemetry max-sm:grid-cols-[minmax(104px,0.78fr)_minmax(0,1fr)] max-sm:items-center max-sm:rounded-[15px] lg:block"
              >
                <div className="relative aspect-[0.82] overflow-hidden bg-home-card max-sm:aspect-auto max-sm:h-full max-sm:min-h-[124px] max-sm:self-stretch">
                  <Image
                    src={service.image.src}
                    alt={service.image.alt}
                    fill
                    sizes="(max-width: 640px) 40vw, (max-width: 1024px) 45vw, 360px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(15_14_29_/_35%),transparent_32%,transparent_52%,rgb(15_14_29_/_55%))]" />

                  <span className="absolute left-3.5 top-3.5 z-[1] flex items-center gap-2.5 text-[9px] tracking-[0.12em] text-home-cream max-sm:left-[9px] max-sm:top-[9px] max-sm:gap-0">
                    <span className="grid size-8 place-items-center rounded-full border border-white/40 bg-[rgb(20_20_42_/_42%)] backdrop-blur-sm max-sm:size-7 max-sm:text-[8px]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="rounded-full bg-[rgb(20_20_42_/_48%)] px-[11px] py-2 backdrop-blur-sm max-sm:hidden">
                      {service.category}
                    </span>
                  </span>

                  <span className="absolute bottom-3.5 right-3.5 z-[1] grid size-[38px] place-items-center rounded-full border border-white/40 bg-[rgb(20_20_42_/_30%)] text-white backdrop-blur-sm transition-[transform,background-color,color] duration-200 group-hover:-rotate-45 group-hover:bg-home-ember group-hover:text-home-ink max-sm:bottom-2 max-sm:right-2 max-sm:size-[30px]">
                    <ArrowIcon />
                  </span>
                </div>

                <div className="px-[17px] pb-[18px] pt-4 text-left max-sm:px-[13px] max-sm:py-4">
                  <h3 className="font-display text-[clamp(13px,1.3vw,16px)] font-semibold tracking-[-0.035em] text-home-cream max-sm:text-xs">
                    {service.title}
                  </h3>
                  <p className="mt-1.5 text-[11px] leading-[1.65] text-home-muted max-sm:text-[10px]">
                    {service.description}
                  </p>
                </div>
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal className="mx-auto mt-[38px] text-center" delay={120}>
          <h3 className="mt-3 font-display text-[clamp(15px,2vw,19px)] font-semibold tracking-[0.015em] text-home-lavender">
            {servicesIntro.heading}
          </h3>
          <p className="mx-auto mt-3 max-w-[540px] text-xs leading-6 text-home-muted">
            {servicesIntro.description}
          </p>
          <Button
            href={servicesIntro.cta.href}
            variant="accent"
            className="mt-5 min-h-[38px] gap-2 px-5 text-[10px]"
          >
            {servicesIntro.cta.label}
            <ArrowIcon />
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
