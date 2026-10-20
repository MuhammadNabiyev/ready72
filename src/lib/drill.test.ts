import { describe, expect, it } from "vitest";
import { DRILL_LIMIT_SECONDS, bestRun, compareToLast, drillSteps, elapsedSeconds, formatClock, isComplete, recordRun, remainingSeconds, verdict } from "./drill";
import { EMPTY_STATE, type DrillRun, type Profile, type State } from "./types";

const profile: Profile = { name: "Test", adults: 2, children: 1, infants: 0, pets: 0, days: 3, hazards: [], meds: false, mobility: false };
const base = (patch: Partial<State> = {}): State => ({ ...EMPTY_STATE, profile, ...patch });
const run = (seconds: number, over: Partial<DrillRun> = {}): DrillRun => ({ date: "2026-10-01", seconds, stepsDone: 6, stepsTotal: 6, ...over });

describe("drill clock", () => {
  it("formats minutes and seconds with leading zeros", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(65)).toBe("01:05");
    expect(formatClock(DRILL_LIMIT_SECONDS)).toBe("15:00");
  });
  it("rolls over to hours and survives bad input", () => {
    expect(formatClock(3725)).toBe("1:02:05");
    expect(formatClock(-5)).toBe("00:00");
    expect(formatClock(Number.NaN)).toBe("00:00");
    expect(formatClock(59.9)).toBe("00:59");
  });
  it("measures elapsed time from timestamps and never goes negative", () => {
    expect(elapsedSeconds(1000, 61_500)).toBe(60);
    expect(elapsedSeconds(5000, 1000)).toBe(0);
  });
  it("counts down from fifteen minutes and stops at zero", () => {
    expect(remainingSeconds(0)).toBe(900);
    expect(remainingSeconds(400)).toBe(500);
    expect(remainingSeconds(2000)).toBe(0);
    expect(remainingSeconds(-10)).toBe(900);
  });
});

describe("drill steps", () => {
  it("always has the core steps in a sensible order", () => {
    const ids = drillSteps(base()).map((s) => s.id);
    expect(ids).toEqual(["gobag", "shutoff", "docs", "headcount", "meeting"]);
  });
  it("adds steps only for what the household has", () => {
    const ids = drillSteps(base({ profile: { ...profile, pets: 2, meds: true, mobility: true } })).map((s) => s.id);
    expect(ids[0]).toBe("mobility");
    expect(ids).toContain("pets");
    expect(ids).toContain("meds");
  });
  it("names the go-bag size and the real meeting point", () => {
    const s = base({
      entries: [{ id: "a", reqId: "water", name: "Water", qty: 1, expiry: null, goBag: true }],
      points: [
        { id: "h", kind: "home", label: "Front yard", address: "" },
        { id: "n", kind: "neighborhood", label: "Oak Park", address: "Main St" },
      ],
    });
    const steps = drillSteps(s);
    expect(steps.find((x) => x.id === "gobag")!.hint).toContain("1 item is");
    expect(steps.find((x) => x.id === "meeting")!.hint).toBe("Oak Park, Main St.");
  });
  it("falls back to the home point, and prompts when none exists", () => {
    expect(drillSteps(base({ points: [{ id: "h", kind: "home", label: "Front yard", address: "" }] })).find((x) => x.id === "meeting")!.hint).toBe("Front yard.");
    expect(drillSteps(base()).find((x) => x.id === "meeting")!.hint).toContain("not picked");
  });
});

describe("best time and verdicts", () => {
  it("picks the fastest completed run and ignores unfinished ones", () => {
    const runs = [run(420), run(300, { stepsDone: 4 }), run(380), run(0)];
    expect(bestRun(runs)?.seconds).toBe(380);
  });
  it("has no best time without a completed run", () => {
    expect(bestRun([])).toBeNull();
    expect(bestRun([run(100, { stepsDone: 2 })])).toBeNull();
  });
  it("on a tie the earlier run keeps the record", () => {
    expect(bestRun([run(300, { date: "2026-10-05" }), run(300, { date: "2026-10-02" })])?.date).toBe("2026-10-02");
  });
  it("grades by time but only when every step is done", () => {
    expect(verdict(240, 6, 6).key).toBe("outstanding");
    expect(verdict(300, 6, 6).key).toBe("outstanding");
    expect(verdict(301, 6, 6).key).toBe("solid");
    expect(verdict(900, 6, 6).key).toBe("made-it");
    expect(verdict(901, 6, 6).key).toBe("too-slow");
    expect(verdict(100, 3, 6).key).toBe("incomplete");
    expect(isComplete({ stepsDone: 0, stepsTotal: 0 })).toBe(false);
  });
});

describe("recording a run", () => {
  it("stores the run, logs the drill and flags the first completed run as a personal best", () => {
    const r = recordRun(base(), { seconds: 512, stepsDone: 5, stepsTotal: 5 }, "2026-10-20");
    expect(r.personalBest).toBe(true);
    expect(r.previousBest).toBeNull();
    expect(r.state.drillRuns).toHaveLength(1);
    expect(r.state.drills).toEqual(["2026-10-20"]);
  });
  it("only a faster time is a new record", () => {
    const first = recordRun(base(), { seconds: 400, stepsDone: 5, stepsTotal: 5 }, "2026-10-19").state;
    const slower = recordRun(first, { seconds: 450, stepsDone: 5, stepsTotal: 5 }, "2026-10-20");
    expect(slower.personalBest).toBe(false);
    expect(slower.previousBest).toBe(400);
    const faster = recordRun(slower.state, { seconds: 390, stepsDone: 5, stepsTotal: 5 }, "2026-10-21");
    expect(faster.personalBest).toBe(true);
    expect(bestRun(faster.state.drillRuns)?.seconds).toBe(390);
  });
  it("an unfinished run is kept in the history but is not a drill or a record", () => {
    const r = recordRun(base(), { seconds: 900, stepsDone: 2, stepsTotal: 5 }, "2026-10-20");
    expect(r.personalBest).toBe(false);
    expect(r.state.drills).toEqual([]);
    expect(r.state.drillRuns).toHaveLength(1);
    expect(r.verdict.key).toBe("incomplete");
  });
  it("two runs on the same day log one drill but keep both times", () => {
    const a = recordRun(base(), { seconds: 400, stepsDone: 5, stepsTotal: 5 }, "2026-10-20").state;
    const b = recordRun(a, { seconds: 350, stepsDone: 5, stepsTotal: 5 }, "2026-10-20").state;
    expect(b.drills).toHaveLength(1);
    expect(b.drillRuns).toHaveLength(2);
  });
  it("clamps silly durations and caps the history", () => {
    expect(recordRun(base(), { seconds: 0, stepsDone: 5, stepsTotal: 5 }, "2026-10-20").state.drillRuns[0].seconds).toBe(1);
    let s = base();
    for (let i = 0; i < 60; i++) s = recordRun(s, { seconds: 500 + i, stepsDone: 5, stepsTotal: 5 }, "2026-10-20").state;
    expect(s.drillRuns).toHaveLength(50);
  });
  it("compares with the last completed run", () => {
    expect(compareToLast([], 300)).toBeNull();
    expect(compareToLast([run(372)], 300)).toBe("01:12 faster than your last run.");
    expect(compareToLast([run(300)], 372)).toBe("01:12 slower than your last run.");
    expect(compareToLast([run(300)], 300)).toBe("Same time as your last run.");
  });
});
