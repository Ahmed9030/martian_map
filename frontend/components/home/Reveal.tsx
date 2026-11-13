"use client";

import { useEffect, useRef, type ReactNode, type Ref } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

let isScrollTriggerRegistered = false;

function registerScrollTrigger() {
  if (isScrollTriggerRegistered) return;
  gsap.registerPlugin(ScrollTrigger);
  isScrollTriggerRegistered = true;
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  /** Rendered element, defaults to a `div`. Use `li` inside lists. */
  as?: "div" | "li" | "article" | "section";
};

/** Fades and lifts its children into view once they enter the viewport. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    registerScrollTrigger();

    const context = gsap.context(() => {
      gsap.fromTo(
        element,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          delay: delay / 1000,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 85%",
            once: true,
          },
        },
      );
    }, element);

    return () => context.revert();
  }, [delay, y]);

  const classes = cn(className);

  if (Tag === "li") {
    return (
      <li ref={ref as Ref<HTMLLIElement>} className={classes}>
        {children}
      </li>
    );
  }

  if (Tag === "article") {
    return (
      <article ref={ref as Ref<HTMLElement>} className={classes}>
        {children}
      </article>
    );
  }

  if (Tag === "section") {
    return (
      <section ref={ref as Ref<HTMLElement>} className={classes}>
        {children}
      </section>
    );
  }

  return (
    <div ref={ref as Ref<HTMLDivElement>} className={classes}>
      {children}
    </div>
  );
}
