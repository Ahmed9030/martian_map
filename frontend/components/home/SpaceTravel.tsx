import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { travel } from "@/lib/constants/home";
import { cn } from "@/lib/utils";
import { ArrowIcon } from "./icons";
import { Reveal } from "./Reveal";
import { SectionTitle } from "./SectionTitle";

export function SpaceTravel() {
  return (
    <section
      id="travel"
      className="relative isolate scroll-mt-24 overflow-hidden bg-home-plum px-5 pb-[70px] pt-[58px] text-center max-sm:py-[46px]"
    >
      <Image
        src={travel.backdrop.src}
        alt={travel.backdrop.alt}
        fill
        sizes="100vw"
        aria-hidden="true"
        className="-z-20 object-cover opacity-[0.28]"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(23_24_47_/_83%),rgb(31_31_60_/_61%),rgb(23_24_47_/_83%))]" />

      <div className="mx-auto w-full max-w-[900px]">
        <Reveal>
          <SectionTitle className="text-[clamp(1.25rem,2.4vw,1.8rem)] uppercase tracking-[-0.02em]">
            {travel.title}
          </SectionTitle>
        </Reveal>

        <div className="mx-auto mt-7 grid h-[clamp(180px,48vw,260px)] grid-cols-1 items-center gap-3.5 md:h-[clamp(220px,30vw,330px)] md:grid-cols-3 md:gap-[clamp(12px,2vw,20px)]">
          {travel.views.map((view, index) => (
            <Reveal
              key={view.alt}
              delay={index * 100}
              className={cn(
                "group relative h-full overflow-hidden rounded-[18px] border border-white/15 bg-home-soft shadow-[0_16px_38px_rgb(5_7_28_/_36%)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[5px] hover:shadow-[0_22px_44px_rgb(5_7_28_/_48%)] md:h-[88%]",
                index === 1 && "z-[1] md:h-full",
              )}
            >
              <Image
                src={view.src}
                alt={view.alt}
                fill
                sizes="(max-width: 768px) 90vw, 300px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <p className="mx-auto mt-5 max-w-md text-xs leading-6 text-home-body">
            {travel.description}
          </p>
          <Button
            href={travel.cta.href}
            variant="accent"
            className="mt-5 min-h-[38px] gap-2 px-5 text-[10px]"
          >
            {travel.cta.label}
            <ArrowIcon />
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
