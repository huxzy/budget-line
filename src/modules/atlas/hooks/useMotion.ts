"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "budgetline.atlas.view";

/**
 * Which entry view to show. Reduced motion (or a saved choice) gives the
 * list; "Show the map anyway" is always available. `ready` is false until the
 * first client read so the server render and first paint agree.
 */
export function useAtlasView() {
  const [reduced, setReduced] = useState(false);
  const [choice, setChoice] = useState<"map" | "list" | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    try {
      const saved = window.sessionStorage.getItem(KEY);
      if (saved === "map" || saved === "list") setChoice(saved);
    } catch {
      /* ignore */
    }
    setReady(true);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const set = useCallback((v: "map" | "list") => {
    setChoice(v);
    try {
      window.sessionStorage.setItem(KEY, v);
    } catch {
      /* ignore */
    }
  }, []);

  const view: "map" | "list" = choice ?? (reduced ? "list" : "map");
  return { view, reduced, ready, set };
}
