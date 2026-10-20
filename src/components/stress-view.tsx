"use client";

import * as RadioGroup from "@radix-ui/react-radio-group";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, RotateCw, Trash2 } from "lucide-react";
import { evaluateScenario, type Check as CheckResult, type Scenario } from "@/lib/engine";
import { addScenario, allScenarios, makeScenario, removeScenario, validateScenarioDraft, type ScenarioErrors } from "@/lib/features";
import { buildRequirements } from "@/lib/requirements";
import { commit, useApp } from "@/lib/store";
import { StatusShape } from "./pictogram";
import { Field, Modal, PageTitle, Stepper, toast } from "./ui";

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function StressView() {
  const state = useApp();
  const scenarios = allScenarios(state);
  const [id, setId] = useState(scenarios[0].id);
  const [run, setRun] = useState(0);
  const [creating, setCreating] = useState(false);

  const scenario = scenarios.find((s) => s.id === id) ?? scenarios[0];
  const result = evaluateScenario(state, scenario, new Date());

  return (
    <div>
      <PageTitle title="Stress test">
        Pick a scenario and Ready72 checks your kit and plan against it, line by line.
      </PageTitle>

      <div className="mt-10 grid gap-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-16">
        <RadioGroup.Root value={id} onValueChange={setId} aria-label="Scenario" className="space-y-3" data-testid="scenarios">
          {scenarios.map((s) => {
            const r = evaluateScenario(state, s, new Date());
            return (
              <div key={s.id} className="relative">
              <RadioGroup.Item
                value={s.id}
                data-testid={`scenario-${s.id}`}
                className="w-full rounded-xl border border-rule-strong bg-paper p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] data-[state=checked]:bg-ink data-[state=checked]:text-canvas"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="font-display text-xl font-bold leading-tight">{s.name}</span>
                  <span className={`tnum shrink-0 rounded-sm px-2 py-0.5 font-mono text-xs font-semibold ${r.passed ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"}`}>
                    {r.okCount}/{r.checks.length}
                  </span>
                </span>
                <span className="mt-1 block text-sm opacity-80">{s.summary}</span>
              </RadioGroup.Item>
              {s.custom && (
                <button
                  type="button"
                  aria-label={`Delete scenario ${s.name}`}
                  data-testid={`delete-scenario-${s.id}`}
                  onClick={() => {
                    commit((st) => removeScenario(st, s.id));
                    toast("Scenario deleted");
                  }}
                  className="absolute right-2 bottom-2 grid size-9 place-items-center rounded-lg border border-transparent text-bad hover:border-bad hover:bg-paper"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              )}
              </div>
            );
          })}
          <button type="button" className="btn w-full" onClick={() => setCreating(true)} data-testid="create-scenario">
            <Plus className="size-4" aria-hidden />
            Create your own scenario
          </button>
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
          <Reveal key={`${scenario.id}-${run}-${result.okCount}-${result.checks.length}`} scenario={scenario} checks={result.checks} passed={result.passed} okCount={result.okCount} />
        </section>
      </div>
      {creating && (
        <ScenarioDialog
          onClose={() => setCreating(false)}
          onCreate={(sc) => {
            commit((st) => addScenario(st, sc));
            setId(sc.id);
            toast(`Added ${sc.name}`);
          }}
        />
      )}
    </div>
  );
}

function ScenarioDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (s: Scenario) => void }) {
  const state = useApp();
  const reqs = buildRequirements(state.profile!).filter((r) => r.id !== "water" && r.id !== "food");
  const [name, setName] = useState("");
  const [days, setDays] = useState(3);
  const [hot, setHot] = useState(false);
  const [goBag, setGoBag] = useState(false);
  const [extras, setExtras] = useState<string[]>([]);
  const [needsContact, setNeedsContact] = useState(false);
  const [needsOutsidePoint, setNeedsOutsidePoint] = useState(false);
  const [errors, setErrors] = useState<ScenarioErrors>({});

  const toggle = (id: string) => setExtras((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const draft = { name, days, hot, goBag, extras, needsContact, needsOutsidePoint };
    const err = validateScenarioDraft(draft);
    setErrors(err);
    if (Object.keys(err).length) return;
    onCreate(makeScenario(draft));
    onClose();
  }

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title="Create your own scenario" description="Name it, set how long it lasts, and pick what you must have on hand. Ready72 will test your kit against it." testId="scenario-dialog" wide>
      <form onSubmit={submit} noValidate className="space-y-6">
        <Field label="Scenario name" htmlFor="sc-name" error={errors.name}>
          <input id="sc-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ice storm at the cabin" aria-invalid={!!errors.name} data-testid="sc-name" maxLength={80} autoFocus />
        </Field>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <div>
            <p className="field-label">How many days?</p>
            <Stepper label="days" value={days} min={1} max={30} onChange={setDays} testId="sc-days" />
            {errors.days && <p className="field-error" role="alert">{errors.days}</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="chip" aria-pressed={hot} onClick={() => setHot(!hot)} data-testid="sc-hot">Extreme heat (+25% water)</button>
            <button type="button" className="chip" aria-pressed={goBag} onClick={() => setGoBag(!goBag)} data-testid="sc-gobag">Go-bag only</button>
          </div>
        </div>
        <fieldset>
          <legend className="field-label">Must also have</legend>
          <div className="mt-2 flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1" data-testid="sc-extras">
            {reqs.map((r) => (
              <button key={r.id} type="button" className="chip min-h-9 text-sm" aria-pressed={extras.includes(r.id)} onClick={() => toggle(r.id)} data-testid={`sc-extra-${r.id}`}>
                {r.label}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="chip" aria-pressed={needsContact} onClick={() => setNeedsContact(!needsContact)} data-testid="sc-contact">Needs an emergency contact</button>
          <button type="button" className="chip" aria-pressed={needsOutsidePoint} onClick={() => setNeedsOutsidePoint(!needsOutsidePoint)} data-testid="sc-point">Needs a meeting point away from home</button>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" data-testid="sc-save">Create scenario</button>
        </div>
      </form>
    </Modal>
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
      <ul className="mt-6 divide-y divide-rule border-y border-rule-strong" data-testid="checks">
        {checks.slice(0, shown).map((c) => (
          <li key={c.id} className="reveal flex items-center gap-4 py-3" data-testid={`check-${c.id}`} data-ok={c.ok ? "true" : "false"}>
            <span className="stamp"><StatusShape kind={c.ok ? "ok" : "bad"} className="size-8" label={c.ok ? "Pass" : "Fail"} /></span>
            <span className="flex-1 font-semibold">{c.label}</span>
            <span className="tnum text-right font-mono text-sm text-ink-soft">{c.detail}</span>
          </li>
        ))}
      </ul>

      {done && (
        <div
          className={`stamp mt-8 rounded-xl border p-5 ${passed ? "border-ok bg-ok-soft" : "border-bad bg-bad-soft"}`}
          data-testid="verdict"
          data-passed={passed ? "true" : "false"}
        >
          <p className={`font-display text-4xl font-extrabold ${passed ? "text-ok" : "text-bad"}`}>
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
