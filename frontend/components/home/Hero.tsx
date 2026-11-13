"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/Button";
import { hero } from "@/lib/constants/home";
import { ArrowIcon } from "./icons";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      gsap.from("[data-hero-reveal]", {
        autoAlpha: 0,
        y: 18,
        duration: 0.85,
        ease: "power3.out",
        stagger: 0.08,
      });

      gsap.to(".planet-texture", {
        xPercent: -50,
        duration: 14,
        repeat: -1,
        ease: "none",
      });

      gsap.fromTo(
        ".planet-aura",
        { opacity: 0.68, scale: 0.97 },
        {
          opacity: 1,
          scale: 1.04,
          duration: 7,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        },
      );
    }, section);

    return () => context.revert();
  }, []);

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative isolate min-h-[max(620px,min(100svh,900px))] scroll-mt-24 overflow-hidden bg-home max-md:min-h-[520px]"
    >
      <div className="hero-sky absolute inset-0 -z-20" aria-hidden="true" />
      <div className="hero-stars absolute inset-0 -z-10" aria-hidden="true" />

      <div
        role="img"
        aria-label="A rotating planet Mars"
        className="pointer-events-none absolute top-1/2 -right-[5vw] -z-10 aspect-square w-[min(63vw,770px)] -translate-y-[42%] max-md:top-[42%] max-md:-right-[37vw] max-md:w-[min(94vw,560px)] max-md:opacity-[0.88]"
      >
        <div className="planet-aura absolute -inset-[15%] rounded-full bg-[radial-gradient(circle,rgb(242_117_74_/_31%),transparent_64%)] blur-[26px]" />
        <div className="planet-body absolute inset-[3%] overflow-hidden rounded-full">
          <div className="planet-texture absolute inset-y-0 left-0 w-[200%]" />
          <div className="planet-highlight absolute inset-0 rounded-[inherit]" />
        </div>
        <div className="absolute inset-[3%] rounded-full shadow-[inset_-26px_-2px_48px_6px_rgb(21_16_35_/_68%)]" />
      </div>

      <div className="relative z-[1] mx-auto flex max-w-[1280px] px-6 pt-32 md:px-12 md:pt-40">
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
            className="mt-5 max-w-[430px] text-sm leading-7 text-home-body md:text-base"
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

      <div className="absolute bottom-28 right-[8%] z-[1] hidden max-w-48 text-xs leading-5 text-home-body lg:block">
        <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-home-glow">
          {hero.caption.label}
        </span>
        {hero.caption.text}
      </div>
    </section>
  );
}
