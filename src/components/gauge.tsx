"use client";

import { useEffect, useRef, useState } from "react";
import { Pictogram } from "./pictogram";

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

const tone = (score: number) => (score >= 70 ? "green" : score >= 35 ? "yellow" : "red");

/** The readiness score as a safety sign: green is safe, yellow is caution, red is danger. */
export function ReadinessGauge({ score, level }: { score: number; level?: string }) {
  const shown = useCountUp(score, 1100);
  const t = tone(score);
  const lit = Math.round(score / 5);
  return (
    <div
      role="meter"
      aria-label="Readiness score"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={score}
      data-testid="gauge"
      data-tone={t}
      className={`sign sign-${t} flip px-8 pt-9 pb-10 text-center shadow-[var(--shadow-soft)]`}
    >
      <p className="flex items-center justify-center gap-2.5 text-base font-extrabold tracking-[0.16em] uppercase">
        <Pictogram name={t === "green" ? "shield" : t === "yellow" ? "warning" : "cross"} className="size-7" />
        <span data-testid="level">{level ?? ""}</span>
      </p>
      <p className="mt-3 text-[clamp(6rem,14vw,9rem)] leading-[0.86] font-black tracking-[-0.04em] tnum" data-testid="score">
        {Math.round(shown)}
      </p>
      <p className="mt-2 text-lg font-bold">out of 100</p>
      <div className="mx-auto mt-6 flex max-w-[16rem] gap-[3px]" aria-hidden>
        {Array.from({ length: 20 }, (_, i) => (
          <span
            key={i}
            className="h-4 flex-1 rounded-[2px] bg-current"
            style={{ opacity: i < lit ? 1 : 0.22, transformOrigin: "bottom", animation: i < lit ? `grow-y 420ms var(--ease-out) ${300 + i * 28}ms both` : undefined }}
          />
        ))}
      </div>
    </div>
  );
}

/** Horizontal supply bar. `fraction` is 0..1. */
export function SupplyBar({ fraction, label }: { fraction: number; label: string }) {
  const state = fraction >= 0.75 ? "full" : fraction < 0.34 ? "empty" : "mid";
  return (
    <div className="bar" data-state={state} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fraction * 100)}>
      <span style={{ transform: `scaleX(${Math.max(0.02, fraction)})` }} />
    </div>
  );
}
