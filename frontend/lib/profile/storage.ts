/** Local persistence for the Martian profile token and display name. */

export const PROFILE_TOKEN_KEY = "martian_map.profile_token";
export const PROFILE_NAME_KEY = "martian_map.profile_name";

export interface ProfileSnapshot {
  token: string | null;
  name: string | null;
}

const EMPTY_SNAPSHOT: ProfileSnapshot = { token: null, name: null };

let cachedSnapshot: ProfileSnapshot | null = null;
const listeners = new Set<() => void>();

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readSnapshot(): ProfileSnapshot {
  const storage = safeStorage();
  const token = storage?.getItem(PROFILE_TOKEN_KEY)?.trim() || null;
  const name = storage?.getItem(PROFILE_NAME_KEY)?.trim() || null;

  if (
    cachedSnapshot &&
    cachedSnapshot.token === token &&
    cachedSnapshot.name === name
  ) {
    return cachedSnapshot;
  }

  cachedSnapshot = { token, name };
  return cachedSnapshot;
}

function emitChange(): void {
  cachedSnapshot = null;
  for (const listener of listeners) listener();
}

export function subscribeProfile(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Client snapshot; stable between storage changes. */
export function getProfileSnapshot(): ProfileSnapshot {
  return readSnapshot();
}

/** Server snapshot: storage is unavailable during SSR. */
export function getServerProfileSnapshot(): ProfileSnapshot {
  return EMPTY_SNAPSHOT;
}

export function getProfileToken(): string | null {
  return readSnapshot().token;
}

export function setProfileToken(token: string): void {
  safeStorage()?.setItem(PROFILE_TOKEN_KEY, token);
  emitChange();
}

export function getProfileName(): string | null {
  return readSnapshot().name;
}

export function setProfileName(name: string): void {
  safeStorage()?.setItem(PROFILE_NAME_KEY, name);
  emitChange();
}

export function clearProfile(): void {
  const storage = safeStorage();
  if (!storage) return;
  storage.removeItem(PROFILE_TOKEN_KEY);
  storage.removeItem(PROFILE_NAME_KEY);
  emitChange();
}

/** Short, human-readable token preview, e.g. `2bf471fd…cac8d`. */
export function shortToken(token: string): string {
  if (token.length <= 14) return token;
  return `${token.slice(0, 8)}…${token.slice(-5)}`;
}
