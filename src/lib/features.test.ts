import { describe, expect, it } from "vitest";
import { SCENARIOS, evaluateScenario } from "./engine";
import { addScenario, allScenarios, makeScenario, narrate, removeScenario, shareCard, supplyTimeline, validateScenarioDraft } from "./features";
import { sampleState } from "./sample";
import { EMPTY_STATE, type Entry, type Profile, type State } from "./types";

const TODAY = new Date(2026, 9, 20, 12, 0);
const profile: Profile = { name: "Test", adults: 2, children: 1, infants: 0, pets: 0, days: 3, hazards: [], meds: true, mobility: false };
const entry = (reqId: string, qty: number, over: Partial<Entry> = {}): Entry => ({ id: `${reqId}1`, reqId, name: reqId, qty, expiry: null, goBag: false, ...over });
const base = (patch: Partial<State> = {}): State => ({ ...EMPTY_STATE, profile, ...patch });

describe("supply timeline", () => {
  // 11 L/day, 5500 kcal/day
  const s = base({ entries: [entry("water", 33), entry("food", 1, { kcalPerUnit: 16500 }), entry("meds", 5)] });

  it("starts full and drains linearly", () => {
    const t0 = supplyTimeline(s, TODAY, 0);
    expect(t0.find((l) => l.id === "water")).toMatchObject({ start: 33, remaining: 33, fraction: 1 });
    const t36 = supplyTimeline(s, TODAY, 36);
    expect(t36.find((l) => l.id === "water")!.remaining).toBeCloseTo(33 - 11 * 1.5);
    expect(t36.find((l) => l.id === "meds")!.remaining).toBeCloseTo(5 - 1.5);
  });
  it("never goes below zero and reports when each supply ends", () => {
    const t = supplyTimeline(s, TODAY, 500);
    expect(t.every((l) => l.remaining === 0)).toBe(true);
    expect(t.find((l) => l.id === "water")!.endsAtHour).toBe(72);
    expect(t.find((l) => l.id === "meds")!.endsAtHour).toBe(120);
  });
  it("an empty kit has nothing to drain", () => {
    const t = supplyTimeline(base(), TODAY, 10);
    expect(t.find((l) => l.id === "water")).toMatchObject({ start: 0, remaining: 0, fraction: 0, endsAtHour: 0 });
  });
  it("ignores expired water", () => {
    const e = base({ entries: [entry("water", 20, { expiry: "2026-10-01" })] });
    expect(supplyTimeline(e, TODAY, 0).find((l) => l.id === "water")!.start).toBe(0);
  });
  it("narrates the first shortage and the next one", () => {
    const lines = supplyTimeline(s, TODAY, 80);
    const n = narrate(lines, 80);
    expect(n.headline).toBe("Water ran out on day 4, 00:00.");
    const early = narrate(supplyTimeline(s, TODAY, 10), 10);
    expect(early.headline).toBe("Everything is still holding.");
    expect(early.detail).toContain("water on day 4, 00:00");
  });
});

describe("custom scenarios", () => {
  const draft = { name: "  Ice storm  ", days: 4, hot: false, goBag: false, extras: ["flashlight", "radio"], needsContact: false, needsOutsidePoint: false };

  it("validates name and day range", () => {
    expect(validateScenarioDraft(draft)).toEqual({});
    expect(validateScenarioDraft({ ...draft, name: " " }).name).toBeDefined();
    expect(validateScenarioDraft({ ...draft, name: "x".repeat(61) }).name).toBeDefined();
    expect(validateScenarioDraft({ ...draft, days: 0 }).days).toBeDefined();
    expect(validateScenarioDraft({ ...draft, days: 31 }).days).toBeDefined();
    expect(validateScenarioDraft({ ...draft, days: 2.5 }).days).toBeDefined();
  });
  it("builds a scenario the evaluator understands", () => {
    const sc = makeScenario(draft);
    expect(sc).toMatchObject({ name: "Ice storm", days: 4, waterMult: 1, custom: true, summary: "Your own scenario: 4 days." });
    const r = evaluateScenario(base({ entries: [entry("water", 44)] }), sc, TODAY);
    expect(r.checks.find((c) => c.id === "water")).toMatchObject({ ok: true, detail: "44 of 44 L" });
    expect(r.checks.find((c) => c.id === "flashlight")!.ok).toBe(false);
  });
  it("heat multiplies water and shows in the summary", () => {
    const sc = makeScenario({ ...draft, hot: true, goBag: true });
    expect(sc.waterMult).toBe(1.25);
    expect(sc.summary).toBe("Your own scenario: 4 days, extreme heat, go-bag only.");
  });
  it("adds, lists and removes", () => {
    const sc = makeScenario(draft);
    let s = addScenario(base(), sc);
    expect(allScenarios(s)).toHaveLength(SCENARIOS.length + 1);
    expect(allScenarios(s).at(-1)!.id).toBe(sc.id);
    s = removeScenario(s, sc.id);
    expect(allScenarios(s)).toHaveLength(SCENARIOS.length);
  });
});

describe("share card", () => {
  it("summarises the sample household in one tweet-sized text", () => {
    const c = shareCard(sampleState(TODAY), TODAY);
    expect(c.household).toBe("The Alvarez family");
    expect(c.score).toBeGreaterThan(30);
    expect(c.text).toContain("can last");
    expect(c.text).toContain("#Ready72");
    expect(c.text.length).toBeLessThan(280);
  });
  it("falls back to a default name", () => {
    expect(shareCard(EMPTY_STATE, TODAY).household).toBe("My household");
  });
});
