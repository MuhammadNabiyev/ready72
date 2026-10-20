"use client";

import * as RadioGroup from "@radix-ui/react-radio-group";
import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { validateProfile } from "@/lib/actions";
import { HAZARDS, buildRequirements, dailyKcal, dailyWater, people } from "@/lib/requirements";
import { HAZARD_IDS, type HazardId, type Profile, type TargetDays } from "@/lib/types";
import { HAZARD_PICTOGRAM, Pictogram } from "./pictogram";
import { Field, Stepper } from "./ui";

const LEGEND = "flex items-center gap-3 font-display text-2xl font-extrabold sm:text-3xl";

export const DEFAULT_PROFILE: Profile = {
  name: "",
  adults: 2,
  children: 0,
  infants: 0,
  pets: 0,
  days: 3,
  hazards: [],
  meds: false,
  mobility: false,
};

const DAYS: { value: TargetDays; title: string; text: string }[] = [
  { value: 3, title: "3 days", text: "The standard minimum: 72 hours on your own." },
  { value: 7, title: "7 days", text: "Safer for storm, snow or remote areas." },
  { value: 14, title: "14 days", text: "For long disruptions. A big step up." },
];

export function HouseholdForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: Profile;
  submitLabel: string;
  onSubmit: (p: Profile) => void;
}) {
  const [p, setP] = useState<Profile>(initial);
  const [errors, setErrors] = useState<ReturnType<typeof validateProfile>>({});
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));

  const preview = useMemo(() => {
    const ok = Object.keys(validateProfile(p)).length === 0;
    if (!ok) return null;
    const reqs = buildRequirements(p);
    return {
      water: Math.ceil(dailyWater(p) * p.days),
      kcal: dailyKcal(p) * p.days,
      items: reqs.length,
      critical: reqs.filter((r) => r.critical).length,
    };
  }, [p]);

  const toggleHazard = (h: HazardId) =>
    set("hazards", p.hazards.includes(h) ? p.hazards.filter((x) => x !== h) : [...p.hazards, h]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateProfile(p);
    setErrors(err);
    if (Object.keys(err).length) return;
    onSubmit(p);
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16" data-testid="household-form">
      <div className="space-y-12">
        <fieldset>
          <legend className={LEGEND}><span className="step-tag" aria-hidden>1</span>Who lives with you?</legend>
          <div className="mt-5 max-w-sm">
            <Field label="Household name (optional)" htmlFor="hh-name">
              <input id="hh-name" className="input" value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. The Alvarez family" data-testid="hh-name" maxLength={60} />
            </Field>
          </div>
          <div className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {(
              [
                ["adults", "Adults", "Aged 13 and over", 1, 10],
                ["children", "Children", "Aged 2 to 12", 0, 10],
                ["infants", "Infants", "Under 2", 0, 5],
                ["pets", "Pets", "Dogs, cats and others", 0, 10],
              ] as const
            ).map(([key, label, sub, min, max]) => (
              <div key={key} className="flex items-center justify-between gap-4 border-b border-rule pb-4">
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-sm text-ink-soft">{sub}</p>
                  {errors[key] && <p className="field-error" role="alert">{errors[key]}</p>}
                </div>
                <Stepper label={label.toLowerCase()} value={p[key]} min={min} max={max} onChange={(n) => set(key, n)} testId={`hh-${key}`} />
              </div>
            ))}
          </div>
          {errors.total && <p className="field-error" role="alert">{errors.total}</p>}
        </fieldset>

        <fieldset>
          <legend className={LEGEND}><span className="step-tag" aria-hidden>2</span>What could hit you?</legend>
          <p className="mt-2 text-ink-soft sm:pl-[3.1rem]">Pick every hazard that is realistic where you live. Each one adds its own gear.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {HAZARD_IDS.map((h) => {
              const on = p.hazards.includes(h);
              return (
                <button
                  key={h}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleHazard(h)}
                  data-testid={`hazard-${h}`}
                  className="group relative flex min-h-24 items-start gap-4 rounded-xl border border-rule-strong bg-paper p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-ink hover:shadow-[var(--shadow-soft)] aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-canvas"
                >
                  <span aria-hidden className={`grid size-12 shrink-0 place-items-center rounded-lg transition-colors duration-200 ${on ? "bg-yellow text-[oklch(0.25_0.03_170)]" : "bg-canvas-2 text-ink"}`}>
                    <Pictogram name={HAZARD_PICTOGRAM[h]} className="size-7" />
                  </span>
                  <span className="min-w-0 flex-1 pr-6">
                    <span className="block text-lg font-bold">{HAZARDS[h].label}</span>
                    <span className={`block text-sm ${on ? "text-canvas/80" : "text-ink-soft"}`}>{HAZARDS[h].blurb}</span>
                  </span>
                  <span aria-hidden className={`absolute top-3 right-3 grid size-5 place-items-center rounded-md border-2 ${on ? "border-yellow bg-yellow text-[oklch(0.25_0.03_170)]" : "border-ink-soft"}`}>
                    {on && <Check className="stamp size-3.5" strokeWidth={3.5} />}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className={LEGEND}><span className="step-tag" aria-hidden>3</span>Anything we should plan around?</legend>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" className="chip" aria-pressed={p.meds} onClick={() => set("meds", !p.meds)} data-testid="need-meds">
              Someone takes daily medication
            </button>
            <button type="button" className="chip" aria-pressed={p.mobility} onClick={() => set("mobility", !p.mobility)} data-testid="need-mobility">
              Someone needs mobility help
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend className={LEGEND}><span className="step-tag" aria-hidden>4</span>How long do you want to last?</legend>
          <RadioGroup.Root value={String(p.days)} onValueChange={(v) => set("days", Number(v) as TargetDays)} aria-label="Target days" className="mt-5 grid gap-3 sm:grid-cols-3" data-testid="days-group">
            {DAYS.map((d) => (
              <RadioGroup.Item
                key={d.value}
                value={String(d.value)}
                data-testid={`days-${d.value}`}
                className="rounded-xl border border-rule-strong bg-paper p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-ink hover:shadow-[var(--shadow-soft)] data-[state=checked]:border-transparent data-[state=checked]:bg-signal data-[state=checked]:text-on-signal data-[state=checked]:shadow-[inset_0_-3px_0_oklch(0_0_0/0.2),var(--shadow-soft)]"
              >
                <span className="block font-display text-2xl font-extrabold">{d.title}</span>
                <span className="mt-1 block text-sm">{d.text}</span>
              </RadioGroup.Item>
            ))}
          </RadioGroup.Root>
        </fieldset>

        <button type="submit" className="btn btn-primary min-h-14 w-full text-lg sm:w-auto sm:px-10" data-testid="hh-submit">
          {submitLabel}
        </button>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="What this means">
        <div className="sign sign-green px-8 py-9 shadow-[var(--shadow-soft)]">
          <p className="text-xs font-extrabold tracking-[0.16em] uppercase">Your {p.days}-day target</p>
          {preview ? (
            <dl className="mt-5 space-y-5" data-testid="preview">
              <div>
                <dt className="flex items-center gap-2 text-sm font-bold"><Pictogram name="water" className="size-4" />Drinking water</dt>
                <dd className="tnum font-display text-[2.5rem] leading-none font-black" data-testid="preview-water">{preview.water} L</dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-sm font-bold"><Pictogram name="food" className="size-4" />Food energy</dt>
                <dd className="tnum font-display text-[2.5rem] leading-none font-black" data-testid="preview-kcal">{preview.kcal.toLocaleString("en-US")}{" "}<span className="text-xl font-extrabold">kcal</span></dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-sm font-bold"><Pictogram name="docs" className="size-4" />Checklist</dt>
                <dd className="mt-1 text-lg font-bold" data-testid="preview-items">{preview.items} items, {preview.critical} critical</dd>
              </div>
              <p className="border-t-2 border-current/40 pt-4 text-sm font-semibold">
                For {people(p)} {people(p) === 1 ? "person" : "people"}
                {p.pets > 0 ? ` and ${p.pets} ${p.pets === 1 ? "pet" : "pets"}` : ""}. Updates as you change the form.
              </p>
            </dl>
          ) : (
            <p className="mt-5 text-lg font-bold">Fix the highlighted counts to see your target.</p>
          )}
        </div>
      </aside>
    </form>
  );
}
