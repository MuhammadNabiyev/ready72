"use client";

import { useEffect, useRef, useState } from "react";

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Counts up to `target` once, then follows later changes quickly. Honors reduced motion. */
export function useCountUp(target: number, ms = 900) {
  const reduced = prefersReduced();
  const [value, setValue] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (reduced) return;
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / ms));
      const eased = 1 - Math.pow(1 - t, 4);
      const v = origin + (target - origin) * eased;
      from.current = v;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, reduced]);
  return reduced ? target : value;
}

/** A fuel-gauge of 40 ticks; each tick is 2.5 points of readiness. */
export function ReadinessGauge({ score }: { score: number }) {
  const total = 40;
  const on = Math.round((score / 100) * total);
  return (
    <div
      role="meter"
      aria-label="Readiness score"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={score}
      data-testid="gauge"
      className="flex h-16 items-end gap-[3px] sm:gap-1"
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="tick flex-1 rounded-[1px]"
          data-on={i < on ? "true" : "false"}
          style={{ ["--i" as string]: i, height: i % 5 === 4 ? "100%" : "78%" }}
        />
      ))}
    </div>
  );
}

/** Horizontal supply bar. `fraction` is 0..1. */
export function SupplyBar({ fraction, label }: { fraction: number; label: string }) {
  const state = fraction >= 1 ? "full" : fraction <= 0.05 ? "empty" : "mid";
  return (
    <div className="bar" data-state={state} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fraction * 100)}>
      <span style={{ transform: `scaleX(${Math.max(0.02, fraction)})` }} />
    </div>
  );
}
