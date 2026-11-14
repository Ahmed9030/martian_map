'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';
import { TOUR_STEPS } from './steps';
import { isStepAvailable } from './tourTargets';
import { useOnboardingState } from './useOnboardingState';
import { OnboardingWelcome } from './OnboardingWelcome';
import { TourOverlay } from './TourOverlay';
import type {
  TourDemoState,
  TourMapController,
  TourStep,
} from './types';

type TourPhase = 'closed' | 'welcome' | 'tour';

export interface OnboardingContextValue {
  /** False outside the map page, so shared chrome can render safely. */
  enabled: boolean;
  phase: TourPhase;
  step: TourStep | null;
  stepNumber: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  demo: TourDemoState;
  startTour: () => void;
  beginTour: (persist: boolean) => void;
  dismissWelcome: (persist: boolean) => void;
  next: () => void;
  back: () => void;
  skip: () => void;
  finish: () => void;
  runExample: () => void;
  registerMapController: (controller: TourMapController | null) => void;
}

const INITIAL_DEMO: TourDemoState = {
  status: 'idle',
  sample: false,
  result: null,
  message: null,
};

const noop = () => {};

const DEFAULT_CONTEXT: OnboardingContextValue = {
  enabled: false,
  phase: 'closed',
  step: null,
  stepNumber: 0,
  totalSteps: 0,
  isFirstStep: true,
  isLastStep: false,
  demo: INITIAL_DEMO,
  startTour: noop,
  beginTour: noop,
  dismissWelcome: noop,
  next: noop,
  back: noop,
  skip: noop,
  finish: noop,
  runExample: noop,
  registerMapController: noop,
};

const OnboardingContext = createContext<OnboardingContextValue>(DEFAULT_CONTEXT);

export function useOnboarding(): OnboardingContextValue {
  return useContext(OnboardingContext);
}

/** Steps whose targets exist right now, in config order. */
function computeAvailableIds(): string[] {
  return TOUR_STEPS.filter(isStepAvailable).map((step) => step.id);
}

function sameIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

const subscribeClient = () => () => {};

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { seen, canPersist, markSeen } = useOnboardingState();
  // Portals only render on the client; no state/effect round-trip needed.
  const mounted = useSyncExternalStore(
    subscribeClient,
    () => true,
    () => false,
  );
  const [phase, setPhase] = useState<TourPhase>('closed');
  const [stepIndex, setStepIndex] = useState(0);
  const [availableIds, setAvailableIds] = useState<string[]>(() =>
    typeof document === 'undefined' ? [] : computeAvailableIds(),
  );
  const [demo, setDemo] = useState<TourDemoState>(INITIAL_DEMO);
  const [toast, setToast] = useState<string | null>(null);

  const controllerRef = useRef<TourMapController | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const persistRef = useRef(true);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const demoRequestRef = useRef(0);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // ── Which steps can be shown right now ──────────────────────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const refresh = () => {
      timer = null;
      const next = computeAvailableIds();
      setAvailableIds((previous) => (sameIds(previous, next) ? previous : next));
    };

    // Panels appear/disappear as routes are calculated and drawers open, so
    // keep the availability list in sync (debounced to avoid map-pan churn).
    const schedule = () => {
      if (timer) return;
      timer = setTimeout(refresh, 150);
    };

    const frame = requestAnimationFrame(refresh);
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'inert', 'hidden', 'aria-hidden'],
    });
    window.addEventListener('resize', schedule);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const availableSteps = useMemo(
    () => TOUR_STEPS.filter((step) => availableIds.includes(step.id)),
    [availableIds],
  );

  const step = phase === 'tour' ? TOUR_STEPS[stepIndex] ?? null : null;

  const stepNumber = useMemo(() => {
    if (!step) return 0;
    const index = availableSteps.findIndex((item) => item.id === step.id);
    return index >= 0 ? index + 1 : 1;
  }, [availableSteps, step]);

  const totalSteps = Math.max(availableSteps.length, step ? 1 : 0);
  const isFirstStep = !step || step.id === availableSteps[0]?.id;
  const isLastStep = !!step && step.id === availableSteps[availableSteps.length - 1]?.id;

  // ── Demo route ──────────────────────────────────────────────────────────
  const clearDemo = useCallback(() => {
    demoRequestRef.current += 1;
    controllerRef.current?.clearScenario();
    setDemo(INITIAL_DEMO);
  }, []);

  const runExample = useCallback(async () => {
    const controller = controllerRef.current;
    if (!controller) {
      setDemo({
        status: 'error',
        sample: false,
        result: null,
        message: 'The map is still loading. Try again in a moment.',
      });
      return;
    }

    const requestId = demoRequestRef.current + 1;
    demoRequestRef.current = requestId;
    setDemo({ status: 'loading', sample: false, result: null, message: null });

    try {
      const outcome = await controller.runScenario();
      if (demoRequestRef.current !== requestId) return;
      setDemo({
        status: 'ready',
        sample: outcome.sample,
        result: outcome.result,
        message: outcome.message ?? null,
      });
    } catch {
      if (demoRequestRef.current !== requestId) return;
      setDemo({
        status: 'error',
        sample: false,
        result: null,
        message: 'The example route could not be loaded. You can still pick points yourself.',
      });
    }
  }, []);

  const registerMapController = useCallback((controller: TourMapController | null) => {
    controllerRef.current = controller;
  }, []);

  // ── Navigation ──────────────────────────────────────────────────────────
  const findStep = useCallback(
    (from: number, direction: 1 | -1): number => {
      for (let index = from + direction; index >= 0 && index < TOUR_STEPS.length; index += direction) {
        if (availableIds.includes(TOUR_STEPS[index].id)) return index;
      }
      return -1;
    },
    [availableIds],
  );

  const restoreFocus = useCallback(() => {
    const trigger = triggerRef.current;
    triggerRef.current = null;
    if (trigger && document.contains(trigger)) {
      trigger.focus({ preventScroll: true });
    }
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const startTour = useCallback(() => {
    triggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    persistRef.current = true;
    const available = computeAvailableIds();
    setAvailableIds(available);
    const firstIndex = TOUR_STEPS.findIndex((item) => available.includes(item.id));
    setStepIndex(firstIndex >= 0 ? firstIndex : 0);
    setPhase('tour');
  }, []);

  const beginTour = useCallback(
    (persist: boolean) => {
      startTour();
      // Applied after `startTour` so the checkbox value wins over the default.
      persistRef.current = persist;
    },
    [startTour],
  );

  const dismissWelcome = useCallback(
    (persist: boolean) => {
      if (persist) markSeen('skipped');
      setPhase('closed');
      restoreFocus();
    },
    [markSeen, restoreFocus],
  );

  const closeTour = useCallback(
    (status: 'completed' | 'skipped') => {
      if (persistRef.current) markSeen(status);
      clearDemo();
      setPhase('closed');
      restoreFocus();
    },
    [clearDemo, markSeen, restoreFocus],
  );

  const finish = useCallback(() => closeTour('completed'), [closeTour]);

  const skip = useCallback(() => {
    closeTour('skipped');
    showToast('You can replay the tour anytime from the (?) button.');
  }, [closeTour, showToast]);

  const next = useCallback(() => {
    const nextIndex = findStep(stepIndex, 1);
    if (nextIndex === -1) {
      finish();
      return;
    }
    setStepIndex(nextIndex);
  }, [findStep, finish, stepIndex]);

  const back = useCallback(() => {
    const previousIndex = findStep(stepIndex, -1);
    if (previousIndex !== -1) setStepIndex(previousIndex);
  }, [findStep, stepIndex]);

  // ── Auto-show on first visit ────────────────────────────────────────────
  useEffect(() => {
    if (seen !== 'unseen') return;
    // Deferred one tick so the map has laid out before the welcome appears.
    const timer = setTimeout(() => {
      triggerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setPhase('welcome');
    }, 0);
    return () => clearTimeout(timer);
  }, [seen]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      enabled: true,
      phase,
      step,
      stepNumber,
      totalSteps,
      isFirstStep,
      isLastStep,
      demo,
      startTour,
      beginTour,
      dismissWelcome,
      next,
      back,
      skip,
      finish,
      runExample,
      registerMapController,
    }),
    [
      phase,
      step,
      stepNumber,
      totalSteps,
      isFirstStep,
      isLastStep,
      demo,
      startTour,
      beginTour,
      dismissWelcome,
      next,
      back,
      skip,
      finish,
      runExample,
      registerMapController,
    ],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {mounted && phase === 'welcome'
        ? createPortal(
            <OnboardingWelcome
              canPersist={canPersist}
              onStart={(persist) => {
                persistRef.current = persist;
                beginTour(persist);
              }}
              onSkip={(persist) => {
                persistRef.current = persist;
                dismissWelcome(persist);
              }}
            />,
            document.body,
          )
        : null}
      {mounted && phase === 'tour' && step
        ? createPortal(<TourOverlay />, document.body)
        : null}
      {mounted && toast
        ? createPortal(
            <div
              role="status"
              className="pointer-events-none fixed inset-x-0 bottom-6 z-[10001] flex justify-center px-4"
            >
              <div className="glass-panel pointer-events-auto flex items-center gap-2 px-3 py-2 text-xs text-white shadow-xl">
                <Info size={14} className="text-telemetry" aria-hidden="true" />
                <span>{toast}</span>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => setToast(null)}
                  className="rounded-full p-0.5 text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-telemetry"
                >
                  <X size={12} />
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </OnboardingContext.Provider>
  );
}
