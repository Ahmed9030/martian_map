import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { mission } from "@/lib/constants/home";
import { ArrowIcon, OutlineIcon } from "./icons";
import { Reveal } from "./Reveal";
import { SectionTitle } from "./SectionTitle";

export function ImpactSection() {
  return (
    <section
      id="mission"
      aria-labelledby="mission-title"
      className="scroll-mt-24 bg-home-deep px-4 pb-11 sm:pb-[74px] md:px-8"
    >
      <div className="mx-auto max-w-[1600px] rounded-[24px] border border-white/[0.08] bg-[radial-gradient(ellipse_at_50%_0%,rgb(79_75_132_/_18%),transparent_48%),linear-gradient(140deg,var(--home-panel),var(--home-panel-alt)_65%,var(--home-panel-alt))] px-[clamp(18px,5vw,64px)] pb-[38px] pt-[clamp(32px,4vw,52px)] shadow-[0_20px_60px_rgb(6_7_28_/_18%)] max-sm:rounded-[22px] max-sm:px-4 max-sm:pb-[30px] max-sm:pt-[34px]">
        <Reveal className="mx-auto max-w-[720px] text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-home-glow">
            {mission.eyebrow}
          </p>
          <SectionTitle
            id="mission-title"
            className="mt-3 text-[clamp(1.4rem,2.4vw,2rem)] tracking-[0.015em] text-home-lavender"
          >
            {mission.title}
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[640px] text-xs leading-6 text-home-muted sm:text-sm sm:leading-7">
            {mission.description}
          </p>
        </Reveal>

        <ul className="mx-auto mt-9 grid max-w-[1080px] grid-cols-1 gap-3 md:grid-cols-3 md:gap-5 max-sm:gap-[11px]">
          {mission.steps.map((step, index) => (
            <Reveal as="li" key={step.id} delay={index * 110} className="h-full">
              <GlassCard className="h-full items-start gap-0 p-6 text-left max-sm:p-5">
                <div className="flex w-full items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-home-glow">
                    <OutlineIcon id={step.icon} />
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.16em] text-home-muted/80">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-sm font-semibold tracking-[-0.02em] text-home-cream sm:text-base">
                  {step.title}
                </h3>
                <p className="mt-2 text-[11px] leading-[1.75] text-home-muted sm:text-xs sm:leading-6">
                  {step.description}
                </p>
              </GlassCard>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-9 text-center" delay={120}>
          <Button
            href={mission.cta.href}
            variant="accent"
            className="min-h-[42px] gap-2 px-6 text-[11px]"
          >
            {mission.cta.label}
            <ArrowIcon />
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
