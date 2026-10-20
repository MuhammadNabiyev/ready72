import { logDrill } from "./actions";
import type { DrillRun, State } from "./types";

/** An evacuation order gives you about a quarter of an hour. */
export const DRILL_LIMIT_SECONDS = 15 * 60;
const MAX_RUNS = 50;

/* ------------------------------------------------------------------ */
/* steps, personalised from the household                              */
/* ------------------------------------------------------------------ */

export type DrillStep = { id: string; label: string; hint: string; icon: "bag" | "power" | "pets" | "meds" | "docs" | "plan" | "shield" | "health" };

export function drillSteps(state: State): DrillStep[] {
  const p = state.profile;
  const bagItems = state.entries.filter((e) => e.goBag).length;
  const meeting = state.points.find((m) => m.kind !== "home") ?? state.points[0];
  const steps: DrillStep[] = [];

  if (p?.mobility) steps.push({ id: "mobility", label: "Help the person who needs mobility support first", hint: "Wheelchair, walker, cane or a carrying partner.", icon: "health" });
  steps.push({
    id: "gobag",
    label: "Grab the go-bag",
    hint: bagItems > 0 ? `${bagItems} ${bagItems === 1 ? "item is" : "items are"} flagged as go-bag in your kit.` : "Nothing is flagged as go-bag yet. Flag items in your kit.",
    icon: "bag",
  });
  steps.push({ id: "shutoff", label: "Shut off gas, water and power", hint: "Only if it is safe and you know how. Never relight a pilot light yourself.", icon: "power" });
  if (p && p.pets > 0) steps.push({ id: "pets", label: p.pets === 1 ? "Gather your pet and its carrier" : "Gather your pets and their carriers", hint: "Leash, carrier, food and vaccination papers.", icon: "pets" });
  if (p?.meds) steps.push({ id: "meds", label: "Take medications and the medication list", hint: "At least three days of every prescription.", icon: "meds" });
  steps.push({ id: "docs", label: "Documents, phones, chargers, keys, cash", hint: "ID copies, insurance papers, the power bank.", icon: "docs" });
  steps.push({ id: "headcount", label: "Count everyone out of the door", hint: "Say each name out loud. Lock up and leave.", icon: "shield" });
  steps.push({
    id: "meeting",
    label: "Walk to the meeting point",
    hint: meeting ? `${meeting.label}${meeting.address ? `, ${meeting.address}` : ""}.` : "You have not picked one yet. Add it in the family plan.",
    icon: "plan",
  });
  return steps;
}

/* ------------------------------------------------------------------ */
/* clock                                                               */
/* ------------------------------------------------------------------ */

/** Whole seconds between two timestamps; never negative, so a clock set back cannot show a negative time. */
export const elapsedSeconds = (startMs: number, nowMs: number) => Math.max(0, Math.floor((nowMs - startMs) / 1000));

export const remainingSeconds = (elapsed: number, limit = DRILL_LIMIT_SECONDS) => Math.max(0, limit - Math.max(0, elapsed));

/** 0 -> "00:00", 65 -> "01:05", 3725 -> "1:02:05". Fractions round down. */
export function formatClock(seconds: number): string {
  const s = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${String(m).padStart(2, "0")}:${ss}`;
}

/* ------------------------------------------------------------------ */
/* results                                                             */
/* ------------------------------------------------------------------ */

export const isComplete = (r: Pick<DrillRun, "stepsDone" | "stepsTotal">) => r.stepsTotal > 0 && r.stepsDone >= r.stepsTotal;

export type Verdict = { key: "incomplete" | "outstanding" | "solid" | "made-it" | "too-slow"; label: string; detail: string };

export function verdict(seconds: number, stepsDone: number, stepsTotal: number): Verdict {
  if (!isComplete({ stepsDone, stepsTotal })) return { key: "incomplete", label: "Not finished", detail: `${stepsDone} of ${stepsTotal} steps. Finish every step for it to count as a drill.` };
  if (seconds <= 5 * 60) return { key: "outstanding", label: "Outstanding", detail: "Under five minutes. You would be out before most people find their shoes." };
  if (seconds <= 10 * 60) return { key: "solid", label: "Solid", detail: "Under ten minutes, with time to spare." };
  if (seconds <= DRILL_LIMIT_SECONDS) return { key: "made-it", label: "You made it", detail: "Inside the 15 minutes, but close. Find what slowed you down." };
  return { key: "too-slow", label: "Too slow", detail: "Over 15 minutes. Pack the go-bag by the door and run it again." };
}

/** The fastest run in which every step was done, or null. Ties keep the earliest. */
export function bestRun(runs: DrillRun[]): DrillRun | null {
  let best: DrillRun | null = null;
  for (const r of runs) {
    if (!isComplete(r) || !(r.seconds > 0)) continue;
    if (best === null || r.seconds < best.seconds || (r.seconds === best.seconds && r.date < best.date)) best = r;
  }
  return best;
}

export type RecordResult = { state: State; personalBest: boolean; previousBest: number | null; verdict: Verdict };

/**
 * Save a finished run. A run with every step done also counts as a practised drill for the day
 * (the same record the family plan and the readiness score use).
 */
export function recordRun(state: State, run: { seconds: number; stepsDone: number; stepsTotal: number }, day: string): RecordResult {
  const seconds = Math.max(1, Math.round(run.seconds));
  const entry: DrillRun = { date: day, seconds, stepsDone: Math.max(0, run.stepsDone), stepsTotal: Math.max(0, run.stepsTotal) };
  const before = bestRun(state.drillRuns);
  const complete = isComplete(entry);
  const personalBest = complete && (before === null || seconds < before.seconds);
  let next: State = { ...state, drillRuns: [entry, ...state.drillRuns].slice(0, MAX_RUNS) };
  if (complete) next = logDrill(next, day);
  return { state: next, personalBest, previousBest: before ? before.seconds : null, verdict: verdict(seconds, entry.stepsDone, entry.stepsTotal) };
}

/** "Saved 1:12 against your last run" style comparison, or null when there is nothing to compare. */
export function compareToLast(runs: DrillRun[], seconds: number): string | null {
  const last = runs.find((r) => isComplete(r));
  if (!last) return null;
  const diff = last.seconds - seconds;
  if (diff === 0) return "Same time as your last run.";
  return diff > 0 ? `${formatClock(diff)} faster than your last run.` : `${formatClock(-diff)} slower than your last run.`;
}
