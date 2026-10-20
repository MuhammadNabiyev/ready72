import { describe, expect, it } from "vitest";
import {
  addContact,
  addEntry,
  addPoint,
  addPurchase,
  logDrill,
  planText,
  setProfile,
  validateContact,
  validateEntry,
  validateProfile,
} from "./actions";
import {
  alerts,
  evaluateScenario,
  haveFor,
  levelFor,
  nextActions,
  planParts,
  progressFor,
  readiness,
  SCENARIOS,
  shoppingList,
  suppliesDays,
} from "./engine";
import { baseDailyWater, buildRequirements, dailyKcal, dailyWater } from "./requirements";
import { sampleState } from "./sample";
import { EMPTY_STATE, type Entry, type Profile, type State } from "./types";

const TODAY = new Date(2026, 9, 20, 12, 0);

const profile = (over: Partial<Profile> = {}): Profile => ({
  name: "Test",
  adults: 2,
  children: 1,
  infants: 0,
  pets: 0,
  days: 3,
  hazards: [],
  meds: false,
  mobility: false,
  ...over,
});

const base = (over: Partial<Profile> = {}, patch: Partial<State> = {}): State => ({ ...EMPTY_STATE, profile: profile(over), ...patch });

const entry = (reqId: string, qty: number, over: Partial<Entry> = {}): Entry => ({
  id: `${reqId}-${Math.random()}`,
  reqId,
  name: reqId,
  qty,
  expiry: null,
  goBag: false,
  ...over,
});

const need = (p: Profile, id: string) => buildRequirements(p).find((r) => r.id === id);

describe("requirements", () => {
  it("water: 4 L adult, 3 L child, 2 L infant, 1 L pet, per day", () => {
    const p = profile({ adults: 2, children: 1, infants: 1, pets: 2 });
    expect(baseDailyWater(p)).toBe(8 + 3 + 2 + 2);
    expect(need(p, "water")!.need).toBe(15 * 3);
  });
  it("heat adds 25% to water", () => {
    const p = profile({ hazards: ["heat"] });
    expect(dailyWater(p)).toBeCloseTo(11 * 1.25);
    expect(need(p, "water")!.need).toBe(Math.ceil(11 * 1.25 * 3));
  });
  it("food: 2000 / 1500 / 800 kcal a day", () => {
    expect(dailyKcal(profile({ adults: 2, children: 1, infants: 1 }))).toBe(4000 + 1500 + 800);
    expect(need(profile(), "food")!.need).toBe(5500 * 3);
  });
  it("scales with the number of days", () => {
    expect(need(profile({ days: 14 }), "water")!.need).toBe(11 * 14);
    expect(need(profile({ days: 7 }), "toiletpaper")!.need).toBe(Math.ceil((3 * 7) / 4));
  });
  it("counts items per person", () => {
    const p = profile({ adults: 3, children: 2 });
    expect(need(p, "flashlight")!.need).toBe(5);
    expect(need(p, "powerbank")!.need).toBe(3);
    expect(need(p, "whistle")!.need).toBe(5);
  });
  it("adds conditional requirements only when they apply", () => {
    const plain = buildRequirements(profile()).map((r) => r.id);
    expect(plain).not.toContain("meds");
    expect(plain).not.toContain("petfood");
    expect(plain).not.toContain("n95");
    const full = buildRequirements(profile({ meds: true, pets: 1, infants: 1, mobility: true, hazards: ["wildfire", "earthquake", "winter"] })).map((r) => r.id);
    expect(full).toEqual(expect.arrayContaining(["meds", "medlist", "petfood", "infant", "mobility", "n95", "gaswrench", "handwarmers"]));
  });
  it("medication target is at least 7 days", () => {
    expect(need(profile({ meds: true, days: 3 }), "meds")!.need).toBe(7);
    expect(need(profile({ meds: true, days: 14 }), "meds")!.need).toBe(14);
  });
  it("requirement ids are unique", () => {
    const ids = buildRequirements(profile({ meds: true, pets: 1, infants: 1, mobility: true, hazards: ["earthquake", "flood", "wildfire", "winter", "heat", "outage"] })).map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("coverage", () => {
  it("sums usable entries per requirement", () => {
    const s = base({}, { entries: [entry("water", 12), entry("water", 8)] });
    expect(haveFor(need(s.profile!, "water")!, s.entries, TODAY)).toBe(20);
  });
  it("food converts units to kcal", () => {
    const s = base({}, { entries: [entry("food", 3, { kcalPerUnit: 3600 })] });
    expect(haveFor(need(s.profile!, "food")!, s.entries, TODAY)).toBe(10800);
  });
  it("expired entries do not count, items expiring today still do", () => {
    const s = base({}, { entries: [entry("water", 10, { expiry: "2026-10-19" }), entry("water", 5, { expiry: "2026-10-20" })] });
    expect(haveFor(need(s.profile!, "water")!, s.entries, TODAY)).toBe(5);
    const water = progressFor(s, TODAY).find((p) => p.req.id === "water")!;
    expect(water.expired).toBe(10);
  });
  it("check items are yes/no no matter how many entries", () => {
    const s = base({}, { entries: [entry("cash", 5), entry("cash", 1)] });
    expect(haveFor(need(s.profile!, "cash")!, s.entries, TODAY)).toBe(1);
  });
  it("fraction is capped at 1 and missing rounds up", () => {
    const s = base({}, { entries: [entry("water", 100)] });
    const water = progressFor(s, TODAY).find((p) => p.req.id === "water")!;
    expect(water.fraction).toBe(1);
    expect(water.missing).toBe(0);
    const half = progressFor(base({}, { entries: [entry("water", 10.5)] }), TODAY).find((p) => p.req.id === "water")!;
    expect(half.missing).toBe(Math.ceil(33 - 10.5));
  });
  it("days of supply is the lower of water and food", () => {
    const s = base({}, { entries: [entry("water", 22), entry("food", 1, { kcalPerUnit: 5500 * 4 })] });
    // water 22 / 11 = 2 days, food 4 days
    expect(suppliesDays(s, TODAY)).toEqual({ water: 2, food: 4, overall: 2 });
  });
});

describe("readiness score", () => {
  it("is 0 with no profile and low with an empty kit", () => {
    expect(readiness(EMPTY_STATE, TODAY).score).toBe(0);
    expect(readiness(base(), TODAY).score).toBe(0);
  });
  it("rises as the kit fills", () => {
    const empty = readiness(base(), TODAY).score;
    const withWater = readiness(base({}, { entries: [entry("water", 33)] }), TODAY).score;
    expect(withWater).toBeGreaterThan(empty);
  });
  it("is 100 when everything is covered", () => {
    const s = base({}, {});
    const entries: Entry[] = buildRequirements(s.profile!).map((r) =>
      entry(r.id, r.need || 1, r.kind === "food" ? { qty: 1, kcalPerUnit: r.need } : {}),
    );
    const full: State = {
      ...s,
      entries,
      contacts: [
        { id: "1", name: "A", phone: "5550101", role: "family" },
        { id: "2", name: "B", phone: "5550102", role: "out-of-area" },
      ],
      points: [
        { id: "1", kind: "home", label: "Yard", address: "" },
        { id: "2", kind: "neighborhood", label: "Park", address: "" },
      ],
      drills: ["2026-10-01"],
    };
    expect(readiness(full, TODAY).score).toBe(100);
    expect(readiness(full, TODAY).level.key).toBe("ready");
  });
  it("only weights categories that apply", () => {
    const noMeds = readiness(base(), TODAY).parts.map((p) => p.key);
    expect(noMeds).not.toContain("meds");
    expect(noMeds).not.toContain("pets");
    const withMeds = readiness(base({ meds: true, pets: 1 }), TODAY).parts.map((p) => p.key);
    expect(withMeds).toEqual(expect.arrayContaining(["meds", "pets", "plan"]));
  });
  it("maps scores to levels", () => {
    expect(levelFor(0).key).toBe("exposed");
    expect(levelFor(25).key).toBe("starting");
    expect(levelFor(50).key).toBe("prepared");
    expect(levelFor(75).key).toBe("well");
    expect(levelFor(90).key).toBe("ready");
  });
  it("expired water lowers the score", () => {
    const fresh = readiness(base({}, { entries: [entry("water", 33)] }), TODAY).score;
    const stale = readiness(base({}, { entries: [entry("water", 33, { expiry: "2026-01-01" })] }), TODAY).score;
    expect(stale).toBeLessThan(fresh);
  });
});

describe("family plan", () => {
  it("scores contacts, meeting points and drills", () => {
    const s = base({}, {});
    expect(planParts(s, TODAY).fraction).toBe(0);
    let t = addContact(s, { name: "Sam", phone: "555 0101", role: "family" });
    expect(planParts(t, TODAY).contactsPart).toBeCloseTo(0.35);
    t = addContact(t, { name: "Lee", phone: "555 0102", role: "out-of-area" });
    expect(planParts(t, TODAY).contactsPart).toBeCloseTo(1);
    t = addPoint(t, { kind: "home", label: "Yard", address: "" });
    expect(planParts(t, TODAY).pointsPart).toBe(0.5);
    t = addPoint(t, { kind: "out-of-town", label: "Aunt's house", address: "Springfield" });
    expect(planParts(t, TODAY).pointsPart).toBe(1);
  });
  it("a drill older than 180 days counts half", () => {
    expect(planParts(base({}, { drills: ["2026-10-01"] }), TODAY).drillPart).toBe(1);
    expect(planParts(base({}, { drills: ["2026-01-01"] }), TODAY).drillPart).toBe(0.5);
    expect(planParts(base(), TODAY).drillPart).toBe(0);
  });
  it("logDrill keeps newest first and ignores the same day twice", () => {
    let s = logDrill(base(), "2026-10-01");
    s = logDrill(s, "2026-10-20");
    s = logDrill(s, "2026-10-20");
    expect(s.drills).toEqual(["2026-10-20", "2026-10-01"]);
  });
  it("planText lists contacts and points", () => {
    let s = addContact(base(), { name: "Sam", phone: "555 0101", role: "family" });
    s = addPoint(s, { kind: "home", label: "Yard", address: "" });
    const t = planText(s);
    expect(t).toContain("Sam (family): 555 0101");
    expect(t).toContain("home: Yard");
  });
});

describe("shopping list and next actions", () => {
  it("lists only gaps, critical items first", () => {
    const s = base({}, { entries: [entry("water", 33), entry("sanitizer", 1)] });
    const list = shoppingList(s, TODAY);
    expect(list.find((l) => l.req.id === "water")).toBeUndefined();
    expect(list.find((l) => l.req.id === "sanitizer")).toBeUndefined();
    expect(list[0].req.critical).toBe(true);
  });
  it("describes gaps in plain words", () => {
    const list = shoppingList(base({}, { entries: [entry("water", 13)] }), TODAY);
    expect(list.find((l) => l.req.id === "water")!.text).toBe("Store 20 more liters of water");
    expect(list.find((l) => l.req.id === "flashlight")!.text).toBe("Get 3 more: flashlights or headlamps");
    expect(list.find((l) => l.req.id === "sanitizer")!.text).toBe("Get: hand sanitizer or wipes");
  });
  it("mark as bought closes the gap", () => {
    let s = base();
    const water = shoppingList(s, TODAY).find((l) => l.req.id === "water")!;
    s = addPurchase(s, "water", water.missing);
    expect(shoppingList(s, TODAY).find((l) => l.req.id === "water")).toBeUndefined();
    const food = shoppingList(s, TODAY).find((l) => l.req.id === "food")!;
    s = addPurchase(s, "food", food.missing);
    expect(shoppingList(s, TODAY).find((l) => l.req.id === "food")).toBeUndefined();
    const cash = shoppingList(s, TODAY).find((l) => l.req.id === "cash")!;
    s = addPurchase(s, "cash", cash.missing);
    expect(shoppingList(s, TODAY).find((l) => l.req.id === "cash")).toBeUndefined();
  });
  it("next actions are ranked by impact and capped", () => {
    const acts = nextActions(base(), TODAY, 3);
    expect(acts).toHaveLength(3);
    expect(acts[0].impact).toBeGreaterThanOrEqual(acts[1].impact);
    expect(acts.map((a) => a.id)).toContain("req:water");
  });
  it("suggests plan steps once the kit is complete", () => {
    const s = base({}, {});
    const entries = buildRequirements(s.profile!).map((r) => entry(r.id, r.need || 1, r.kind === "food" ? { qty: 1, kcalPerUnit: r.need } : {}));
    const acts = nextActions({ ...s, entries }, TODAY, 10).map((a) => a.id);
    expect(acts).toEqual(expect.arrayContaining(["plan:contacts", "plan:points", "plan:drill"]));
    expect(acts.every((id) => id.startsWith("plan:"))).toBe(true);
  });
});

describe("alerts", () => {
  it("flags expired and soon-to-expire items", () => {
    const s = base({}, { entries: [entry("water", 5, { name: "Jug", expiry: "2026-10-19" }), entry("food", 1, { name: "Beans", kcalPerUnit: 100, expiry: "2026-10-27" })] });
    const a = alerts(s, TODAY);
    expect(a[0]).toMatchObject({ severity: "critical" });
    expect(a[0].text).toContain("Jug expired on 19 Oct 2026");
    expect(a.find((x) => x.text.startsWith("Beans"))!.text).toBe("Beans expires in 7 days");
    expect(a.find((x) => x.text.startsWith("Beans"))!.severity).toBe("warn");
  });
  it("warns when prescription supply is under a week", () => {
    const s = base({ meds: true }, { entries: [entry("meds", 4)] });
    expect(alerts(s, TODAY).some((x) => x.id === "meds-low")).toBe(true);
    const ok = base({ meds: true }, { entries: [entry("meds", 7)] });
    expect(alerts(ok, TODAY).some((x) => x.id === "meds-low")).toBe(false);
  });
  it("warns about overdue drills and a missing out-of-town contact", () => {
    const s = base({}, { drills: ["2026-01-01"], contacts: [{ id: "1", name: "A", phone: "5550101", role: "family" }] });
    const ids = alerts(s, TODAY).map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(["drill-overdue", "no-out-of-area"]));
  });
});

describe("scenarios", () => {
  const sc = (id: string) => SCENARIOS.find((s) => s.id === id)!;

  it("an empty kit fails every scenario", () => {
    for (const s of SCENARIOS) expect(evaluateScenario(base(), s, TODAY).passed).toBe(false);
  });
  it("shelter in place checks water and food for three days", () => {
    const s = base({}, { entries: [entry("water", 33), entry("food", 1, { kcalPerUnit: 5500 * 3 })] });
    const r = evaluateScenario(s, sc("shelter3"), TODAY);
    expect(r.checks.find((c) => c.id === "water")).toMatchObject({ ok: true, detail: "33 of 33 L" });
    expect(r.checks.find((c) => c.id === "food")!.ok).toBe(true);
    expect(r.checks.find((c) => c.id === "flashlight")!.ok).toBe(false);
  });
  it("reports how short the water is", () => {
    const r = evaluateScenario(base({}, { entries: [entry("water", 20)] }), sc("shelter3"), TODAY);
    expect(r.checks.find((c) => c.id === "water")).toMatchObject({ ok: false, detail: "20 of 33 L (short by 13 L)" });
  });
  it("evacuation only counts go-bag items", () => {
    const s = base({}, { entries: [entry("water", 33), entry("water", 11, { goBag: true })] });
    const r = evaluateScenario(s, sc("evac15"), TODAY);
    expect(r.checks.find((c) => c.id === "water")).toMatchObject({ ok: true, detail: "11 of 11 L" });
    const none = evaluateScenario(base({}, { entries: [entry("water", 33)] }), sc("evac15"), TODAY);
    expect(none.checks.find((c) => c.id === "water")!.ok).toBe(false);
  });
  it("evacuation needs a contact and a meeting point away from home", () => {
    const s = base({}, { points: [{ id: "1", kind: "home", label: "Yard", address: "" }] });
    const r = evaluateScenario(s, sc("evac15"), TODAY);
    expect(r.checks.find((c) => c.id === "contact")!.ok).toBe(false);
    expect(r.checks.find((c) => c.id === "point")!.ok).toBe(false);
    const t = addPoint(addContact(s, { name: "A", phone: "5550101", role: "family" }), { kind: "neighborhood", label: "Park", address: "" });
    const r2 = evaluateScenario(t, sc("evac15"), TODAY);
    expect(r2.checks.find((c) => c.id === "contact")!.ok).toBe(true);
    expect(r2.checks.find((c) => c.id === "point")!.ok).toBe(true);
  });
  it("heatwave needs 25% more water", () => {
    // base 11 L/day * 1.25 * 3 days = 41.25 -> 42
    const r = evaluateScenario(base({}, { entries: [entry("water", 33)] }), sc("heat3"), TODAY);
    expect(r.checks.find((c) => c.id === "water")!.detail).toBe("33 of 42 L (short by 9 L)");
  });
  it("a go-bag needs only three days of medicine and pet food", () => {
    const s = base({ meds: true, pets: 1 }, { entries: [entry("meds", 3, { goBag: true }), entry("petfood", 3, { goBag: true })] });
    const r = evaluateScenario(s, sc("evac15"), TODAY);
    expect(r.checks.find((c) => c.id === "meds")).toMatchObject({ ok: true, detail: "3 of 3 days" });
    expect(r.checks.find((c) => c.id === "petfood")!.ok).toBe(true);
    const shelter = evaluateScenario(s, sc("shelter3"), TODAY);
    expect(shelter.checks.find((c) => c.id === "meds")!.ok).toBe(false); // the full 7 days is not in the cupboard flag-free sum
  });
  it("skips extras that do not apply to the household", () => {
    const ids = evaluateScenario(base(), sc("shelter3"), TODAY).checks.map((c) => c.id);
    expect(ids).not.toContain("meds");
    expect(ids).not.toContain("petfood");
    const withMeds = evaluateScenario(base({ meds: true, pets: 1 }), sc("shelter3"), TODAY).checks.map((c) => c.id);
    expect(withMeds).toEqual(expect.arrayContaining(["meds", "petfood"]));
  });
});

describe("validation", () => {
  it("profile limits", () => {
    expect(validateProfile(profile())).toEqual({});
    expect(validateProfile(profile({ adults: 0 })).adults).toBeDefined();
    expect(validateProfile(profile({ children: 1.5 })).children).toBeDefined();
    expect(validateProfile(profile({ adults: 10, children: 10, infants: 1 })).total).toBeDefined();
  });
  it("entry rules depend on the requirement kind", () => {
    const s = base();
    const water = need(s.profile!, "water")!;
    const food = need(s.profile!, "food")!;
    const lamp = need(s.profile!, "flashlight")!;
    const cash = need(s.profile!, "cash")!;
    const mk = (over: Partial<Omit<Entry, "id">>) => ({ reqId: "x", name: "N", qty: 1, expiry: null, goBag: false, ...over });
    expect(validateEntry(water, mk({ qty: 1.5 }))).toEqual({});
    expect(validateEntry(water, mk({ qty: 0 })).qty).toBeDefined();
    expect(validateEntry(lamp, mk({ qty: 1.5 })).qty).toBeDefined();
    expect(validateEntry(lamp, mk({ name: " " })).name).toBeDefined();
    expect(validateEntry(food, mk({})).kcalPerUnit).toBeDefined();
    expect(validateEntry(food, mk({ kcalPerUnit: 340 }))).toEqual({});
    expect(validateEntry(cash, mk({ qty: 0 }))).toEqual({});
  });
  it("contact phone needs at least 7 digits and sane characters", () => {
    expect(validateContact({ name: "A", phone: "+1 (555) 010-4417" })).toEqual({});
    expect(validateContact({ name: "", phone: "5550101" }).name).toBeDefined();
    expect(validateContact({ name: "A", phone: "12345" }).phone).toBeDefined();
    expect(validateContact({ name: "A", phone: "call me" }).phone).toBeDefined();
  });
  it("setProfile trims the name and falls back to a default", () => {
    expect(setProfile(EMPTY_STATE, profile({ name: "  " })).profile!.name).toBe("My household");
    expect(setProfile(EMPTY_STATE, profile({ name: " Home " })).profile!.name).toBe("Home");
  });
  it("addEntry keeps a clean entry with an id", () => {
    const s = addEntry(base(), { reqId: "water", name: " Jug ", qty: 5, expiry: "", goBag: false });
    expect(s.entries[0].name).toBe("Jug");
    expect(s.entries[0].expiry).toBeNull();
    expect(s.entries[0].id).toBeTruthy();
  });
});

describe("sample household", () => {
  it("is partly prepared, with something to fix on every screen", () => {
    const s = sampleState(TODAY);
    const r = readiness(s, TODAY);
    expect(r.score).toBeGreaterThan(30);
    expect(r.score).toBeLessThan(80);
    expect(alerts(s, TODAY).some((a) => a.severity === "critical")).toBe(true);
    expect(shoppingList(s, TODAY).length).toBeGreaterThan(5);
    expect(evaluateScenario(s, SCENARIOS[2], TODAY).passed).toBe(false);
  });
});
