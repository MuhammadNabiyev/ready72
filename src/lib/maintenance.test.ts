import { describe, expect, it } from "vitest";
import { alerts } from "./engine";
import { buildIcs } from "./ics";
import {
  MAINTENANCE_TASKS,
  addCustomTask,
  counts,
  describeDue,
  describeEvery,
  markDone,
  maintenanceAlerts,
  removeCustomTask,
  schedule,
  soonWindow,
  taskStatus,
  tasksFor,
  undoDone,
  validateCustomTask,
} from "./maintenance";
import { EMPTY_STATE, type Profile, type State } from "./types";

const TODAY = new Date(2026, 9, 20, 12, 0); // 20 Oct 2026
const profile: Profile = { name: "Test", adults: 2, children: 0, infants: 0, pets: 0, days: 3, hazards: [], meds: false, mobility: false };
const base = (patch: Partial<State> = {}): State => ({ ...EMPTY_STATE, profile, ...patch });
const smoke = MAINTENANCE_TASKS.find((t) => t.id === "smoke")!;
const withDone = (done: Record<string, string>) => base({ maintenance: { done, custom: [] } });

describe("task applicability", () => {
  it("a plain household gets the universal tasks only", () => {
    const ids = tasksFor(base()).map((t) => t.id);
    expect(ids).toEqual(["smoke", "water-rotate", "gobag", "batteries", "extinguisher"]);
  });
  it("hazards, pets and medication add their own tasks", () => {
    const ids = tasksFor(base({ profile: { ...profile, hazards: ["flood", "wildfire"], pets: 1, meds: true } })).map((t) => t.id);
    for (const id of ["meds-review", "shutoffs", "drains", "defensible", "pet-records"]) expect(ids).toContain(id);
    expect(ids).not.toContain("heating");
  });
  it("has unique ids and sane intervals", () => {
    expect(new Set(MAINTENANCE_TASKS.map((t) => t.id)).size).toBe(MAINTENANCE_TASKS.length);
    expect(MAINTENANCE_TASKS.every((t) => t.everyDays >= 7)).toBe(true);
  });
});

describe("task status", () => {
  it("never done has no due date", () => {
    expect(taskStatus(smoke, undefined, TODAY)).toMatchObject({ state: "never", dueOn: null, daysUntil: null });
  });
  it("done recently is ok and due one interval later", () => {
    const s = taskStatus(smoke, "2026-10-18", TODAY); // due 17 Nov
    expect(s).toMatchObject({ state: "ok", dueOn: "2026-11-17", daysUntil: 28 });
  });
  it("becomes soon inside the warning window and is due today on the day", () => {
    expect(taskStatus(smoke, "2026-09-25", TODAY)).toMatchObject({ state: "soon", daysUntil: 5 });
    expect(taskStatus(smoke, "2026-09-20", TODAY)).toMatchObject({ state: "soon", daysUntil: 0 });
    expect(taskStatus(smoke, "2026-09-26", TODAY).state).toBe("ok");
  });
  it("is overdue the day after it was due", () => {
    expect(taskStatus(smoke, "2026-09-19", TODAY)).toMatchObject({ state: "overdue", daysUntil: -1 });
  });
  it("yearly tasks get a longer warning than monthly ones", () => {
    expect(soonWindow(30)).toBe(5);
    expect(soonWindow(365)).toBe(14);
  });
  it("an invalid stored date counts as never done", () => {
    expect(taskStatus(smoke, "not-a-date", TODAY).state).toBe("never");
    expect(taskStatus(smoke, "2026-02-31", TODAY).state).toBe("never");
  });
  it("describes timing in plain words", () => {
    expect(describeDue(taskStatus(smoke, undefined, TODAY))).toBe("Never done");
    expect(describeDue(taskStatus(smoke, "2026-09-19", TODAY))).toBe("Overdue by 1 day");
    expect(describeDue(taskStatus(smoke, "2026-09-10", TODAY))).toBe("Overdue by 10 days");
    expect(describeDue(taskStatus(smoke, "2026-09-20", TODAY))).toBe("Due today");
    expect(describeDue(taskStatus(smoke, "2026-09-21", TODAY))).toBe("Due tomorrow");
    expect(describeDue(taskStatus(smoke, "2026-09-25", TODAY))).toBe("Due in 5 days");
    expect(describeEvery(30)).toBe("Every month");
    expect(describeEvery(45)).toBe("Every 45 days");
  });
});

describe("schedule and marking done", () => {
  it("orders overdue first, then never done, then soon, then ok", () => {
    const s = withDone({ smoke: "2026-09-01", "water-rotate": "2026-10-01", batteries: "2026-06-01" });
    const list = schedule(s, TODAY);
    expect(list.map((x) => x.state)).toEqual(["overdue", "never", "never", "ok", "ok"]);
    expect(list[0].task.id).toBe("smoke");
    expect(counts(list)).toEqual({ overdue: 1, never: 2, soon: 0, ok: 2 });
  });
  it("marking done moves the due date forward", () => {
    const s = markDone(withDone({ smoke: "2026-08-01" }), "smoke", "2026-10-20");
    expect(taskStatus(smoke, s.maintenance.done.smoke, TODAY)).toMatchObject({ state: "ok", dueOn: "2026-11-19" });
  });
  it("ignores unknown tasks and invalid days, and does not mutate", () => {
    const s = base();
    expect(markDone(s, "nope", "2026-10-20")).toBe(s);
    expect(markDone(s, "smoke", "yesterday")).toBe(s);
    markDone(s, "smoke", "2026-10-20");
    expect(s.maintenance.done).toEqual({});
  });
  it("can undo a check-off", () => {
    const s = undoDone(markDone(base(), "smoke", "2026-10-20"), "smoke");
    expect(s.maintenance.done.smoke).toBeUndefined();
  });
});

describe("custom tasks", () => {
  it("validates name and interval", () => {
    expect(validateCustomTask({ label: "", everyDays: 30 }).label).toBeDefined();
    expect(validateCustomTask({ label: "x".repeat(61), everyDays: 30 }).label).toBeDefined();
    expect(validateCustomTask({ label: "Flush water heater", everyDays: 3 }).everyDays).toBeDefined();
    expect(validateCustomTask({ label: "Flush water heater", everyDays: 2000 }).everyDays).toBeDefined();
    expect(validateCustomTask({ label: "Flush water heater", everyDays: 1.5 }).everyDays).toBeDefined();
    expect(validateCustomTask({ label: "Flush water heater", everyDays: 90 })).toEqual({});
  });
  it("adds and removes a task together with its history", () => {
    let s = addCustomTask(base(), { label: "  Flush water heater ", everyDays: 90 });
    const id = s.maintenance.custom[0].id;
    expect(s.maintenance.custom[0].label).toBe("Flush water heater");
    expect(tasksFor(s).at(-1)!.custom).toBe(true);
    s = markDone(s, id, "2026-10-01");
    s = removeCustomTask(s, id);
    expect(s.maintenance.custom).toHaveLength(0);
    expect(s.maintenance.done[id]).toBeUndefined();
  });
  it("refuses an invalid task", () => {
    const s = base();
    expect(addCustomTask(s, { label: "", everyDays: 30 })).toBe(s);
  });
});

describe("dashboard alerts", () => {
  it("raises a warning for overdue tasks, an info for soon ones and one line for never done", () => {
    const s = withDone({ smoke: "2026-09-01", "water-rotate": "2026-04-30", gobag: "2026-10-19", batteries: "2026-10-19", extinguisher: "2026-10-19" });
    const list = maintenanceAlerts(s, TODAY);
    expect(list.find((a) => a.id === "maint:smoke")).toMatchObject({ severity: "warn", href: "/maintenance" });
    expect(list.find((a) => a.id === "maint:water-rotate")).toMatchObject({ severity: "info" });
    expect(list.find((a) => a.id === "maint:never")).toBeUndefined();
  });
  it("summarises never-done tasks in a single alert", () => {
    const list = maintenanceAlerts(base(), TODAY);
    expect(list).toHaveLength(1);
    expect(list[0].text).toBe("5 home maintenance tasks have never been checked off");
  });
  it("has nothing to say without a household, and feeds the main alert list", () => {
    expect(maintenanceAlerts({ ...EMPTY_STATE }, TODAY)).toEqual([]);
    expect(alerts(withDone({ smoke: "2026-09-01" }), TODAY).some((a) => a.id === "maint:smoke")).toBe(true);
  });
});

describe("calendar export", () => {
  it("adds a repeating event per task", () => {
    const ics = buildIcs(withDone({ smoke: "2026-10-10" }), TODAY);
    expect(ics).toContain("UID:maint-smoke@ready72");
    expect(ics).toContain("SUMMARY:Ready72: Test smoke and CO alarms");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261109"); // 10 Oct + 30 days
    expect(ics).toContain("RRULE:FREQ=DAILY;INTERVAL=30");
    expect(ics).toContain("RRULE:FREQ=DAILY;INTERVAL=365");
  });
  it("puts an overdue task tomorrow instead of in the past", () => {
    const ics = buildIcs(withDone({ smoke: "2026-01-01" }), TODAY);
    const block = ics.split("BEGIN:VEVENT").find((b) => b.includes("maint-smoke"))!;
    expect(block).toContain("DTSTART;VALUE=DATE:20261021");
  });
});
