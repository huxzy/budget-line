"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePreferences } from "@/modules/prefs";

export function AskRedirect() {
  const router = useRouter();
  const { prefs, ready } = usePreferences();
  useEffect(() => {
    if (!ready) return;
    router.replace(prefs.lga ? `/s/niger/${prefs.lga.toLowerCase()}` : "/");
  }, [ready, prefs.lga, router]);
  return <div className="min-h-dvh bg-surface" aria-busy />;
}
