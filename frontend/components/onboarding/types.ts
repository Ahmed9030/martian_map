import type { RiskLevel } from '@/lib/path/types';

/** Where the tooltip tries to sit relative to the spotlight. */
export type TourPlacement = 'auto' | 'top' | 'bottom' | 'left' | 'right';

/**
 * A single onboarding step. Steps are data only; the provider decides which
 * ones can be shown based on the targets that exist in the DOM.
 */
export interface TourStep {
  /** Stable id, also used for aria ids. */
  id: string;
  /**
   * `data-tour` selectors (or any CSS selector). The first visible match is
   * spotlit. Leave empty for a centered card such as the finish step.
   */
  targets?: readonly string[];
  title: string;
  /** Short copy, max two sentences. */
  description: string;
  placement?: TourPlacement;
  /** Let clicks reach the spotlit element instead of blocking them. */
  interactive?: boolean;
  /** Optional action rendered inside the tooltip. */
  action?: 'demo';
}

/** Values shown in the tooltip after the example route is calculated. */
export interface TourDemoResult {
  distanceKm: number;
  hours: number;
  maxSlope: number;
  risk: RiskLevel;
  minTherm: number;
  maxTherm: number;
}

export type TourDemoStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface TourDemoState {
  status: TourDemoStatus;
  /** True when the map had to fall back to generated sample data. */
  sample: boolean;
  result: TourDemoResult | null;
  message: string | null;
}

/** What the map reports back after running the example scenario. */
export interface TourScenarioResult {
  result: TourDemoResult;
  sample: boolean;
  message?: string;
}

/**
 * The Map component registers an implementation of this so the tour can draw
 * and clear the example route without importing map internals.
 */
export interface TourMapController {
  runScenario: () => Promise<TourScenarioResult>;
  clearScenario: () => void;
}
