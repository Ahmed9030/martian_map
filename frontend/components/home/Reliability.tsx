import { Button } from "@/components/ui/Button";
import { reliability } from "@/lib/constants/home";
import { ArrowIcon, BenefitIcon } from "./icons";
import { Reveal } from "./Reveal";
import { SectionTitle } from "./SectionTitle";

export function Reliability() {
  return (
    <section
      id="reliability"
      className="flex scroll-mt-24 flex-col items-center bg-[radial-gradient(ellipse_at_50%_0%,rgb(108_88_137_/_18%),transparent_50%),var(--home-bg-soft)] px-6 pb-[74px] pt-20 text-center"
    >
      <Reveal>
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-home-glow">
          {reliability.eyebrow}
        </p>
        <SectionTitle className="mt-3 text-[clamp(1.4rem,2.6vw,2.1rem)] uppercase tracking-normal">
          {reliability.title}
        </SectionTitle>
      </Reveal>

      <div className="mt-8 grid w-full max-w-[900px] grid-cols-2 gap-[9px] sm:grid-cols-4 sm:gap-3">
        {reliability.benefits.map((benefit, index) => (
          <Reveal key={benefit.id} delay={index * 90} className="h-full">
            <article className="h-full min-h-[150px] rounded-[18px] border border-white/5 bg-[linear-gradient(145deg,var(--home-card),var(--home-card-deep))] px-3.5 py-5 shadow-[0_10px_24px_rgb(3_5_24_/_15%)] sm:min-h-[170px]">
              <BenefitIcon
                id={benefit.id}
                className="mx-auto mb-3 text-home-gold"
              />
              <h3 className="font-display text-xs font-semibold text-home-cream">
                {benefit.title}
              </h3>
              <p className="mt-2 text-[9px] leading-[1.7] text-home-muted">
                {benefit.description}
              </p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={360}>
        <Button
          href={reliability.cta.href}
          variant="accent"
          className="mt-8 min-h-[38px] gap-2 px-5 text-[10px]"
        >
          {reliability.cta.label}
          <ArrowIcon />
        </Button>
      </Reveal>
    </section>
  );
}
