/**
 * Making water safe: boiling and unscented household bleach. Figures follow the US EPA and CDC
 * guidance (see GUIDE_DISCLAIMER): 1 minute rolling boil, 3 minutes above 2,000 m (6,500 ft);
 * 8 drops of 6% bleach per US gallon of clear water, double for cloudy water, wait 30 minutes.
 */
export const LITERS_PER_GALLON = 3.785;
export const ALTITUDE_LIMIT_M = 2000;

export type BleachStrength = "5" | "6" | "8.25";

export const BLEACH_STRENGTHS: { value: BleachStrength; label: string; dropsPerGallon: number }[] = [
  { value: "5", label: "5% (some store brands)", dropsPerGallon: 10 },
  { value: "6", label: "6% (most household bleach)", dropsPerGallon: 8 },
  { value: "8.25", label: "8.25% (concentrated)", dropsPerGallon: 6 },
];

/** Minutes at a rolling boil. */
export const boilMinutes = (altitudeM: number) => (Number.isFinite(altitudeM) && altitudeM > ALTITUDE_LIMIT_M ? 3 : 1);

export type BleachDose = { drops: number; waitMinutes: number; perLiter: number };

/**
 * Drops of bleach for `liters` of water. Rounds up to whole drops (never under-dose) and doubles
 * the dose for cloudy water. Returns null for amounts that are not a positive number or an unknown strength.
 */
export function bleachDose(liters: number, strength: BleachStrength, cloudy: boolean): BleachDose | null {
  const s = BLEACH_STRENGTHS.find((x) => x.value === strength);
  if (!s || !Number.isFinite(liters) || liters <= 0) return null;
  const perLiter = (s.dropsPerGallon / LITERS_PER_GALLON) * (cloudy ? 2 : 1);
  return { drops: Math.max(1, Math.ceil(perLiter * liters - 1e-9)), waitMinutes: 30, perLiter: Math.round(perLiter * 100) / 100 };
}

/** Rows for the quick-reference table. */
export const TABLE_LITERS = [1, 2, 4, 10, 20];

export function doseTable(strength: BleachStrength, cloudy: boolean) {
  return TABLE_LITERS.map((l) => ({ liters: l, drops: bleachDose(l, strength, cloudy)?.drops ?? 0 }));
}

/** Plain-language rule of thumb for a drop count: 20 drops are about 1 ml. */
export const dropsToMl = (drops: number) => Math.round((drops / 20) * 10) / 10;
