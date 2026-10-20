import { SCENARIOS, haveFor, inSentence, readiness, runway, suppliesDays, uid } from "./engine";
import { baseDailyWater, buildRequirements, dailyKcal } from "./requirements";
import type { Scenario, State } from "./types";

/* ------------------------------------------------------------------ */
/* time machine: what is left after N hours without outside help       */
/* ------------------------------------------------------------------ */

export type TimelineLine = {
  id: string;
  label: string;
  unit: string;
  start: number;
  remaining: number;
  /** 0..1 of what you started with */
  fraction: number;
  /** hour at which it hits zero, or null if it never does within `horizon` */
  endsAtHour: number | null;
  /** hour of the target (days * 24) */
  needHours: number;
};

/** Remaining amount of each perishable supply `hours` hours into an outage. Water, food and "days of supply" items. */
export function supplyTimeline(state: State, today: Date, hours: number): TimelineLine[] {
  const p = state.profile;
  if (!p) return [];
  const water = haveFor({ id: "water", kind: "water" } as never, state.entries, today);
  const kcal = haveFor({ id: "food", kind: "food" } as never, state.entries, today);
  const dw = baseDailyWater(p) * (p.hazards.includes("heat") ? 1.25 : 1);
  const dk = dailyKcal(p);
  const needHours = p.days * 24;

  const line = (id: string, label: string, unit: string, start: number, perHour: number): TimelineLine => {
    const used = perHour * hours;
    const remaining = Math.max(0, start - used);
    return {
      id,
      label,
      unit,
      start,
      remaining,
      fraction: start > 0 ? remaining / start : 0,
      endsAtHour: perHour > 0 ? Math.round((start / perHour) * 10) / 10 : null,
      needHours,
    };
  };

  const lines: TimelineLine[] = [
    line("water", "Water", "L", water, dw / 24),
    line("food", "Food", "kcal", kcal, dk / 24),
  ];
  for (const r of buildRequirements(p)) {
    if (r.kind !== "days") continue;
    const have = haveFor(r, state.entries, today);
    lines.push(line(r.id, r.label, "days", have, 1 / 24));
  }
  return lines;
}

export type Narration = { headline: string; detail: string };

/** One sentence about the first supply to run out by `hours`, or the next one that will. */
export function narrate(lines: TimelineLine[], hours: number): Narration {
  const gone = lines.filter((l) => l.endsAtHour !== null && l.endsAtHour <= hours).sort((a, b) => (a.endsAtHour ?? 0) - (b.endsAtHour ?? 0));
  const next = lines.filter((l) => l.endsAtHour !== null && l.endsAtHour > hours).sort((a, b) => (a.endsAtHour ?? 0) - (b.endsAtHour ?? 0))[0];
  const when = (h: number) => `day ${Math.floor(h / 24) + 1}, ${String(Math.floor(h % 24)).padStart(2, "0")}:00`;
  if (gone.length) {
    const first = gone[0];
    return {
      headline: `${first.label} ran out on ${when(first.endsAtHour as number)}.`,
      detail: gone.length > 1 ? `${gone.length} supplies are gone by now.` : next ? `Next: ${inSentence(next.label)} runs out on ${when(next.endsAtHour as number)}.` : "Everything else is still holding.",
    };
  }
  if (next) return { headline: "Everything is still holding.", detail: `First to run out: ${inSentence(next.label)} on ${when(next.endsAtHour as number)}.` };
  return { headline: "Everything is still holding.", detail: "No supply has a limit yet. Add some to your kit." };
}

/* ------------------------------------------------------------------ */
/* custom stress-test scenarios                                        */
/* ------------------------------------------------------------------ */

export type ScenarioDraft = {
  name: string;
  days: number;
  hot: boolean;
  goBag: boolean;
  extras: string[];
  needsContact: boolean;
  needsOutsidePoint: boolean;
};

export type ScenarioErrors = Partial<Record<"name" | "days", string>>;

export function validateScenarioDraft(d: ScenarioDraft): ScenarioErrors {
  const e: ScenarioErrors = {};
  if (!d.name.trim()) e.name = "Give the scenario a name";
  else if (d.name.trim().length > 60) e.name = "Keep the name under 60 characters";
  if (!Number.isInteger(d.days) || d.days < 1 || d.days > 30) e.days = "Between 1 and 30 days";
  return e;
}

export function makeScenario(d: ScenarioDraft): Scenario {
  const parts = [`${d.days} ${d.days === 1 ? "day" : "days"}`];
  if (d.hot) parts.push("extreme heat");
  if (d.goBag) parts.push("go-bag only");
  return {
    id: uid("sc"),
    name: d.name.trim(),
    summary: `Your own scenario: ${parts.join(", ")}.`,
    days: d.days,
    waterMult: d.hot ? 1.25 : 1,
    goBag: d.goBag,
    extras: d.extras,
    needsContact: d.needsContact,
    needsOutsidePoint: d.needsOutsidePoint,
    custom: true,
  };
}

export const allScenarios = (state: State): Scenario[] => [...SCENARIOS, ...state.scenarios];

export function addScenario(state: State, s: Scenario): State {
  return { ...state, scenarios: [...state.scenarios, s] };
}

export const removeScenario = (state: State, id: string): State => ({ ...state, scenarios: state.scenarios.filter((s) => s.id !== id) });

/* ------------------------------------------------------------------ */
/* share card                                                          */
/* ------------------------------------------------------------------ */

export type ShareCard = {
  household: string;
  score: number;
  level: string;
  daysCovered: number;
  target: number;
  weakest: string | null;
  text: string;
};

export function shareCard(state: State, today: Date): ShareCard {
  const p = state.profile;
  const r = readiness(state, today);
  const d = suppliesDays(state, today);
  const short = runway(state, today)[0];
  const household = p?.name || "My household";
  const target = p?.days ?? 3;
  const weakest = short ? inSentence(short.label) : null;
  const text = `${household} can last ${d.overall} of ${target} days. Readiness ${r.score}/100 (${r.level.label}). ${
    weakest ? `The weak spot: ${weakest}. ` : ""
  }How long could yours? #Ready72`;
  return { household, score: r.score, level: r.level.label, daysCovered: d.overall, target, weakest, text };
}
