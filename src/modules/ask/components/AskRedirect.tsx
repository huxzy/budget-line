"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { lgaSlug } from "@/modules/budget";
import { usePreferences } from "@/modules/prefs";

export function AskRedirect() {
  const router = useRouter();
  const { prefs, ready } = usePreferences();
  useEffect(() => {
    if (!ready) return;
    router.replace(prefs.lga ? `/s/${prefs.state ?? "niger"}/${lgaSlug(prefs.lga)}` : "/");
  }, [ready, prefs.lga, router]);
  return <div className="min-h-dvh bg-surface" aria-busy />;
}
