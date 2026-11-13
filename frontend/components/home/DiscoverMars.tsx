import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { marsFeature } from "@/lib/constants/home";
import { ArrowIcon } from "./icons";
import { Reveal } from "./Reveal";
import { SectionTitle } from "./SectionTitle";

export function DiscoverMars() {
  return (
    <section
      id="discover"
      className="relative isolate scroll-mt-24 overflow-hidden bg-[radial-gradient(ellipse_at_78%_45%,rgb(93_78_145_/_21%),transparent_48%),radial-gradient(ellipse_at_12%_100%,rgb(183_88_61_/_12%),transparent_42%),var(--home-bg-deep)] px-[clamp(24px,8vw,120px)] py-[clamp(56px,8vw,104px)] max-sm:py-[54px]"
    >
      <div className="mx-auto grid w-full max-w-[1120px] items-center gap-[clamp(36px,7vw,96px)] md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
        <Reveal className="mx-auto max-w-[520px] text-center md:mx-0 md:max-w-[430px] md:text-left">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-home-glow">
            {marsFeature.eyebrow}
          </p>
          <SectionTitle className="mt-4 text-[clamp(2.2rem,4.5vw,4rem)] leading-[1.18]">
            {marsFeature.title}{" "}
            <span className="text-home-ember">{marsFeature.titleAccent}</span>
          </SectionTitle>
          <p className="mt-5 text-sm leading-[1.9] text-home-muted max-sm:text-xs">
            {marsFeature.description}
          </p>
          <Button
            href={marsFeature.cta.href}
            variant="quiet"
            className="mt-7 min-h-12 gap-3 px-5 text-xs max-sm:mt-[22px]"
          >
            {marsFeature.cta.label}
            <ArrowIcon />
          </Button>
        </Reveal>

        <Reveal
          delay={120}
          className="w-full justify-self-end max-md:justify-self-center"
        >
          <div className="mx-auto w-full max-w-[440px] rounded-[22px] border border-white/15 bg-[linear-gradient(145deg,rgb(255_255_255_/_8%),rgb(255_255_255_/_2%))] p-[9px] shadow-[0_28px_80px_rgb(2_7_27_/_42%)]">
            <Image
              src={marsFeature.image.src}
              alt={marsFeature.image.alt}
              width={marsFeature.image.width}
              height={marsFeature.image.height}
              sizes="(max-width: 768px) 90vw, 440px"
              className="block h-auto w-full rounded-[15px]"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
