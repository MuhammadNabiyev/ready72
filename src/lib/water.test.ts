import { describe, expect, it } from "vitest";
import { ALTITUDE_LIMIT_M, BLEACH_STRENGTHS, bleachDose, boilMinutes, doseTable, dropsToMl } from "./water";

describe("boiling", () => {
  it("is one minute up to 2,000 m and three above", () => {
    expect(boilMinutes(0)).toBe(1);
    expect(boilMinutes(ALTITUDE_LIMIT_M)).toBe(1);
    expect(boilMinutes(ALTITUDE_LIMIT_M + 1)).toBe(3);
    expect(boilMinutes(4000)).toBe(3);
  });
  it("treats nonsense altitudes as sea level", () => {
    expect(boilMinutes(Number.NaN)).toBe(1);
    expect(boilMinutes(-50)).toBe(1);
  });
});

describe("bleach dose", () => {
  it("gives 8 drops per US gallon of 6% bleach, rounded up", () => {
    expect(bleachDose(3.785, "6", false)?.drops).toBe(8);
    expect(bleachDose(1, "6", false)?.drops).toBe(3);
    expect(bleachDose(4, "6", false)?.drops).toBe(9);
  });
  it("needs fewer drops of stronger bleach", () => {
    const d5 = bleachDose(10, "5", false)!.drops;
    const d6 = bleachDose(10, "6", false)!.drops;
    const d825 = bleachDose(10, "8.25", false)!.drops;
    expect(d5).toBeGreaterThan(d6);
    expect(d6).toBeGreaterThan(d825);
  });
  it("doubles the dose for cloudy water and always waits 30 minutes", () => {
    expect(bleachDose(3.785, "6", true)?.drops).toBe(16);
    expect(bleachDose(1, "6", true)?.waitMinutes).toBe(30);
  });
  it("never doses less than one drop for a tiny amount", () => {
    expect(bleachDose(0.05, "8.25", false)?.drops).toBe(1);
  });
  it("rejects zero, negative, non-numeric amounts and unknown strengths", () => {
    expect(bleachDose(0, "6", false)).toBeNull();
    expect(bleachDose(-3, "6", false)).toBeNull();
    expect(bleachDose(Number.NaN, "6", false)).toBeNull();
    expect(bleachDose(4, "12" as never, false)).toBeNull();
  });
  it("scales with the amount of water", () => {
    expect(bleachDose(20, "6", false)!.drops).toBeGreaterThanOrEqual(2 * bleachDose(10, "6", false)!.drops - 1);
  });
  it("builds a table that grows with the volume and offers every strength", () => {
    const rows = doseTable("6", false);
    for (let i = 1; i < rows.length; i++) expect(rows[i].drops).toBeGreaterThan(rows[i - 1].drops);
    expect(BLEACH_STRENGTHS.map((s) => s.value)).toEqual(["5", "6", "8.25"]);
  });
  it("converts drops to millilitres", () => {
    expect(dropsToMl(20)).toBe(1);
    expect(dropsToMl(9)).toBe(0.5);
  });
});
