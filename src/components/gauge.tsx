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

const CX = 160;
const CY = 160;
const R = 128;
const SWEEP = 250; // degrees, symmetric around straight up
const START = -SWEEP / 2;

const pt = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) };
};

const ARC = (() => {
  const p0 = pt(START, R);
  const p1 = pt(START + SWEEP, R);
  return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${R} ${R} 0 1 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
})();
const ARC_LEN = (R * SWEEP * Math.PI) / 180;

/** An analog readiness dial: 50 ticks, a sweeping needle, the score in the hub. */
export function ReadinessGauge({ score, level }: { score: number; level?: string }) {
  const shown = useCountUp(score, 1100);
  const angle = START + (SWEEP * score) / 100;
  const ticks = Array.from({ length: 51 }, (_, i) => i);
  return (
    <div
      role="meter"
      aria-label="Readiness score"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={score}
      data-testid="gauge"
      className="relative mx-auto w-full max-w-[22rem]"
    >
      <svg viewBox="0 0 320 310" className="block w-full overflow-visible" aria-hidden>
        <path d={ARC} fill="none" stroke="var(--rule)" strokeWidth="14" strokeLinecap="round" />
        <path
          d={ARC}
          fill="none"
          stroke="var(--signal-deep)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={ARC_LEN}
          style={{ ["--len" as string]: ARC_LEN, ["--off" as string]: ARC_LEN * (1 - score / 100), animation: "draw 1.1s var(--ease-out) both" }}
          strokeDashoffset={ARC_LEN * (1 - score / 100)}
        />
        {ticks.map((i) => {
          const deg = START + (SWEEP * i) / 50;
          const major = i % 5 === 0;
          const a = pt(deg, R - 22);
          const b = pt(deg, R - (major ? 38 : 30));
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--ink-soft)" strokeOpacity={major ? 0.9 : 0.45} strokeWidth={major ? 2 : 1.2} strokeLinecap="round" />;
        })}
        {[0, 50, 100].map((v) => {
          const p = pt(START + (SWEEP * v) / 100, R + 24);
          return (
            <text key={v} x={p.x} y={p.y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink-soft)" fontFamily="var(--font-atkinson)">
              {v}
            </text>
          );
        })}
        <g style={{ transformOrigin: `${CX}px ${CY}px`, ["--from" as string]: `${START}deg`, ["--to" as string]: `${angle}deg`, animation: "needle 1.1s var(--ease-out) both", transform: `rotate(${angle}deg)` }}>
          <path d={`M ${CX - 5} ${CY} L ${CX} ${CY - 98} L ${CX + 5} ${CY} Z`} fill="var(--ink)" />
          <circle cx={CX} cy={CY - 98} r="4.5" fill="var(--signal)" stroke="var(--ink)" strokeWidth="1.5" />
        </g>
        <circle cx={CX} cy={CY} r="13" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2.5" />
        <circle cx={CX} cy={CY} r="4" fill="var(--ink)" />
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center">
        <p className="font-display text-6xl leading-none font-medium tracking-tight tnum" data-testid="score">{Math.round(shown)}</p>
        <p className="mt-1 text-sm text-ink-soft">out of 100{level ? <span className="font-bold text-ink"> · <span data-testid="level">{level}</span></span> : null}</p>
      </div>
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
