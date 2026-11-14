'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { getProfileToken, subscribeProfile } from '@/lib/profile/storage';

export const ONBOARDING_STORAGE_KEY = 'martian-map:onboarding';

/** Bump this when the tour content changes enough to deserve a re-run. */
export const ONBOARDING_VERSION = 1;

export type OnboardingStatus = 'completed' | 'skipped';

export interface OnboardingRecord {
  status: OnboardingStatus;
  version: number;
  at: string;
  /** Profile token that completed the tour; guests never store a record. */
  user: string | null;
}

/** `unknown` until localStorage has been read on the client. */
export type OnboardingSeen = 'unknown' | 'seen' | 'unseen';

interface UseOnboardingStateResult {
  seen: OnboardingSeen;
  /** `true` when a profile token exists, so "seen" can be remembered. */
  canPersist: boolean;
  markSeen: (status: OnboardingStatus) => void;
  reset: () => void;
}

function readRecord(): OnboardingRecord | null {
  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const record = parsed as Partial<OnboardingRecord>;
    if (record.status !== 'completed' && record.status !== 'skipped') return null;
    return {
      status: record.status,
      version: typeof record.version === 'number' ? record.version : 0,
      at: typeof record.at === 'string' ? record.at : '',
      user: typeof record.user === 'string' ? record.user : null,
    };
  } catch {
    return null;
  }
}

function isCurrent(record: OnboardingRecord | null): boolean {
  return !!record && record.version >= ONBOARDING_VERSION;
}

/**
 * Guests see the welcome on every page load. Signed-in visitors see it once per
 * profile, so a new login (or a logout followed by a new account) gets it again.
 */
function readSeen(): OnboardingSeen {
  const token = getProfileToken();
  if (!token) return 'unseen';
  const record = readRecord();
  if (!record || !isCurrent(record)) return 'unseen';
  return record.user === token ? 'seen' : 'unseen';
}

// ── Tiny external store around localStorage + the profile token ────────────
// Keeps the tour state out of render/effects and lets every consumer (help
// button, welcome modal) react to the same value. Swapping this for a backend
// later only means changing `readSeen` and `markSeen`.
let cachedSeen: OnboardingSeen | null = null;
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== ONBOARDING_STORAGE_KEY) return;
    cachedSeen = null;
    onChange();
  };
  window.addEventListener('storage', handleStorage);
  // Login/logout changes who we are, so it changes whether the tour was seen.
  const unsubscribeProfile = subscribeProfile(() => {
    cachedSeen = null;
    onChange();
  });
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', handleStorage);
    unsubscribeProfile();
  };
}

function getSnapshot(): OnboardingSeen {
  if (cachedSeen === null) cachedSeen = readSeen();
  return cachedSeen;
}

function getCanPersistSnapshot(): boolean {
  return getProfileToken() !== null;
}

function emit(): void {
  cachedSeen = null;
  for (const listener of listeners) listener();
}

/**
 * Persistence for "has this visitor seen the tour". Reads happen in the external
 * store (client only); the server snapshot is always `unknown`, so there is no
 * hydration mismatch and no effect-driven state updates.
 */
export function useOnboardingState(): UseOnboardingStateResult {
  const seen = useSyncExternalStore<OnboardingSeen>(
    subscribe,
    getSnapshot,
    () => 'unknown',
  );
  const canPersist = useSyncExternalStore<boolean>(
    subscribe,
    getCanPersistSnapshot,
    () => false,
  );

  const markSeen = useCallback((status: OnboardingStatus) => {
    const token = getProfileToken();
    if (!token) {
      // Guests are asked again on the next visit.
      emit();
      return;
    }
    try {
      const record: OnboardingRecord = {
        status,
        version: ONBOARDING_VERSION,
        at: new Date().toISOString(),
        user: token,
      };
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(record));
    } catch {
      // Private mode or a full quota: the tour simply shows again next time.
    }
    emit();
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch {
      // Ignore storage failures; the store still reports `unseen`.
    }
    emit();
  }, []);

  return { seen, canPersist, markSeen, reset };
}
