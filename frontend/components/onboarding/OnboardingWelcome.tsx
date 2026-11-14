'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Orbit } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface OnboardingWelcomeProps {
  /** `persist` is the "Don't show this again" checkbox value. */
  onStart: (persist: boolean) => void;
  onSkip: (persist: boolean) => void;
  /** Only signed-in visitors can remember the choice. */
  canPersist: boolean;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function OnboardingWelcome({ onStart, onSkip, canPersist }: OnboardingWelcomeProps) {
  const [persist, setPersist] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !prefersReducedMotion()) {
      gsap.fromTo(
        dialog,
        { autoAlpha: 0, y: 14, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.32, ease: 'power2.out' },
      );
    }
    dialogRef.current?.focus({ preventScroll: true });
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onSkip(persist);
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && (active === first || active === dialogRef.current)) {
      event.preventDefault();
      last.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-welcome-title"
        aria-describedby="onboarding-welcome-description"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="glass-panel relative w-full max-w-md p-6 text-white shadow-2xl focus:outline-none"
      >
        <div className="mb-3 flex size-11 items-center justify-center rounded-full border border-mars/40 bg-mars-soft text-mars-bright">
          <Orbit size={22} strokeWidth={1.6} aria-hidden="true" />
        </div>

        <h2 id="onboarding-welcome-title" className="text-lg font-semibold tracking-tight">
          Welcome to Martian Map
        </h2>
        <p id="onboarding-welcome-description" className="mt-2 text-sm leading-relaxed text-secondary">
          Plan a safe, science-ready route across Mars in under a minute. Want a quick tour first?
        </p>

        {canPersist ? (
          <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={persist}
              onChange={(event) => setPersist(event.target.checked)}
              className="size-3.5 accent-[var(--mars-orange)]"
            />
            Don&apos;t show this again
          </label>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onSkip(persist)}
            className="text-secondary"
          >
            Skip, let me explore
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={() => onStart(persist)}>
            Start the tour
          </Button>
        </div>
      </div>
    </div>
  );
}
