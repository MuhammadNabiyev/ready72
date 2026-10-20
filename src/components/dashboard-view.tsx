"use client";

import Link from "next/link";
import { ArrowRight, Share2 } from "lucide-react";
import { alerts, nextActions, readiness, runway, suppliesDays } from "@/lib/engine";
import { CATEGORY_LABEL } from "@/lib/requirements";
import { useApp } from "@/lib/store";
import { ReadinessGauge, SupplyBar, useCountUp } from "./gauge";
import { CATEGORY_PICTOGRAM, PictoTile, StatusShape } from "./pictogram";
import { OPEN_SHARE } from "./command-palette";
import { TimeMachine } from "./time-machine";

const SEVERITY = {
  critical: { shape: "bad", label: "Critical" },
  warn: { shape: "warn", label: "Soon" },
  info: { shape: "info", label: "Note" },
} as const;

export function DashboardView() {
  const state = useApp();
  const profile = state.profile!;
  const today = new Date();
  const r = readiness(state, today);
  const days = suppliesDays(state, today);
  const actions = nextActions(state, today, 3);
  const list = alerts(state, today);

  const runwayLines = runway(state, today);
  const scale = Math.max(7, Math.ceil(Math.max(profile.days, ...runwayLines.map((l) => Math.min(l.days, 30))) / 7) * 7);

  const shownDays = useCountUp(days.overall);
  const shownScore = useCountUp(r.score);
  const covered = days.overall >= profile.days;

  return (
    <div>
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-16">
        <div>
          <p className="mono-label rise">{profile.name}</p>
          <h1 className="rise mt-3 text-[clamp(2.75rem,6.4vw,5.25rem)]" style={{ ["--d" as string]: 1 }} data-testid="headline">
            {covered ? (
              <>
                Covered for the full <span className="tnum hl">{profile.days}</span> days.
              </>
            ) : (
              <>
                Ready for <span className="tnum hl" data-testid="days-covered">{shownDays.toFixed(1)}</span> of{" "}
                <span className="tnum">{profile.days}</span> days.
              </>
            )}
          </h1>
          <p className="rise mt-6 max-w-[44ch] text-lg text-ink-soft" style={{ ["--d" as string]: 3 }} data-testid="supplies-line">
            Water lasts <strong className="tnum text-ink">{days.water}</strong> days and food lasts{" "}
            <strong className="tnum text-ink">{days.food}</strong> days at your household’s pace. Your plan counts for <strong className="text-ink">{Math.round(shownScore)}</strong> of 100.
          </p>
        </div>
        <div className="rise" style={{ ["--d" as string]: 2 }}>
          <ReadinessGauge score={r.score} level={r.level.label} />
        </div>
      </div>

      <section aria-labelledby="runway-h" className="rise mt-14" style={{ ["--d" as string]: 4 }}>
        <h2 id="runway-h" className="text-3xl">Supply runway</h2>
        <p className="mt-1 text-ink-soft">How long each supply lasts. The line marks your {profile.days}-day target. The shortest bar ends your runway.</p>
        <ul className="mt-6 space-y-3" data-testid="runway">
          {runwayLines.map((l) => {
            const frac = Math.min(1, l.days / scale);
            const met = l.days >= l.need;
            return (
              <li key={l.id} className="grid grid-cols-[7.5rem_1fr_5.5rem] items-center gap-3 sm:grid-cols-[13rem_1fr_6.5rem]" data-testid={`runway-${l.id}`}>
                <span className="text-sm leading-tight font-semibold sm:text-base">{l.label}</span>
                <div className="relative h-4 rounded-md bg-canvas-2 shadow-[inset_0_0_0_1px_var(--rule-strong)]" role="img" aria-label={`${l.label}: ${l.days} days of ${l.need} needed`}>
                  <span
                    className="absolute inset-y-0 left-0 origin-left rounded-[5px] shadow-[inset_0_-2px_0_oklch(0_0_0/0.14)]"
                    style={{ width: `${Math.max(1, frac * 100)}%`, background: met ? "var(--green)" : l.days < 1 ? "var(--red)" : "var(--yellow)", animation: "grow 800ms var(--ease-out) both" }}
                  />
                  <span aria-hidden className="absolute -inset-y-1.5 w-[3px] bg-ink" style={{ left: `calc(${(l.need / scale) * 100}% - 1.5px)` }} />
                </div>
                <span className="tnum text-right font-mono text-[0.8rem] leading-tight sm:text-sm" data-testid={`runway-days-${l.id}`}>
                  {l.days} / {l.need} d
                  <span className={`mt-0.5 block font-sans text-[0.8rem] font-bold ${met ? "text-ok" : "text-bad"}`}>{met ? "Enough" : `Short ${Math.round((l.need - l.days) * 10) / 10} d`}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 flex justify-between font-mono text-xs text-ink-soft sm:pl-[13.75rem] sm:pr-[6.75rem]" aria-hidden>
          <span>0</span>
          <span>{Math.round(scale / 2)} days</span>
          <span>{scale}</span>
        </p>
      </section>

      <TimeMachine state={state} />

      <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16">
        <div className="space-y-12">
          <section aria-labelledby="next-h" className="rise" style={{ ["--d" as string]: 4 }}>
            <h2 id="next-h" className="text-3xl">Do this next</h2>
            {actions.length === 0 ? (
              <p className="mt-4 text-lg" data-testid="no-actions">Nothing left to do. Keep it fresh and run a stress test.</p>
            ) : (
              <ol className="mt-5 divide-y divide-rule border-y border-rule-strong" data-testid="next-actions">
                {actions.map((a, i) => (
                  <li key={a.id}>
                    <Link href={a.href} className="row-hover group flex min-h-16 items-center gap-4 py-3" data-testid={`action-${a.id}`}>
                      <span className="tnum grid size-10 shrink-0 place-items-center rounded-full bg-ink font-display text-xl font-black text-canvas">{i + 1}</span>
                      <span className="flex-1 text-lg font-semibold">{a.text}</span>
                      <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="alerts-h" className="rise" style={{ ["--d" as string]: 5 }}>
            <h2 id="alerts-h" className="text-3xl">Needs attention</h2>
            {list.length === 0 ? (
              <p className="mt-4 text-lg" data-testid="no-alerts">All clear. Nothing is expired or running low.</p>
            ) : (
              <ul className="mt-5 divide-y divide-rule border-y border-rule" data-testid="alerts">
                {list.slice(0, 8).map((a) => {
                  const s = SEVERITY[a.severity];
                  return (
                    <li key={a.id}>
                      <Link href={a.href} className="row-hover flex min-h-14 items-center gap-3 py-2.5" data-testid="alert" data-severity={a.severity}>
                        <StatusShape kind={s.shape} className="size-7" />
                        <span className="sr-only">{s.label}:</span>
                        <span className="flex-1">{a.text}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {list.length > 8 && <p className="mt-3 text-ink-soft">and {list.length - 8} more in your kit.</p>}
          </section>
        </div>

        <section aria-labelledby="cats-h" className="rise" style={{ ["--d" as string]: 5 }}>
          <h2 id="cats-h" className="text-3xl">Where you stand</h2>
          <ul className="mt-5 space-y-1.5" data-testid="categories">
            {r.parts.map((p) => {
              const pct = Math.round(p.fraction * 100);
              return (
                <li key={p.key}>
                  <Link href={p.key === "plan" ? "/plan" : "/kit"} className="row-hover flex items-center gap-3 py-1" data-testid={`cat-${p.key}`}>
                    <PictoTile name={CATEGORY_PICTOGRAM[p.key]} className="size-9 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex items-baseline justify-between">
                        <span className="font-bold">{p.key === "plan" ? "Family plan" : CATEGORY_LABEL[p.key]}</span>
                        <span className="tnum font-mono text-sm font-semibold">{pct}%</span>
                      </div>
                      <SupplyBar fraction={p.fraction} label={`${p.label} ${pct}%`} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/stress-test" className="btn btn-primary w-full sm:w-auto" data-testid="to-stress">
              Run a stress test
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <button type="button" className="btn w-full sm:w-auto" onClick={() => window.dispatchEvent(new Event(OPEN_SHARE))} data-testid="share-score">
              <Share2 className="size-4" aria-hidden />
              Share my score
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
