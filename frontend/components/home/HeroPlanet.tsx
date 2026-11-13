"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/Button";
import { hero } from "@/lib/constants/home";
import { ArrowIcon } from "./icons";

/** One full rotation of the planet, in seconds. Slow enough to read as a calm spin. */
const PLANET_ROTATION_SECONDS = 120;
/** Vertical drift of the planet wrapper, in pixels. */
const FLOAT_DISTANCE_PX = 10;

export function HeroPlanet() {
  const sectionRef = useRef<HTMLElement>(null);
  const planetRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const planet = planetRef.current;
    const float = floatRef.current;
    if (!section || !planet || !float) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      gsap.from("[data-hero-reveal]", {
        autoAlpha: 0,
        y: 18,
        duration: 0.85,
        ease: "power3.out",
        stagger: 0.08,
      });
      gsap.to(planet, {
        rotation: 360,
        duration: PLANET_ROTATION_SECONDS,
        ease: "none",
        repeat: -1,
        transformOrigin: "50% 50%",
      });
      gsap.to(float, {
        y: FLOAT_DISTANCE_PX,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, section);

    return () => context.revert();
  }, []);

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative isolate flex min-h-[max(640px,min(100svh,940px))] scroll-mt-24 items-center overflow-hidden bg-home max-md:min-h-[600px]"
    >
      <div className="hero-sky absolute inset-0 -z-20" aria-hidden="true" />
      <div className="hero-stars absolute inset-0 -z-10" aria-hidden="true" />

      <div
        ref={floatRef}
        className="pointer-events-none absolute inset-y-0 right-0 -z-10 flex w-full items-center justify-center md:w-[60%] md:justify-end"
      >
        <div className="relative aspect-square w-[min(94vw,560px)] translate-x-[14%] max-md:translate-x-0 max-md:opacity-50 md:w-[min(56vw,660px)] xl:w-[min(50vw,720px)]">
          <div
            className="absolute inset-[8%] rounded-full bg-home-glow opacity-25 blur-[80px]"
            aria-hidden="true"
          />
          <div ref={planetRef} className="absolute inset-0">
            <Image
              src={hero.planet.src}
              alt={hero.planet.alt}
              width={hero.planet.width}
              height={hero.planet.height}
              priority
              unoptimized
              sizes="(max-width: 768px) 94vw, (max-width: 1280px) 56vw, 720px"
              className="size-full object-contain"
            />
          </div>
          <div
            className="absolute inset-0 rounded-full shadow-[inset_-48px_-12px_96px_12px_rgb(17_16_40_/_42%)]"
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="relative z-[1] mx-auto flex w-full max-w-[1280px] px-6 py-32 md:px-12 md:py-40">
        <div className="max-w-[590px] xl:pt-5">
          <p
            data-hero-reveal
            className="mb-3 text-xs font-medium uppercase tracking-[0.42em] text-home-sand"
          >
            {hero.eyebrow}
          </p>
          <h1
            data-hero-reveal
            className="font-display text-[clamp(4.5rem,10vw,8rem)] font-extrabold leading-[0.98] tracking-[0.22em] text-home-cream"
          >
            {hero.title}
          </h1>
          <p
            data-hero-reveal
            className="mt-6 text-xs uppercase tracking-[0.42em] text-home-glow"
          >
            {hero.subtitle}
          </p>
          <p
            data-hero-reveal
            className="mt-5 max-w-[460px] text-sm leading-7 text-home-body md:text-base"
          >
            {hero.description}
          </p>
          <div data-hero-reveal className="mt-8 flex flex-wrap gap-3">
            <Button
              href={hero.primaryCta.href}
              variant="accent"
              className="min-h-12 gap-3 px-5 py-3 text-xs"
            >
              {hero.primaryCta.label}
              <ArrowIcon />
            </Button>
            <Button
              href={hero.secondaryCta.href}
              variant="quiet"
              className="min-h-12 px-5 py-3 text-xs"
            >
              {hero.secondaryCta.label}
            </Button>
          </div>
        </div>
      </div>

    </section>
  );
}
