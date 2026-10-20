"use client";

import * as Slider from "@radix-ui/react-slider";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { narrate, supplyTimeline, type TimelineLine } from "@/lib/features";
import type { State } from "@/lib/types";

const MAX_HOURS = 14 * 24;
const STEP = 6;

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const clock = (h: number) => `Day ${Math.floor(h / 24) + 1}, ${String(h % 24).padStart(2, "0")}:00`;

const amount = (l: TimelineLine) => {
  if (l.unit === "L") return `${Math.round(l.remaining * 10) / 10} L`;
  if (l.unit === "kcal") return `${Math.round(l.remaining).toLocaleString("en-US")} kcal`;
  return `${Math.round(l.remaining * 10) / 10} d`;
};

/** Drag the clock forward and watch each supply drain. */
export function TimeMachine({ state }: { state: State }) {
  const today = useMemo(() => new Date(), []);
  const [hours, setHours] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const lines = useMemo(() => supplyTimeline(state, today, hours), [state, today, hours]);
  const story = narrate(lines, hours);
  const targetHours = (state.profile?.days ?? 3) * 24;

  // the interval only advances time; stopping at the end happens in the tick itself
  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setHours((h) => {
        if (h + 2 >= MAX_HOURS) {
          setPlaying(false);
          return MAX_HOURS;
        }
        return h + 2;
      });
    }, 70);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing]);

  function togglePlay() {
    if (playing) return setPlaying(false);
    if (prefersReduced()) return setHours(MAX_HOURS);
    if (hours >= MAX_HOURS) setHours(0);
    setPlaying(true);
  }

  return (
    <section aria-labelledby="tm-h" className="rise mt-14" style={{ ["--d" as string]: 4 }} data-testid="time-machine">
      <h2 id="tm-h" className="text-3xl">Time machine</h2>
      <p className="mt-1 max-w-[62ch] text-ink-soft">
        What if help does not come? Move the clock and watch your supplies drain at your household’s pace.
      </p>

      <div className="mt-6 rounded-md border-2 border-ink bg-paper p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" className="btn btn-sm btn-primary" onClick={togglePlay} data-testid="tm-play" aria-pressed={playing}>
            {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
            {playing ? "Pause" : "Run the clock"}
          </button>
          <button type="button" className="btn btn-sm btn-quiet" onClick={() => { setPlaying(false); setHours(0); }} data-testid="tm-reset" disabled={hours === 0}>
            <RotateCcw className="size-4" aria-hidden />
            Reset
          </button>
          <p className="tnum ml-auto font-display text-3xl font-extrabold" style={{ fontVariationSettings: '"wdth" 112' }} data-testid="tm-clock" aria-live="off">
            {clock(hours)}
          </p>
        </div>

        <div className="relative mt-8 mb-2">
          <Slider.Root
            value={[hours]}
            onValueChange={([v]) => {
              setPlaying(false);
              setHours(v);
            }}
            min={0}
            max={MAX_HOURS}
            step={STEP}
            aria-label="Hours into the outage"
            className="relative flex h-8 w-full touch-none select-none items-center"
            data-testid="tm-slider"
          >
            <Slider.Track className="relative h-2 grow rounded-full border-[1.5px] border-ink bg-canvas-2">
              <Slider.Range className="absolute h-full rounded-full bg-signal" />
            </Slider.Track>
            <Slider.Thumb
              aria-label="Hours into the outage"
              className="block size-7 rounded-full border-2 border-ink bg-signal shadow-[0_3px_0_var(--ink)] transition-transform hover:scale-110 focus-visible:scale-110"
            />
          </Slider.Root>
          {/* the target marker */}
          <span aria-hidden className="pointer-events-none absolute -top-1 h-10 w-[3px] bg-ink" style={{ left: `calc(${(targetHours / MAX_HOURS) * 100}% - 1.5px)` }} />
        </div>
        <p className="mt-1 flex justify-between font-mono text-xs text-ink-soft" aria-hidden>
          <span>Hour 0</span>
          <span>Target: {state.profile?.days} days</span>
          <span>14 days</span>
        </p>

        <p className="mt-6 font-display text-2xl font-bold" data-testid="tm-headline" aria-live="polite">
          {story.headline}
        </p>
        <p className="text-ink-soft" data-testid="tm-detail">{story.detail}</p>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2" data-testid="tm-lines">
          {lines.map((l) => {
            const gone = l.remaining <= 0 && l.start >= 0;
            return (
              <li key={l.id} data-testid={`tm-${l.id}`} data-gone={gone ? "true" : "false"}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-semibold">{l.label}</span>
                  <span className={`tnum font-mono text-sm ${gone ? "font-semibold text-bad" : ""}`}>{gone ? "Gone" : amount(l)}</span>
                </div>
                <div className="bar mt-1.5" data-state={gone ? "empty" : l.fraction < 0.34 ? "mid" : "full"} role="img" aria-label={`${l.label}: ${Math.round(l.fraction * 100)}% left`}>
                  <span style={{ transform: `scaleX(${Math.max(0.015, l.fraction)})`, animation: "none", transition: "transform 120ms linear" }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
