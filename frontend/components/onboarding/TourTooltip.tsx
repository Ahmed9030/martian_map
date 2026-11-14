'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Check, ChevronLeft, ChevronRight, Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { formatDistanceKm, formatHours } from '@/lib/format';
import { useOnboarding } from './OnboardingProvider';
import type { SpotlightRect } from './TourOverlay';
import type { TourDemoResult, TourPlacement } from './types';

interface TourTooltipProps {
  rect: SpotlightRect | null;
}

const CARD_WIDTH = 340;
const CARD_GAP = 14;
const VIEWPORT_MARGIN = 12;
/** Extra breathing room between the bottom sheet and the window edge. */
const SHEET_BOTTOM_MARGIN = 24;
/** The sheet never grows past this share of the visible height. */
const SHEET_MAX_RATIO = 0.62;
/** Used before the card has been measured. */
const ESTIMATED_HEIGHT = 240;
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const RISK_LABEL: Record<TourDemoResult['risk'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

const RISK_CLASS: Record<TourDemoResult['risk'], string> = {
  low: 'text-emerald-300',
  medium: 'text-amber-300',
  high: 'text-orange-300',
  critical: 'text-red-400',
};

interface CardPosition {
  mode: 'floating' | 'sheet' | 'center';
  style: React.CSSProperties;
}

interface ViewportBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Visible area of the page. `visualViewport` accounts for mobile browser bars,
 * the on-screen keyboard and pinch-zoom, so the card can never be placed in a
 * region the user cannot actually see or tap.
 */
function getViewport(): ViewportBox {
  const viewport = typeof window !== 'undefined' ? window.visualViewport : null;
  if (viewport) {
    return {
      top: viewport.offsetTop,
      left: viewport.offsetLeft,
      width: viewport.width,
      height: viewport.height,
    };
  }
  return {
    top: 0,
    left: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function computePosition(
  rect: SpotlightRect | null,
  placement: TourPlacement,
  height: number,
): CardPosition {
  const viewport = getViewport();
  const viewportWidth = viewport.width;
  const viewportHeight = viewport.height;
  const minTop = viewport.top + VIEWPORT_MARGIN;
  const maxTop = Math.max(minTop, viewport.top + viewportHeight - height - VIEWPORT_MARGIN);
  const minLeft = viewport.left + VIEWPORT_MARGIN;
  const cardWidth = Math.min(CARD_WIDTH, Math.max(200, viewportWidth - VIEWPORT_MARGIN * 2));
  const maxLeft = Math.max(minLeft, viewport.left + viewportWidth - cardWidth - VIEWPORT_MARGIN);

  if (!rect) {
    return {
      mode: 'center',
      style: { maxHeight: Math.max(160, viewportHeight - VIEWPORT_MARGIN * 2) },
    };
  }

  // Small screens: the card becomes a bottom sheet, always inside the window.
  if (viewportWidth < 768) {
    return {
      mode: 'sheet',
      style: {
        left: minLeft,
        width: viewportWidth - VIEWPORT_MARGIN * 2,
        bottom: VIEWPORT_MARGIN + SHEET_BOTTOM_MARGIN,
        maxHeight: Math.max(200, viewportHeight * SHEET_MAX_RATIO),
      },
    };
  }

  const space = {
    top: rect.top - viewport.top,
    bottom: viewport.top + viewportHeight - (rect.top + rect.height),
    left: rect.left - viewport.left,
    right: viewport.left + viewportWidth - (rect.left + rect.width),
  };

  let side: Exclude<TourPlacement, 'auto'>;
  if (placement !== 'auto') {
    side = placement;
  } else {
    const preferred: Array<Exclude<TourPlacement, 'auto'>> = ['right', 'bottom', 'left', 'top'];
    side = preferred.reduce((best, candidate) =>
      space[candidate] > space[best] ? candidate : best,
    );
  }

  let top = rect.top + rect.height / 2 - height / 2;
  let left = rect.left + rect.width / 2 - cardWidth / 2;

  if (side === 'right') {
    left = rect.left + rect.width + CARD_GAP;
    top = rect.top + rect.height / 2 - height / 2;
  } else if (side === 'left') {
    left = rect.left - cardWidth - CARD_GAP;
    top = rect.top + rect.height / 2 - height / 2;
  } else if (side === 'bottom') {
    top = rect.top + rect.height + CARD_GAP;
    left = rect.left + rect.width / 2 - cardWidth / 2;
  } else {
    top = rect.top - height - CARD_GAP;
    left = rect.left + rect.width / 2 - cardWidth / 2;
  }

  const clampedLeft = Math.min(Math.max(left, minLeft), maxLeft);
  const clampedTop = Math.min(Math.max(top, minTop), maxTop);

  return {
    mode: 'floating',
    style: {
      top: clampedTop,
      left: clampedLeft,
      width: cardWidth,
      maxHeight: viewportHeight - VIEWPORT_MARGIN * 2,
    },
  };
}

function DemoResult({ demo }: { demo: ReturnType<typeof useOnboarding>['demo'] }) {
  if (demo.status === 'loading') {
    return (
      <div className="mt-2 space-y-1.5" aria-live="polite">
        {[0, 1].map((row) => (
          <div key={row} className="flex gap-2">
            <span className="h-7 flex-1 animate-pulse rounded-md bg-white/10" />
            <span className="h-7 flex-1 animate-pulse rounded-md bg-white/10" />
            <span className="h-7 flex-1 animate-pulse rounded-md bg-white/10" />
          </div>
        ))}
        <p className="text-[10px] text-muted">Calculating a real route…</p>
      </div>
    );
  }

  if (demo.status === 'error') {
    return (
      <p role="status" className="mt-2 text-[11px] leading-relaxed text-amber-300">
        {demo.message ?? 'The example route could not be loaded.'}
      </p>
    );
  }

  if (demo.status !== 'ready' || !demo.result) return null;

  const { result } = demo;
  const stats = [
    { label: 'Distance', value: formatDistanceKm(result.distanceKm) },
    { label: 'Est. time', value: formatHours(result.hours) },
    { label: 'Slope risk', value: RISK_LABEL[result.risk], className: RISK_CLASS[result.risk] },
  ];

  return (
    <div className="mt-2 space-y-1.5" aria-live="polite">
      <div className="grid grid-cols-3 gap-1.5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5"
          >
            <p className="text-[8px] uppercase tracking-[1px] text-gray-400">{stat.label}</p>
            <p className={cn('mt-0.5 text-[11px] font-semibold text-white', stat.className)}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted">
        <span>Max slope {result.maxSlope.toFixed(1)}°</span>
        <span aria-hidden="true">·</span>
        <span>
          Temperature {Math.round(result.minTherm)}–{Math.round(result.maxTherm)} K
        </span>
        {demo.sample ? (
          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-200">
            Sample data
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function TourTooltip({ rect }: TourTooltipProps) {
  const {
    step,
    next,
    back,
    skip,
    finish,
    stepNumber,
    totalSteps,
    isFirstStep,
    isLastStep,
    demo,
    runExample,
  } = useOnboarding();
  const cardRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(ESTIMATED_HEIGHT);
  const [, setViewportTick] = useState(0);
  /** Pixels the card was pushed up by the safety clamp (positive = up). */
  const [shift, setShift] = useState(0);

  // Measure the card and the visible viewport so the card can always be
  // clamped inside the window, even while it grows (demo results, long copy).
  useLayoutEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    const measure = () => setHeight(element.getBoundingClientRect().height);
    const remeasureViewport = () => setViewportTick((tick) => tick + 1);

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener('resize', measure);
    window.addEventListener('resize', remeasureViewport);
    window.addEventListener('scroll', remeasureViewport, true);
    window.visualViewport?.addEventListener('resize', remeasureViewport);
    window.visualViewport?.addEventListener('scroll', remeasureViewport);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('resize', remeasureViewport);
      window.removeEventListener('scroll', remeasureViewport, true);
      window.visualViewport?.removeEventListener('resize', remeasureViewport);
      window.visualViewport?.removeEventListener('scroll', remeasureViewport);
    };
  }, []);

  // Entrance animation + focus for each step.
  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    element.focus({ preventScroll: true });
    if (!prefersReducedMotion()) {
      gsap.fromTo(
        element,
        { autoAlpha: 0, y: 8, scale: 0.98 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.28, ease: 'power2.out', clearProps: 'transform' },
      );
    }
  }, [step?.id]);

  const position = computePosition(rect, step?.placement ?? 'auto', height);

  // Safety net: whatever the layout does (fonts, images, host-app chrome, zoom),
  // the rendered card must stay fully inside the visible area.
  useLayoutEffect(() => {
    if (!step) return;
    const element = cardRef.current;
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    const viewport = getViewport();
    const topLimit = viewport.top + VIEWPORT_MARGIN;
    const bottomLimit = viewport.top + viewport.height - VIEWPORT_MARGIN;
    // Undo the shift already applied so we always measure the base position.
    const baseTop = bounds.top + shift;
    const baseBottom = baseTop + bounds.height;

    let up = 0;
    if (baseBottom > bottomLimit) up = baseBottom - bottomLimit;
    if (baseTop - up < topLimit) up = baseTop - topLimit;

    if (Math.abs(up - shift) > 0.5) setShift(up);
  }, [height, rect, position.mode, step, shift]);

  if (!step) return null;

  const titleId = `tour-step-${step.id}-title`;
  const descriptionId = `tour-step-${step.id}-description`;
  const progress = totalSteps > 0 ? Math.round((stepNumber / totalSteps) * 100) : 0;

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab') return;
    const focusable = cardRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && (active === first || active === cardRef.current)) {
      event.preventDefault();
      last.focus();
    }
  }

  const card = (
    <div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      style={{
        ...position.style,
        ...(position.mode === 'floating' && shift
          ? { top: (position.style.top as number) - shift }
          : null),
        ...(position.mode === 'sheet' && shift
          ? { bottom: ((position.style.bottom as number) ?? 0) + shift }
          : null),
        ...(position.mode === 'center' && shift ? { marginTop: -shift } : null),
      }}
      className={cn(
        'pointer-events-auto glass-panel flex flex-col overflow-hidden text-white shadow-2xl focus:outline-none',
        position.mode === 'floating' && 'fixed p-4',
        position.mode === 'sheet' && 'fixed p-4',
        position.mode === 'center' && 'w-[min(22rem,100%)] p-5',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-mars-bright">
          Step {stepNumber} of {totalSteps}
        </p>
        <button
          type="button"
          onClick={skip}
          aria-label="Close the tour"
          className="-mr-1 -mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-telemetry"
        >
          <X size={14} />
        </button>
      </div>

      {/* Only this part scrolls, so the controls below always stay on screen. */}
      <div className="-mr-1 min-h-0 flex-1 overflow-y-auto pr-1">
        <h2 id={titleId} className="mt-1 text-sm font-semibold leading-snug">
          {step.title}
        </h2>
        <p id={descriptionId} className="mt-1.5 text-xs leading-relaxed text-secondary">
          {step.description}
        </p>
        <p className="sr-only" aria-live="polite">
          Step {stepNumber} of {totalSteps}: {step.title}
        </p>

        {step.action === 'demo' ? (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] leading-snug text-secondary">
                See a full route with real data.
              </p>
              <Button
                type="button"
                variant="quiet"
                size="sm"
                onClick={() => void runExample()}
                disabled={demo.status === 'loading'}
                className="shrink-0 text-[11px]"
              >
                {demo.status === 'loading' ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Sparkles size={12} />
                )}
                {demo.status === 'ready' ? 'Reload' : 'Try an example'}
              </Button>
            </div>
            <DemoResult demo={demo} />
          </div>
        ) : null}
      </div>

      <div className="mt-3 shrink-0">
        <div
          role="progressbar"
          aria-label="Tour progress"
          aria-valuemin={1}
          aria-valuemax={Math.max(totalSteps, 1)}
          aria-valuenow={Math.max(stepNumber, 1)}
          className="h-1 w-full overflow-hidden rounded-full bg-white/10"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-mars to-telemetry transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[9px] text-muted">
          <span>
            {stepNumber} / {totalSteps}
          </span>
          <div className="flex gap-1" aria-hidden="true">
            {Array.from({ length: Math.min(totalSteps, 12) }).map((_, index) => (
              <span
                key={index}
                className={cn(
                  'h-1 rounded-full transition-all',
                  index + 1 === stepNumber ? 'w-3 bg-mars' : 'w-1 bg-white/20',
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={skip}
          className="rounded-full px-1 text-[10px] text-muted underline-offset-2 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-telemetry"
        >
          Skip tour
        </button>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={back}
            disabled={isFirstStep}
            aria-label="Previous step"
          >
            <ChevronLeft size={14} />
            Back
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={isLastStep ? finish : next}
          >
            {isLastStep ? (
              <>
                Done <Check size={14} />
              </>
            ) : (
              <>
                Next <ChevronRight size={14} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  if (position.mode === 'center') {
    return (
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center p-4">
        {card}
      </div>
    );
  }

  return card;
}
