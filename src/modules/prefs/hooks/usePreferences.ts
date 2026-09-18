"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_PREFS, readPrefs, writePrefs } from "../services/storage";
import type { Preferences } from "../types";

/**
 * One shared store for the remembered LGA and language, so every component
 * sees a change the moment it is made. The server snapshot is the default,
 * and `ready` turns true after the first client read.
 */
let cache: { prefs: Preferences; ready: boolean } = { prefs: DEFAULT_PREFS, ready: false };
const serverSnapshot = cache;
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  if (!cache.ready) {
    cache = { prefs: readPrefs(), ready: true };
    queueMicrotask(() => listeners.forEach((l) => l()));
  }
  return () => listeners.delete(fn);
}

function set(patch: Partial<Preferences>) {
  cache = { prefs: { ...cache.prefs, ...patch }, ready: true };
  writePrefs(cache.prefs);
  listeners.forEach((l) => l());
}

export function usePreferences() {
  const snap = useSyncExternalStore(subscribe, () => cache, () => serverSnapshot);
  const update = useCallback((patch: Partial<Preferences>) => set(patch), []);
  return { prefs: snap.prefs, ready: snap.ready, update };
}
