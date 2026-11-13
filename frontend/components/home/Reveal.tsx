"use client";

import { useEffect, useRef, type ReactNode } from "react";
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
};

/** Fades and lifts its children into view once they enter the viewport. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
