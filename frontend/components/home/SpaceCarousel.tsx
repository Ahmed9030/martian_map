"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { Button } from "@/components/ui/Button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { terrain } from "@/lib/constants/home";
import { cn } from "@/lib/utils";
import { ArrowIcon, ChevronIcon } from "./icons";
import { SectionTitle } from "./SectionTitle";

/** Time each slide stays in place before the carousel advances. */
const AUTOPLAY_INTERVAL_MS = 4000;
/** Horizontal distance between the centre card and its neighbours, in card widths. */
const SIDE_CARD_OFFSET_PERCENT = 58;
const MAX_VISIBLE_OFFSET = 1;
const HIDDEN_CARD_SCALE = 0.72;
const SIDE_CARD_SCALE = 0.85;
const SIDE_CARD_OPACITY = 0.55;
const SINGLE_CARD_QUERY = "(max-width: 767px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const slides = terrain.slides;

/** Wraps an index to the range `[-total / 2, total / 2]` around the active slide. */
function relativeOffset(index: number, activeIndex: number, total: number) {
  const raw = (index - activeIndex + total) % total;
  return raw > total / 2 ? raw - total : raw;
}

function cardStyle(offset: number, isSingle: boolean): CSSProperties {
  const clamped = Math.max(
    -MAX_VISIBLE_OFFSET - 1,
    Math.min(MAX_VISIBLE_OFFSET + 1, offset),
  );
  const isVisible =
    Math.abs(clamped) <= MAX_VISIBLE_OFFSET && !(isSingle && clamped !== 0);

  return {
    transform: `translate(-50%, -50%) translateX(${clamped * SIDE_CARD_OFFSET_PERCENT}%) scale(${
      !isVisible
        ? HIDDEN_CARD_SCALE
        : clamped === 0
          ? 1
          : SIDE_CARD_SCALE
    })`,
    opacity: isVisible ? (clamped === 0 ? 1 : SIDE_CARD_OPACITY) : 0,
    zIndex: 30 - Math.abs(clamped) * 10,
    pointerEvents: isVisible && clamped === 0 ? "auto" : "none",
  };
}

export function SpaceCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const isSingle = useMediaQuery(SINGLE_CARD_QUERY);
  const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const regionId = useId();
  const total = slides.length;

  const goTo = useCallback(
    (step: number) => {
      setActiveIndex((current) => (current + step + total) % total);
    },
    [total],
  );

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;
    const timer = window.setInterval(
      () => setActiveIndex((current) => (current + 1) % total),
      AUTOPLAY_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [isPaused, prefersReducedMotion, total]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(1);
    }
  };

  const activeSlide = slides[activeIndex];

  return (
    <section
      id="terrain"
      aria-labelledby="terrain-title"
      className="relative isolate scroll-mt-24 overflow-hidden bg-home-plum px-5 pb-[70px] pt-[58px] text-center max-sm:py-[46px]"
    >
      <Image
        src={terrain.backdrop.src}
        alt={terrain.backdrop.alt}
        fill
        sizes="100vw"
        unoptimized
        aria-hidden="true"
        className="-z-20 object-cover opacity-[0.22]"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(23_24_47_/_86%),rgb(31_31_60_/_68%),rgb(23_24_47_/_86%))]" />

      <div className="mx-auto w-full max-w-[1100px]">
        <SectionTitle
          id="terrain-title"
          className="mx-auto max-w-[720px] text-[clamp(1.25rem,2.4vw,1.8rem)] uppercase tracking-[-0.02em]"
        >
          {terrain.title}
        </SectionTitle>
        <p className="mx-auto mt-4 max-w-[560px] text-xs leading-6 text-home-body">
          {terrain.description}
        </p>

        <div
          role="region"
          aria-roledescription="carousel"
          aria-labelledby={`${regionId}-label`}
          tabIndex={0}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
          onKeyDown={handleKeyDown}
          className="relative mx-auto mt-9 w-full max-w-[980px] rounded-[24px] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-telemetry"
        >
          <h3 id={`${regionId}-label`} className="sr-only">
            Martian terrain highlights
          </h3>
          <ul className="relative h-[clamp(320px,46vw,500px)] w-full">
            {slides.map((slide, index) => {
              const offset = relativeOffset(index, activeIndex, total);
              const isActive = offset === 0;
              return (
                <li
                  key={slide.id}
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${total}: ${slide.location}`}
                  aria-hidden={!isActive}
                  style={cardStyle(offset, isSingle)}
                  className="absolute left-1/2 top-1/2 h-[clamp(290px,40vw,450px)] w-[clamp(220px,28vw,340px)] transition-[transform,opacity] duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                >
                  <figure className="relative size-full overflow-hidden rounded-[22px] border border-white/15 bg-home-soft shadow-[0_26px_60px_rgb(3_5_24_/_48%)]">
                    <Image
                      src={slide.image.src}
                      alt={slide.image.alt}
                      fill
                      sizes="(max-width: 768px) 86vw, 340px"
                      unoptimized
                      className="object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(15_14_29_/_10%),transparent_26%,rgb(11_12_30_/_78%)_56%,rgb(11_12_30_/_97%))]" />
                    <figcaption
                      className={cn(
                        "absolute inset-x-0 bottom-0 p-5 text-left transition-opacity duration-500",
                        isActive ? "opacity-100" : "opacity-0",
                      )}
                    >
                      <span className="block text-[9px] uppercase tracking-[0.2em] text-home-glow">
                        {slide.location}
                      </span>
                      <span className="mt-1.5 block text-xs leading-5 text-home-cream">
                        {slide.caption}
                      </span>
                    </figcaption>
                  </figure>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => goTo(-1)}
            aria-label="Previous terrain image"
            className="absolute left-0 top-1/2 z-40 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-white/5 text-home-cream backdrop-blur-md transition hover:border-mars/50 hover:bg-mars/20 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-telemetry sm:-left-2"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={() => goTo(1)}
            aria-label="Next terrain image"
            className="absolute right-0 top-1/2 z-40 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-white/5 text-home-cream backdrop-blur-md transition hover:border-mars/50 hover:bg-mars/20 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-telemetry sm:-right-2"
          >
            <ChevronIcon direction="right" />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          {slides.map((slide, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show ${slide.location}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-telemetry",
                  isActive
                    ? "w-6 bg-home-coral"
                    : "w-1.5 bg-white/30 hover:bg-white/60",
                )}
              />
            );
          })}
        </div>
        <p className="sr-only" aria-live="polite">
          {activeSlide.location}
        </p>

        <Button
          href={terrain.cta.href}
          variant="accent"
          className="mt-7 min-h-[38px] gap-2 px-5 text-[10px]"
        >
          {terrain.cta.label}
          <ArrowIcon />
        </Button>
      </div>
    </section>
  );
}
