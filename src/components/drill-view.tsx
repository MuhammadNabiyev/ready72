"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Play, RotateCcw, Square } from "lucide-react";
import { DRILL_LIMIT_SECONDS, bestRun, compareToLast, drillSteps, elapsedSeconds, formatClock, isComplete, recordRun, remainingSeconds, type Verdict } from "@/lib/drill";
import { dayKey } from "@/lib/engine";
import { getState, setState, useApp } from "@/lib/store";
import { fmtDate } from "./date-picker";
import { Pictogram } from "./pictogram";
import { PageTitle, toast } from "./ui";

type Phase = "ready" | "running" | "done";
type Result = { seconds: number; done: number; total: number; verdict: Verdict; personalBest: boolean; compare: string | null };

const SIGN: Record<Verdict["key"], string> = {
  outstanding: "sign-green",
  solid: "sign-green",
  "made-it": "sign-yellow",
  "too-slow": "sign-red",
  incomplete: "sign-yellow",
};

/** A guided 15-minute evacuation drill: a live countdown, a personalised checklist, a saved best time. */
export function DrillView() {
  const state = useApp();
  const steps = useMemo(() => drillSteps(state), [state]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const startMs = useRef(0);

  useEffect(() => {
    if (phase !== "running") return;
    const tick = () => setElapsed(elapsedSeconds(startMs.current, Date.now()));
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase]);

  const best = bestRun(state.drillRuns);
  const left = remainingSeconds(elapsed);
  const over = Math.max(0, elapsed - DRILL_LIMIT_SECONDS);
  const urgent = phase === "running" && left <= 180;
  const doneCount = steps.filter((s) => checked.has(s.id)).length;

  function start() {
    startMs.current = Date.now();
    setElapsed(0);
    setChecked(new Set());
    setResult(null);
    setPhase("running");
  }

  function finish() {
    const seconds = Math.max(1, elapsedSeconds(startMs.current, Date.now()));
    const current = getState();
    const compare = compareToLast(current.drillRuns, seconds);
    const res = recordRun(current, { seconds, stepsDone: doneCount, stepsTotal: steps.length }, dayKey(new Date()));
    setState(res.state);
    setElapsed(seconds);
    setResult({ seconds, done: doneCount, total: steps.length, verdict: res.verdict, personalBest: res.personalBest, compare });
    setPhase("done");
    toast(res.personalBest ? "New best time" : isComplete({ stepsDone: doneCount, stepsTotal: steps.length }) ? "Drill logged. Nice work" : "Run saved. Finish every step to count it as a drill");
  }

  function toggle(id: string) {
    if (phase !== "running") return;
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const tone = phase === "done" && result ? SIGN[result.verdict.key] : urgent ? "sign-red" : "sign-black";

  return (
    <div>
      <PageTitle title="Evacuation drill">
        You have about fifteen minutes when the order comes. Run it once with the clock on, and you will know the real number.
      </PageTitle>

      <div className="mt-10 grid items-start gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div>
          <div className={`sign ${tone} px-8 pt-9 pb-9 text-center shadow-[var(--shadow-soft)]`} data-testid="drill-sign" data-phase={phase}>
            <Pictogram name="timer" className="mx-auto size-14" />
            <p className="mt-4 text-sm font-extrabold tracking-[0.16em] uppercase" data-testid="drill-caption">
              {phase === "ready" && "Time you have"}
              {phase === "running" && (over > 0 ? "Over the limit by" : "Time left")}
              {phase === "done" && "Your time"}
            </p>
            <p className="tnum mt-2 text-[clamp(4.25rem,11vw,6.5rem)] leading-[0.9] font-black tracking-[-0.04em]" data-testid="drill-clock" aria-live="off">
              {phase === "ready" && formatClock(DRILL_LIMIT_SECONDS)}
              {phase === "running" && formatClock(over > 0 ? over : left)}
              {phase === "done" && result && formatClock(result.seconds)}
            </p>
            {phase === "running" && (
              <p className="mt-3 text-lg font-bold" data-testid="drill-progress">
                {doneCount} of {steps.length} steps · {formatClock(elapsed)} elapsed
              </p>
            )}
            {phase === "done" && result && (
              <div className="mt-3" data-testid="drill-result" role="status">
                <p className="text-2xl font-black" data-testid="drill-verdict">{result.verdict.label}</p>
                <p className="mx-auto mt-1 max-w-[30ch] text-lg">{result.verdict.detail}</p>
                {result.personalBest && <p className="mt-3 inline-block rounded-md bg-white/20 px-3 py-1 font-extrabold tracking-wide uppercase" data-testid="drill-pb">New best time</p>}
                {result.compare && <p className="mt-2 font-bold" data-testid="drill-compare">{result.compare}</p>}
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {phase === "ready" && (
              <button type="button" className="btn btn-primary min-h-14 px-7 text-lg" onClick={start} data-testid="drill-start">
                <Play className="size-5" aria-hidden />
                Start the clock
              </button>
            )}
            {phase === "running" && (
              <button type="button" className="btn btn-primary min-h-14 px-7 text-lg" onClick={finish} data-testid="drill-finish">
                <Square className="size-5" aria-hidden />
                {doneCount === steps.length ? "Finish" : `Stop and save (${doneCount} of ${steps.length})`}
              </button>
            )}
            {phase === "done" && (
              <>
                <button type="button" className="btn btn-primary min-h-14 px-7 text-lg" onClick={start} data-testid="drill-again">
                  <RotateCcw className="size-5" aria-hidden />
                  Run it again
                </button>
                <Link href="/plan" className="btn min-h-14 px-6 text-lg" data-testid="drill-to-plan">
                  Family plan
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </>
            )}
          </div>

          <div className="mt-10" data-testid="drill-best">
            <h2 className="text-2xl">Best time</h2>
            {best ? (
              <p className="mt-2">
                <span className="tnum text-5xl font-black tracking-[-0.03em]" data-testid="drill-best-time">{formatClock(best.seconds)}</span>
                <span className="ml-3 text-ink-soft">on {fmtDate(best.date)}</span>
              </p>
            ) : (
              <p className="mt-2 text-ink-soft" data-testid="drill-no-best">No finished run yet. Complete every step to set the time to beat.</p>
            )}
            {state.drillRuns.length > 0 && (
              <ul className="mt-4 divide-y divide-rule border-y border-rule" data-testid="drill-history">
                {state.drillRuns.slice(0, 5).map((r, i) => (
                  <li key={`${r.date}-${i}`} className="flex items-baseline justify-between gap-3 py-2">
                    <span className="text-ink-soft">{fmtDate(r.date)}</span>
                    <span className="tnum font-bold">{formatClock(r.seconds)}</span>
                    <span className="tnum w-20 text-right text-sm text-ink-soft">{r.stepsDone}/{r.stepsTotal} steps</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <section aria-labelledby="steps-h">
          <h2 id="steps-h" className="text-3xl">Your steps</h2>
          <p className="mt-1 text-ink-soft" data-testid="drill-hint">
            {phase === "ready" ? "Read them first. Tap each one as you really do it." : phase === "running" ? "Tap a step when it is done." : "Tap Run it again to beat your time."}
          </p>
          <ol className="mt-5 divide-y divide-rule border-y border-rule-strong" data-testid="drill-steps">
            {steps.map((s, i) => {
              const done = checked.has(s.id);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={done}
                    disabled={phase !== "running"}
                    onClick={() => toggle(s.id)}
                    data-testid={`drill-step-${s.id}`}
                    className="row-hover flex min-h-[4.5rem] w-full items-center gap-4 py-3 text-left disabled:cursor-default"
                  >
                    <span
                      aria-hidden
                      className={`grid size-9 shrink-0 place-items-center rounded-md border-2 transition-colors ${done ? "border-green bg-green text-on-signal" : "border-ink text-ink-soft"}`}
                    >
                      {done ? <Pictogram name="check" className="size-5" /> : <span className="tnum text-sm font-black">{i + 1}</span>}
                    </span>
                    <Pictogram name={s.icon} className="size-7 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-lg font-bold ${done ? "line-through decoration-2 opacity-60" : ""}`}>{s.label}</span>
                      <span className="block text-sm text-ink-soft">{s.hint}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}
