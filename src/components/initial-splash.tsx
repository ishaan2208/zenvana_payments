"use client";

import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";

const SPLASH_KEY = "zenvana_payments_splash_seen";
const MIN_DURATION_MS = 1400;
const FADE_MS = 320;

type Phase = "hidden" | "visible" | "fading";

function getInitialPhase(): Phase {
  if (typeof window === "undefined") return "hidden";
  const hasSeen = window.sessionStorage.getItem(SPLASH_KEY) === "1";
  if (hasSeen) return "hidden";
  window.sessionStorage.setItem(SPLASH_KEY, "1");
  return "visible";
}

export function InitialSplash() {
  const [phase, setPhase] = useState<Phase>(() => getInitialPhase());

  useEffect(() => {
    if (phase !== "visible") return;

    const fadeTimer = window.setTimeout(() => setPhase("fading"), MIN_DURATION_MS);
    const hideTimer = window.setTimeout(() => setPhase("hidden"), MIN_DURATION_MS + FADE_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [phase]);

  if (phase === "hidden") return null;

  return (
    <div
      aria-label="Loading Zenvana"
      role="status"
      className={[
        "fixed inset-0 z-[100] flex items-center justify-center px-6",
        "bg-[radial-gradient(circle_at_50%_30%,rgba(219,230,76,0.18),transparent_45%),linear-gradient(180deg,#001F3F_0%,#0A1428_100%)]",
        "transition-opacity duration-300 motion-reduce:transition-none",
        phase === "fading" ? "pointer-events-none opacity-0" : "opacity-100",
      ].join(" ")}
    >
      <div className="flex flex-col items-center gap-3 text-center text-white">
        <p className="text-[10px] uppercase tracking-[0.32em] text-white/70">Welcome to</p>
        <BrandLogo className="justify-center" />
        <p className="text-xs tracking-[0.18em] text-white/70 sm:text-sm">
          Payments Portal
        </p>
      </div>
    </div>
  );
}
