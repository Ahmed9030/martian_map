'use client';

import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboarding } from './OnboardingProvider';

/**
 * Persistent "?" control that replays the tour. Renders nothing outside the
 * map page (no provider) so the shared Navbar stays unchanged elsewhere.
 */
export function TourHelpButton({ className }: { className?: string }) {
  const { enabled, phase, startTour } = useOnboarding();

  if (!enabled) return null;

  return (
    <button
      type="button"
      onClick={startTour}
      disabled={phase !== 'closed'}
      aria-label="Replay the map tour"
      title="Replay the tour"
      data-tour="tour-help"
      className={cn(
        'glass-panel flex size-10 items-center justify-center rounded-full text-white/70 transition-colors duration-200',
        'hover:border-mars/40 hover:text-white',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-telemetry',
        'disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
    >
      <HelpCircle size={18} strokeWidth={1.7} />
    </button>
  );
}
