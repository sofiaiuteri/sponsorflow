"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENT = "sponsorflow:storage";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

export function writeStorage(key: string, value: string | null) {
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, value);
  window.dispatchEvent(new Event(EVENT));
}

/** SSR-safe localStorage string, shared across components and tabs. */
export function useStoredString(key: string) {
  const value = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key),
    () => null,
  );
  const set = useCallback((v: string | null) => writeStorage(key, v), [key]);
  return [value, set] as const;
}

/** True once running in the browser — avoids flashing demo content during hydration. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export const PROFILE_KEY = "sponsorflow:profile";
export const statusKey = (name: string) => `sponsorflow:status:${name.toLowerCase()}`;
