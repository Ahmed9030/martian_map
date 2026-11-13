import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { whyMartianMap } from "@/lib/constants/home";
import { ArrowIcon, OutlineIcon } from "./icons";
import { Reveal } from "./Reveal";
import { SectionTitle } from "./SectionTitle";

export function WhyMartianMap() {
  return (
    <section
      id="why"
      aria-labelledby="why-title"
      className="flex scroll-mt-24 flex-col items-center bg-[radial-gradient(ellipse_at_50%_0%,rgb(108_88_137_/_18%),transparent_50%),var(--home-bg-soft)] px-6 pb-[74px] pt-20 text-center"
    >
      <Reveal className="mx-auto max-w-[620px]">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-home-glow">
          {whyMartianMap.eyebrow}
        </p>
        <SectionTitle
          id="why-title"
          className="mt-3 text-[clamp(1.4rem,2.6vw,2.1rem)] uppercase tracking-normal"
        >
          {whyMartianMap.title}
        </SectionTitle>
        <p className="mx-auto mt-4 max-w-[520px] text-xs leading-6 text-home-muted">
          {whyMartianMap.description}
        </p>
      </Reveal>

      <ul className="mt-9 grid w-full max-w-[960px] grid-cols-1 gap-[9px] sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        {whyMartianMap.reasons.map((reason, index) => (
          <Reveal as="li" key={reason.id} delay={index * 90} className="h-full">
            <GlassCard className="h-full items-center gap-0 px-4 py-6 text-center">
              <OutlineIcon
                id={reason.icon}
                className="mx-auto size-[30px] text-home-gold"
              />
              <h3 className="mt-3 font-display text-xs font-semibold text-home-cream">
                {reason.title}
              </h3>
              <p className="mt-2 text-[10px] leading-[1.7] text-home-muted">
                {reason.description}
              </p>
            </GlassCard>
          </Reveal>
        ))}
      </ul>

      <Reveal delay={360}>
        <Button
          href={whyMartianMap.cta.href}
          variant="accent"
          className="mt-8 min-h-[38px] gap-2 px-5 text-[10px]"
        >
          {whyMartianMap.cta.label}
          <ArrowIcon />
        </Button>
      </Reveal>
    </section>
  );
}
