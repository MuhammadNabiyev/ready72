import { differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";
import {
  CATEGORY_LABEL,
  CATEGORY_WEIGHT,
  baseDailyWater,
  buildRequirements,
  dailyKcal,
  dailyWater,
} from "./requirements";
import { CATEGORY_ORDER, type Category, type Entry, type Requirement, type State } from "./types";

let seq = 0;
export const uid = (p: string) => `${p}_${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const dayKey = (d: Date) => format(d, "yyyy-MM-dd");

/* ------------------------------------------------------------------ */
/* amounts and coverage                                                */
/* ------------------------------------------------------------------ */

/** expired items do not count toward preparedness */
export const isUsable = (e: Entry, today: Date) => !e.expiry || e.expiry >= dayKey(today);

export function amountOf(req: Requirement, e: Entry): number {
  switch (req.kind) {
    case "water":
    case "count":
    case "days":
      return e.qty;
    case "food":
      return e.qty * (e.kcalPerUnit ?? 0);
    case "check":
      return e.qty > 0 ? 1 : 0;
  }
}

export type Progress = {
  req: Requirement;
  have: number;
  expired: number;
  /** 0..1 */
  fraction: number;
  missing: number;
};

export function haveFor(req: Requirement, entries: Entry[], today: Date, goBagOnly = false): number {
  let sum = 0;
  for (const e of entries) {
    if (e.reqId !== req.id || !isUsable(e, today)) continue;
    if (goBagOnly && !e.goBag) continue;
    sum += amountOf(req, e);
  }
  return req.kind === "check" ? Math.min(1, sum) : sum;
}

export function progressFor(state: State, today: Date): Progress[] {
  if (!state.profile) return [];
  return buildRequirements(state.profile).map((req) => {
    const have = haveFor(req, state.entries, today);
    const expired = state.entries
      .filter((e) => e.reqId === req.id && !isUsable(e, today))
      .reduce((s, e) => s + amountOf(req, e), 0);
    const fraction = req.need > 0 ? Math.min(1, have / req.need) : 1;
    return { req, have, expired, fraction, missing: Math.max(0, Math.ceil(req.need - have)) };
  });
}

export function suppliesDays(state: State, today: Date) {
  const p = state.profile;
  if (!p) return { water: 0, food: 0, overall: 0 };
  const liters = haveFor({ id: "water", kind: "water" } as Requirement, state.entries, today);
  const kcal = haveFor({ id: "food", kind: "food" } as Requirement, state.entries, today);
  const dw = dailyWater(p);
  const dk = dailyKcal(p);
  const water = dw > 0 ? liters / dw : 0;
  const food = dk > 0 ? kcal / dk : 0;
  const round = (n: number) => Math.round(n * 10) / 10;
  return { water: round(water), food: round(food), overall: round(Math.min(water, food)) };
}

/* ------------------------------------------------------------------ */
/* readiness score                                                     */
/* ------------------------------------------------------------------ */

export function categoryFraction(list: Progress[], cat: Category): number | null {
  const items = list.filter((p) => p.req.category === cat);
  if (!items.length) return null;
  let num = 0;
  let den = 0;
  for (const p of items) {
    const w = p.req.critical ? 2 : 1;
    num += p.fraction * w;
    den += w;
  }
  return num / den;
}

export const DRILL_INTERVAL_DAYS = 180;

export function planParts(state: State, today: Date) {
  const contacts = state.contacts.length;
  const hasOutOfArea = state.contacts.some((c) => c.role === "out-of-area");
  const contactsPart = (Math.min(contacts, 2) / 2) * 0.7 + (hasOutOfArea ? 0.3 : 0);
  const hasHome = state.points.some((p) => p.kind === "home");
  const hasOutside = state.points.some((p) => p.kind !== "home");
  const pointsPart = (hasHome ? 0.5 : 0) + (hasOutside ? 0.5 : 0);
  const last = state.drills[0];
  const age = last ? differenceInCalendarDays(startOfDay(today), startOfDay(parseISO(last))) : null;
  const drillPart = age === null ? 0 : age <= DRILL_INTERVAL_DAYS ? 1 : 0.5;
  return {
    contactsPart,
    pointsPart,
    drillPart,
    fraction: 0.4 * contactsPart + 0.3 * pointsPart + 0.3 * drillPart,
    hasOutOfArea,
    hasOutside,
    drillAgeDays: age,
  };
}

export type Level = { key: "exposed" | "starting" | "prepared" | "well" | "ready"; label: string };

export function levelFor(score: number): Level {
  if (score >= 90) return { key: "ready", label: "Ready" };
  if (score >= 75) return { key: "well", label: "Well prepared" };
  if (score >= 50) return { key: "prepared", label: "Prepared" };
  if (score >= 25) return { key: "starting", label: "Getting started" };
  return { key: "exposed", label: "Exposed" };
}

export type Readiness = {
  score: number;
  level: Level;
  parts: { key: Category | "plan"; label: string; fraction: number; weight: number }[];
};

export function readiness(state: State, today: Date): Readiness {
  const list = progressFor(state, today);
  const parts: Readiness["parts"] = [];
  for (const cat of CATEGORY_ORDER) {
    const f = categoryFraction(list, cat);
    if (f === null) continue;
    parts.push({ key: cat, label: CATEGORY_LABEL[cat], fraction: f, weight: CATEGORY_WEIGHT[cat] });
  }
  parts.push({ key: "plan", label: "Family plan", fraction: planParts(state, today).fraction, weight: CATEGORY_WEIGHT.plan });
  const total = parts.reduce((s, p) => s + p.weight, 0);
  const got = parts.reduce((s, p) => s + p.weight * p.fraction, 0);
  const score = state.profile ? Math.round((100 * got) / total) : 0;
  return { score, level: levelFor(score), parts };
}

/* ------------------------------------------------------------------ */
/* gaps, shopping list, next actions                                   */
/* ------------------------------------------------------------------ */

export const fmtAmount = (req: Pick<Requirement, "kind" | "unit">, n: number) => {
  switch (req.kind) {
    case "water":
      return `${Math.round(n * 10) / 10} L`;
    case "food":
      return `${Math.round(n).toLocaleString("en-US")} kcal`;
    case "check":
      return n >= 1 ? "Have" : "Missing";
    default:
      return `${n} ${req.unit}`;
  }
};

export function gapText(req: Requirement, missing: number): string {
  switch (req.kind) {
    case "water":
      return `Store ${missing} more liters of water`;
    case "food":
      return `Add ${missing.toLocaleString("en-US")} kcal of food (about ${Math.ceil(missing / 3600)} kg of rice)`;
    case "days":
      return `Stock ${missing} more ${missing === 1 ? "day" : "days"} of ${req.label.toLowerCase()}`;
    case "check":
      return `Get: ${req.label.toLowerCase()}`;
    default:
      return `Get ${missing} more: ${req.label.toLowerCase()}`;
  }
}

export type ShoppingLine = { req: Requirement; missing: number; text: string };

export function shoppingList(state: State, today: Date): ShoppingLine[] {
  return progressFor(state, today)
    .filter((p) => p.missing > 0)
    .map((p) => ({ req: p.req, missing: p.missing, text: gapText(p.req, p.missing) }))
    .sort(
      (a, b) =>
        Number(b.req.critical) - Number(a.req.critical) ||
        CATEGORY_ORDER.indexOf(a.req.category) - CATEGORY_ORDER.indexOf(b.req.category) ||
        a.req.label.localeCompare(b.req.label),
    );
}

export type Action = { id: string; text: string; href: string; impact: number };

/** The few steps that raise the readiness score the most. */
export function nextActions(state: State, today: Date, n = 3): Action[] {
  if (!state.profile) return [];
  const list = progressFor(state, today);
  const perCat = new Map<Category, number>();
  for (const p of list) perCat.set(p.req.category, (perCat.get(p.req.category) ?? 0) + 1);

  const actions: Action[] = list
    .filter((p) => p.fraction < 1)
    .map((p) => ({
      id: `req:${p.req.id}`,
      text: gapText(p.req, p.missing),
      href: "/kit",
      impact: ((CATEGORY_WEIGHT[p.req.category] * (p.req.critical ? 2 : 1)) / (perCat.get(p.req.category) ?? 1)) * (1 - p.fraction),
    }));

  const plan = planParts(state, today);
  if (state.contacts.length === 0) actions.push({ id: "plan:contacts", text: "Add your emergency contacts", href: "/plan", impact: 4 });
  if (state.contacts.length > 0 && !plan.hasOutOfArea) actions.push({ id: "plan:out-of-area", text: "Add a contact who lives out of town", href: "/plan", impact: 3 });
  if (state.points.length === 0) actions.push({ id: "plan:points", text: "Pick a place to meet if you are separated", href: "/plan", impact: 4 });
  else if (!plan.hasOutside) actions.push({ id: "plan:outside", text: "Add a meeting point outside your home", href: "/plan", impact: 3 });
  if (plan.drillAgeDays === null) actions.push({ id: "plan:drill", text: "Practise a drill and log it", href: "/plan", impact: 3 });
  else if (plan.drillAgeDays > DRILL_INTERVAL_DAYS) actions.push({ id: "plan:drill", text: "Your last drill was over six months ago. Practise again", href: "/plan", impact: 2 });

  return actions.sort((a, b) => b.impact - a.impact || a.id.localeCompare(b.id)).slice(0, n);
}

/* ------------------------------------------------------------------ */
/* alerts                                                              */
/* ------------------------------------------------------------------ */

export type Alert = { id: string; severity: "critical" | "warn" | "info"; text: string; href: string };

export const EXPIRY_WARN_DAYS = 60;

export function alerts(state: State, today: Date): Alert[] {
  const out: Alert[] = [];
  if (!state.profile) return out;
  const reqs = new Map(buildRequirements(state.profile).map((r) => [r.id, r]));
  const t = startOfDay(today);

  const expired = state.entries.filter((e) => e.expiry && !isUsable(e, today));
  for (const e of expired) {
    out.push({ id: `expired:${e.id}`, severity: "critical", text: `${e.name} expired on ${format(parseISO(e.expiry as string), "d MMM yyyy")}. It no longer counts toward your kit`, href: "/kit" });
  }
  const soon = state.entries
    .filter((e) => e.expiry && isUsable(e, today))
    .map((e) => ({ e, days: differenceInCalendarDays(parseISO(e.expiry as string), t) }))
    .filter((x) => x.days <= EXPIRY_WARN_DAYS)
    .sort((a, b) => a.days - b.days);
  for (const { e, days } of soon) {
    out.push({
      id: `soon:${e.id}`,
      severity: days <= 14 ? "warn" : "info",
      text: `${e.name} expires ${days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`}`,
      href: "/kit",
    });
  }

  if (state.profile.meds) {
    const meds = reqs.get("meds");
    if (meds && haveFor(meds, state.entries, today) < 7) {
      out.push({ id: "meds-low", severity: "critical", text: "Less than 7 days of prescription medication on hand", href: "/kit" });
    }
  }

  const plan = planParts(state, today);
  if (plan.drillAgeDays !== null && plan.drillAgeDays > DRILL_INTERVAL_DAYS) {
    out.push({ id: "drill-overdue", severity: "warn", text: `Your last drill was ${plan.drillAgeDays} days ago`, href: "/plan" });
  }
  if (state.contacts.length > 0 && !plan.hasOutOfArea) {
    out.push({ id: "no-out-of-area", severity: "info", text: "No out-of-town contact yet. Local lines jam first, so one helps", href: "/plan" });
  }

  const rank = { critical: 0, warn: 1, info: 2 } as const;
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

/* ------------------------------------------------------------------ */
/* scenarios (stress tests)                                            */
/* ------------------------------------------------------------------ */

export type Scenario = {
  id: string;
  name: string;
  summary: string;
  days: number;
  /** multiply base water need (heat) */
  waterMult: number;
  /** only items flagged as go-bag count */
  goBag: boolean;
  /** requirement ids that must be fully met, when they apply to this household */
  extras: string[];
  needsContact: boolean;
  needsOutsidePoint: boolean;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "shelter3",
    name: "Shelter in place, 3 days",
    summary: "No power, water or deliveries for three days. You stay home.",
    days: 3,
    waterMult: 1,
    goBag: false,
    extras: ["flashlight", "firstaid", "radio", "powerbank", "meds", "infant", "petfood", "mobility"],
    needsContact: false,
    needsOutsidePoint: false,
  },
  {
    id: "outage7",
    name: "Week-long outage",
    summary: "A storm takes out the grid for seven days.",
    days: 7,
    waterMult: 1,
    goBag: false,
    extras: ["flashlight", "batteries", "powerbank", "radio", "firstaid", "meds", "infant", "petfood", "cooler"],
    needsContact: false,
    needsOutsidePoint: false,
  },
  {
    id: "evac15",
    name: "Evacuate in 15 minutes",
    summary: "Fire or flood forces you out. Only what is in the go-bag comes along.",
    days: 1,
    waterMult: 1,
    goBag: true,
    extras: ["flashlight", "firstaid", "whistle", "idcopies", "paperlist", "cash", "powerbank", "meds", "medlist", "infant", "petfood", "petcarrier", "n95"],
    needsContact: true,
    needsOutsidePoint: true,
  },
  {
    id: "heat3",
    name: "Heatwave and blackout, 3 days",
    summary: "Fans are off and everyone drinks far more.",
    days: 3,
    waterMult: 1.25,
    goBag: false,
    extras: ["fan", "electrolytes", "powerbank", "firstaid", "meds", "petfood"],
    needsContact: false,
    needsOutsidePoint: false,
  },
  {
    id: "winter5",
    name: "Winter storm, 5 days",
    summary: "Snowed in with no heating.",
    days: 5,
    waterMult: 1,
    goBag: false,
    extras: ["blankets", "warmclothes", "handwarmers", "flashlight", "radio", "powerbank", "firstaid", "meds"],
    needsContact: false,
    needsOutsidePoint: false,
  },
];

export type Check = { id: string; label: string; ok: boolean; detail: string };

export function evaluateScenario(state: State, sc: Scenario, today: Date): { passed: boolean; checks: Check[]; okCount: number } {
  const p = state.profile;
  if (!p) return { passed: false, checks: [], okCount: 0 };
  const reqs = new Map(buildRequirements(p).map((r) => [r.id, r]));
  const checks: Check[] = [];

  const waterNeed = Math.ceil(baseDailyWater(p) * sc.waterMult * sc.days);
  const waterHave = haveFor(reqs.get("water")!, state.entries, today, sc.goBag);
  checks.push({
    id: "water",
    label: `Water for ${sc.days} ${sc.days === 1 ? "day" : "days"}`,
    ok: waterHave >= waterNeed,
    detail: `${Math.round(waterHave * 10) / 10} of ${waterNeed} L${waterHave < waterNeed ? ` (short by ${Math.ceil(waterNeed - waterHave)} L)` : ""}`,
  });

  const kcalNeed = dailyKcal(p) * sc.days;
  const kcalHave = haveFor(reqs.get("food")!, state.entries, today, sc.goBag);
  checks.push({
    id: "food",
    label: `Food for ${sc.days} ${sc.days === 1 ? "day" : "days"}`,
    ok: kcalHave >= kcalNeed,
    detail: `${Math.round(kcalHave).toLocaleString("en-US")} of ${kcalNeed.toLocaleString("en-US")} kcal`,
  });

  for (const id of sc.extras) {
    const r = reqs.get(id);
    if (!r) continue;
    const have = haveFor(r, state.entries, today, sc.goBag);
    // a go-bag carries a few days of medicine or pet food, not the full stockpile
    const needed = sc.goBag && r.kind === "days" ? Math.min(r.need, 3) : r.need;
    checks.push({
      id,
      label: sc.goBag ? `${r.label} in the go-bag` : r.label,
      ok: have >= needed,
      detail: r.kind === "check" ? (have >= 1 ? "Have" : "Missing") : `${have} of ${needed} ${r.unit}`,
    });
  }

  if (sc.needsContact) {
    checks.push({
      id: "contact",
      label: "At least one emergency contact",
      ok: state.contacts.length > 0,
      detail: `${state.contacts.length} saved`,
    });
  }
  if (sc.needsOutsidePoint) {
    const ok = state.points.some((x) => x.kind !== "home");
    checks.push({ id: "point", label: "A meeting point away from home", ok, detail: ok ? "Set" : "Not set" });
  }

  const okCount = checks.filter((c) => c.ok).length;
  return { passed: okCount === checks.length, checks, okCount };
}

/* ------------------------------------------------------------------ */
/* supply runway                                                       */
/* ------------------------------------------------------------------ */

export type RunwayLine = { id: string; label: string; days: number; need: number };

/** How many days each perishable supply lasts. Shortest first: that is the one that ends your runway. */
export function runway(state: State, today: Date): RunwayLine[] {
  const p = state.profile;
  if (!p) return [];
  const d = suppliesDays(state, today);
  const lines: RunwayLine[] = [
    { id: "water", label: "Water", days: d.water, need: p.days },
    { id: "food", label: "Food", days: d.food, need: p.days },
  ];
  for (const r of buildRequirements(p)) {
    if (r.kind !== "days") continue;
    lines.push({ id: r.id, label: r.label.replace(/ \(.*\)$/, ""), days: haveFor(r, state.entries, today), need: r.need });
  }
  return lines.sort((a, b) => a.days - b.days || a.label.localeCompare(b.label));
}
