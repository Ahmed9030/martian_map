'use client';

import { useEffect, useRef, useState } from 'react';
import { useOnboarding } from './OnboardingProvider';
import { TourTooltip } from './TourTooltip';
import { getStepTargetElement } from './tourTargets';

export interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Breathing room between the element and the cutout edge. */
const SPOTLIGHT_PADDING = 8;
/** Keep the cutout inside the viewport. */
const VIEWPORT_MARGIN = 12;
/**
 * Targets this close to full-screen (the map canvas) would make the spotlight
 * invisible: every dimming panel collapses to zero. Spotlight a centered
 * region of them instead so the tour still reads as "this area".
 */
const OVERSIZED_RATIO = 0.82;
const OVERSIZED_WIDTH_RATIO = 0.62;
const OVERSIZED_HEIGHT_RATIO = 0.5;

function sameRect(a: SpotlightRect | null, b: SpotlightRect): boolean {
  if (!a) return false;
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

/**
 * Dims everything except the current target, blocks interaction with the rest
 * of the page and hosts the tooltip. Positions are measured every frame so the
 * cutout follows sliding panels, scrolling and resizes.
 */
export function TourOverlay() {
  const { step, next, back, skip } = useOnboarding();
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const rectRef = useRef<SpotlightRect | null>(null);

  // ── Track the target's position ─────────────────────────────────────────
  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = requestAnimationFrame(measure);
      if (!step) return;

      const element = getStepTargetElement(step);
      if (!element) {
        if (rectRef.current) {
          rectRef.current = null;
          setRect(null);
        }
        return;
      }

      const bounds = element.getBoundingClientRect();
      const top = Math.max(VIEWPORT_MARGIN, bounds.top - SPOTLIGHT_PADDING);
      const left = Math.max(VIEWPORT_MARGIN, bounds.left - SPOTLIGHT_PADDING);
      const right = Math.min(
        window.innerWidth - VIEWPORT_MARGIN,
        bounds.right + SPOTLIGHT_PADDING,
      );
      const bottom = Math.min(
        window.innerHeight - VIEWPORT_MARGIN,
        bounds.bottom + SPOTLIGHT_PADDING,
      );
      const measured: SpotlightRect = {
        top,
        left,
        width: Math.max(0, right - left),
        height: Math.max(0, bottom - top),
      };

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const oversized =
        measured.width >= viewportWidth * OVERSIZED_RATIO &&
        measured.height >= viewportHeight * OVERSIZED_RATIO;
      const nextRect: SpotlightRect = oversized
        ? {
            width: Math.round(viewportWidth * OVERSIZED_WIDTH_RATIO),
            height: Math.round(viewportHeight * OVERSIZED_HEIGHT_RATIO),
            left: Math.round((viewportWidth - viewportWidth * OVERSIZED_WIDTH_RATIO) / 2),
            top: Math.round((viewportHeight - viewportHeight * OVERSIZED_HEIGHT_RATIO) / 2),
          }
        : measured;

      if (!sameRect(rectRef.current, nextRect)) {
        rectRef.current = nextRect;
        setRect(nextRect);
      }
    };

    measure();
    return () => cancelAnimationFrame(frame);
  }, [step]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        skip();
        return;
      }

      const target = event.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (event.key === 'ArrowRight' && !typing) {
        event.preventDefault();
        next();
      } else if (event.key === 'ArrowLeft' && !typing) {
        event.preventDefault();
        back();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [next, back, skip]);

  if (!step) return null;

  const cutout = rect;
  const transition =
    'transition-[top,left,right,bottom,width,height] duration-300 ease-out motion-reduce:transition-none';

  return (
    <div className="pointer-events-none fixed inset-0 z-[10000]" data-tour-overlay="">
      {cutout ? (
        <>
          {/* Four dimming panels leave the target bright and interactive. */}
          <div
            aria-hidden="true"
            className={`pointer-events-auto absolute bg-black/65 backdrop-blur-[2px] ${transition}`}
            style={{ top: 0, left: 0, right: 0, height: cutout.top }}
          />
          <div
            aria-hidden="true"
            className={`pointer-events-auto absolute bg-black/65 backdrop-blur-[2px] ${transition}`}
            style={{ top: cutout.top + cutout.height, left: 0, right: 0, bottom: 0 }}
          />
          <div
            aria-hidden="true"
            className={`pointer-events-auto absolute bg-black/65 backdrop-blur-[2px] ${transition}`}
            style={{ top: cutout.top, height: cutout.height, left: 0, width: cutout.left }}
          />
          <div
            aria-hidden="true"
            className={`pointer-events-auto absolute bg-black/65 backdrop-blur-[2px] ${transition}`}
            style={{
              top: cutout.top,
              height: cutout.height,
              left: cutout.left + cutout.width,
              right: 0,
            }}
          />

          {/* Blocks clicks inside the cutout for non-interactive steps. */}
          {!step.interactive ? (
            <div
              aria-hidden="true"
              className={`pointer-events-auto absolute ${transition}`}
              style={{
                top: cutout.top,
                left: cutout.left,
                width: cutout.width,
                height: cutout.height,
              }}
            />
          ) : null}

          {/* Spotlight border + glow. */}
          <div
            aria-hidden="true"
            className={`absolute rounded-2xl border border-mars/80 shadow-[0_0_0_1px_rgba(103,216,242,0.35),0_0_28px_rgba(232,116,59,0.45)] ${transition}`}
            style={{
              top: cutout.top,
              left: cutout.left,
              width: cutout.width,
              height: cutout.height,
            }}
          />

          {/* Pulse ring on the key element. */}
          <div
            aria-hidden="true"
            className={`tour-pulse-ring absolute rounded-2xl border-2 border-mars/70 ${transition}`}
            style={{
              top: cutout.top,
              left: cutout.left,
              width: cutout.width,
              height: cutout.height,
            }}
          />
        </>
      ) : (
        <div aria-hidden="true" className="pointer-events-auto absolute inset-0 bg-black/65 backdrop-blur-[2px]" />
      )}

      <TourTooltip rect={cutout} />
    </div>
  );
}
