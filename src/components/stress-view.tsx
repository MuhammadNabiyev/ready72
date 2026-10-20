"use client";

import * as RadioGroup from "@radix-ui/react-radio-group";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, RotateCw, X } from "lucide-react";
import { SCENARIOS, evaluateScenario, type Check as CheckResult, type Scenario } from "@/lib/engine";
import { useApp } from "@/lib/store";
import { PageTitle } from "./ui";

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function StressView() {
  const state = useApp();
  const [id, setId] = useState(SCENARIOS[0].id);
  const [run, setRun] = useState(0);

  const scenario = SCENARIOS.find((s) => s.id === id)!;
  const result = useMemo(() => evaluateScenario(state, scenario, new Date()), [state, scenario]);

  return (
    <div>
      <PageTitle title="Stress test">
        Pick a scenario and Ready72 checks your kit and plan against it, line by line.
      </PageTitle>

      <div className="mt-10 grid gap-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-16">
        <RadioGroup.Root value={id} onValueChange={setId} aria-label="Scenario" className="space-y-3" data-testid="scenarios">
          {SCENARIOS.map((s) => {
            const r = evaluateScenario(state, s, new Date());
            return (
              <RadioGroup.Item
                key={s.id}
                value={s.id}
                data-testid={`scenario-${s.id}`}
                className="w-full rounded border-2 border-ink bg-paper p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_0_var(--ink)] data-[state=checked]:bg-ink data-[state=checked]:text-canvas"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="font-display text-xl font-bold leading-tight" style={{ fontVariationSettings: '"wdth" 110' }}>{s.name}</span>
                  <span className={`tnum shrink-0 rounded-sm px-2 py-0.5 font-mono text-xs font-semibold ${r.passed ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"}`}>
                    {r.okCount}/{r.checks.length}
                  </span>
                </span>
                <span className="mt-1 block text-sm opacity-80">{s.summary}</span>
              </RadioGroup.Item>
            );
          })}
        </RadioGroup.Root>

        <section aria-labelledby="result-h" aria-live="polite" data-testid="result">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="result-h" className="text-3xl">{scenario.name}</h2>
            <button type="button" className="btn btn-sm" onClick={() => setRun((n) => n + 1)} data-testid="rerun">
              <RotateCw className="size-4" aria-hidden />
              Run again
            </button>
          </div>
          {/* the key restarts the reveal whenever the scenario, the run or the kit changes */}
          <Reveal key={`${id}-${run}-${result.okCount}-${result.checks.length}`} scenario={scenario} checks={result.checks} passed={result.passed} okCount={result.okCount} />
        </section>
      </div>
    </div>
  );
}

function Reveal({ scenario, checks, passed, okCount }: { scenario: Scenario; checks: CheckResult[]; passed: boolean; okCount: number }) {
  const total = checks.length;
  const [ticks, setTicks] = useState(0);
  const reduced = prefersReduced();

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setTicks((n) => n + 1), 110);
    return () => clearInterval(t);
  }, [reduced]);

  const shown = reduced ? total : Math.min(total, ticks);
  const done = shown >= total;
  const failed = checks.filter((c) => !c.ok).length;

  return (
    <>
      <ul className="mt-6 divide-y divide-rule border-y-2 border-ink" data-testid="checks">
        {checks.slice(0, shown).map((c) => (
          <li key={c.id} className="reveal flex items-center gap-4 py-3" data-testid={`check-${c.id}`} data-ok={c.ok ? "true" : "false"}>
            <span className={`stamp grid size-8 shrink-0 place-items-center rounded-full ${c.ok ? "bg-ok text-paper" : "bg-bad text-paper"}`}>
              {c.ok ? <Check className="size-4" strokeWidth={3} aria-label="Pass" /> : <X className="size-4" strokeWidth={3} aria-label="Fail" />}
            </span>
            <span className="flex-1 font-semibold">{c.label}</span>
            <span className="tnum text-right font-mono text-sm text-ink-soft">{c.detail}</span>
          </li>
        ))}
      </ul>

      {done && (
        <div
          className={`stamp mt-8 rounded border-2 p-5 ${passed ? "border-ok bg-ok-soft" : "border-bad bg-bad-soft"}`}
          data-testid="verdict"
          data-passed={passed ? "true" : "false"}
        >
          <p className={`font-display text-4xl font-extrabold ${passed ? "text-ok" : "text-bad"}`} style={{ fontVariationSettings: '"wdth" 118' }}>
            {passed ? "Pass" : "Not yet"}
          </p>
          <p className="mt-1 text-lg">
            {passed ? "Your household can handle this scenario." : `${okCount} of ${total} checks passed. ${failed} to fix.`}
          </p>
          {!passed && (
            <Link href={scenario.goBag ? "/kit" : "/shopping"} className="btn btn-primary mt-4" data-testid="fix-link">
              {scenario.goBag ? "Pack the go-bag in My kit" : "See what to buy"}
            </Link>
          )}
        </div>
      )}
    </>
  );
}
