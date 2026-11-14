import type { TourStep } from './types';

const MIN_VISIBLE_PX = 8;

/** First target of a step that is actually rendered and on screen. */
export function getStepTargetElement(step: TourStep): HTMLElement | null {
  if (!step.targets?.length) return null;

  for (const selector of step.targets) {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) continue;
    // Closed drawers stay in the DOM but are inert; never spotlight those.
    if (element.closest('[inert]')) continue;
    const rect = element.getBoundingClientRect();
    if (rect.width < MIN_VISIBLE_PX || rect.height < MIN_VISIBLE_PX) continue;
    return element;
  }

  return null;
}

/** Steps without targets (welcome/finish style) are always available. */
export function isStepAvailable(step: TourStep): boolean {
  if (!step.targets?.length) return true;
  return getStepTargetElement(step) !== null;
}
