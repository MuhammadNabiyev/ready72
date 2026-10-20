import { describe, expect, it } from "vitest";
import { addContact, addPoint, setNotes, setProfile } from "./actions";
import { runway } from "./engine";
import { buildIcs } from "./ics";
import { sampleState } from "./sample";
import { decodeShare, encodeShare, toSharedPlan } from "./share";
import { EMPTY_STATE, type Entry, type Profile, type State } from "./types";

const TODAY = new Date(2026, 9, 20, 12, 0);
const profile: Profile = { name: "Test", adults: 2, children: 1, infants: 0, pets: 1, days: 3, hazards: ["heat"], meds: true, mobility: false };
const entry = (reqId: string, qty: number, over: Partial<Entry> = {}): Entry => ({ id: `${reqId}1`, reqId, name: reqId, qty, expiry: null, goBag: false, ...over });
const base = (patch: Partial<State> = {}): State => ({ ...EMPTY_STATE, profile, ...patch });

describe("runway", () => {
  it("lists the shortest supply first", () => {
    // water: 12 L/day base * 1.25 = 15 -> 30 L = 2 days; food 5500 kcal/day -> 11000 = 2 days; meds 5 days
    const s = base({ entries: [entry("water", 30), entry("food", 1, { kcalPerUnit: 11000 }), entry("meds", 5), entry("petfood", 1)] });
    const lines = runway(s, TODAY);
    for (let i = 1; i < lines.length; i++) expect(lines[i - 1].days).toBeLessThanOrEqual(lines[i].days);
    expect(lines.find((l) => l.id === "water")!.days).toBe(2);
    expect(lines.find((l) => l.id === "meds")).toMatchObject({ days: 5, need: 7 });
    expect(lines.find((l) => l.id === "petfood")).toMatchObject({ days: 1, need: 3 });
  });
  it("is empty without a profile", () => {
    expect(runway(EMPTY_STATE, TODAY)).toEqual([]);
  });
});

describe("share link", () => {
  it("round-trips a plan including non-ASCII text", () => {
    let s = setProfile(EMPTY_STATE, profile);
    s = addContact(s, { name: "Zəhra Əliyeva", phone: "+994 50 123 45 67", role: "out-of-area" });
    s = addPoint(s, { kind: "out-of-town", label: "Aunt's house", address: "12 Main St, Ganja" });
    s = setNotes(s, "Gas valve: garage.\nSpare key: neighbor ☎");
    const token = encodeShare(toSharedPlan(s));
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    const plan = decodeShare(token)!;
    expect(plan.contacts[0]).toEqual({ name: "Zəhra Əliyeva", phone: "+994 50 123 45 67", role: "out-of-area" });
    expect(plan.points[0].address).toBe("12 Main St, Ganja");
    expect(plan.notes).toContain("☎");
    expect(plan.hazards).toEqual(["heat"]);
  });
  it("never includes the kit", () => {
    expect(JSON.stringify(toSharedPlan(sampleState(TODAY)))).not.toContain("Bottled water");
  });
  it("rejects garbage without throwing", () => {
    expect(decodeShare("")).toBeNull();
    expect(decodeShare("%%%")).toBeNull();
    expect(decodeShare("e30")).toBeNull(); // {} has no version
    expect(decodeShare(btoa(JSON.stringify({ v: 2 })))).toBeNull();
  });
  it("sanitizes unknown roles and kinds", () => {
    const token = btoa(JSON.stringify({ v: 1, name: "X", contacts: [{ name: "A", phone: "1", role: "hacker" }], points: [{ kind: "moon", label: "L" }] }));
    const plan = decodeShare(token)!;
    expect(plan.contacts[0].role).toBe("other");
    expect(plan.points[0].kind).toBe("home");
  });
});

describe("calendar export", () => {
  it("creates an all-day event with a one-week alarm for each upcoming expiry", () => {
    const s = base({ entries: [entry("water", 5, { name: "Jug, big", expiry: "2026-12-01" }), entry("food", 1, { name: "Old", expiry: "2026-01-01", kcalPerUnit: 1 })] });
    const ics = buildIcs(s, TODAY);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261201");
    expect(ics).toContain("DTEND;VALUE=DATE:20261202");
    expect(ics).toContain("SUMMARY:Ready72: Jug\\, big expires");
    expect(ics).toContain("TRIGGER:-P7D");
    expect(ics).not.toContain("Old expires");
  });
  it("schedules the next drill 180 days after the last one", () => {
    expect(buildIcs(base({ drills: ["2026-09-01"] }), TODAY)).toContain("DTSTART;VALUE=DATE:20270228");
  });
  it("never produces a line longer than 75 characters", () => {
    const ics = buildIcs(base({ entries: [entry("water", 1, { name: "x".repeat(200), expiry: "2026-12-01" })] }), TODAY);
    for (const line of ics.split("\r\n")) expect(line.length).toBeLessThanOrEqual(75);
  });
});
