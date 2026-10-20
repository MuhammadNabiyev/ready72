"use client";

import { useState } from "react";
import { baseDailyWater } from "@/lib/requirements";
import { useApp } from "@/lib/store";
import { BLEACH_STRENGTHS, ALTITUDE_LIMIT_M, bleachDose, boilMinutes, doseTable, dropsToMl, type BleachStrength } from "@/lib/water";
import { Pictogram } from "./pictogram";
import { SelectField, Stepper } from "./ui";

const ALTITUDES = [
  { value: "low", label: "Below 2,000 m (6,500 ft)" },
  { value: "high", label: "2,000 m (6,500 ft) or higher" },
];

/** Boiling time and bleach drops for making unsafe water drinkable. */
export function WaterTreatment() {
  const state = useApp();
  const [altitude, setAltitude] = useState("low");
  const [liters, setLiters] = useState(4);
  const [strength, setStrength] = useState<BleachStrength>("6");
  const [cloudy, setCloudy] = useState(false);

  const boil = boilMinutes(altitude === "high" ? ALTITUDE_LIMIT_M + 1 : 0);
  const dose = bleachDose(liters, strength, cloudy);
  const table = doseTable(strength, cloudy);
  const daily = state.profile ? Math.ceil(baseDailyWater(state.profile)) : null;
  const dailyDose = daily ? bleachDose(daily, strength, cloudy) : null;

  return (
    <section aria-labelledby="water-h" className="mt-20 border-t border-rule-strong pt-10" data-testid="water-helper">
      <h2 id="water-h" className="flex items-center gap-3 text-[clamp(1.75rem,4vw,2.5rem)]">
        <Pictogram name="water" className="size-9" />
        Make water safe to drink
      </h2>
      <p className="mt-2 max-w-[60ch] text-ink-soft">
        When the tap is off or the boil notice is on. Boiling is best. Bleach works when you cannot make a fire.
      </p>

      <div className="mt-8 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="field-label">Where you are</p>
          <SelectField label="Altitude" testId="water-altitude" value={altitude} onValueChange={setAltitude} options={ALTITUDES} />
        </div>
        <div>
          <p className="field-label">Bleach strength</p>
          <SelectField label="Bleach strength" testId="water-strength" value={strength} onValueChange={(v) => setStrength(v as BleachStrength)} options={BLEACH_STRENGTHS.map((s) => ({ value: s.value, label: s.label }))} />
        </div>
        <div>
          <p className="field-label">Liters to treat</p>
          <Stepper label="liters" testId="water-liters" value={liters} onChange={setLiters} min={1} max={100} />
        </div>
        <div>
          <p className="field-label">Water looks</p>
          <div className="flex gap-2" role="group" aria-label="Water clarity">
            <button type="button" className="chip" aria-pressed={!cloudy} onClick={() => setCloudy(false)} data-testid="water-clear">Clear</button>
            <button type="button" className="chip" aria-pressed={cloudy} onClick={() => setCloudy(true)} data-testid="water-cloudy">Cloudy</button>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div>
          <h3 className="border-b border-rule-strong pb-2 text-2xl">Boil it</h3>
          <p className="mt-4">
            <span className="tnum text-6xl font-black tracking-[-0.03em]" data-testid="water-boil">{boil}</span>
            <span className="ml-2 text-xl font-bold">{boil === 1 ? "minute" : "minutes"} at a rolling boil</span>
          </p>
          <p className="mt-2 text-ink-soft">
            {boil === 3 ? "Water boils at a lower temperature up high, so it needs longer." : "Let it cool covered, then pour it into clean containers."}
            {cloudy && " Strain cloudy water through a clean cloth first."}
          </p>
        </div>

        <div>
          <h3 className="border-b border-rule-strong pb-2 text-2xl">Or use plain bleach</h3>
          {dose ? (
            <>
              <p className="mt-4" data-testid="water-dose">
                <span className="tnum text-6xl font-black tracking-[-0.03em]" data-testid="water-drops">{dose.drops}</span>
                <span className="ml-2 text-xl font-bold">drops for {liters} {liters === 1 ? "liter" : "liters"}</span>
              </p>
              <p className="mt-2 text-ink-soft" data-testid="water-wait">
                About {dropsToMl(dose.drops)} ml. Stir, then wait {dose.waitMinutes} minutes. It should smell faintly of chlorine; if not, repeat once and wait 15 more minutes.
              </p>
            </>
          ) : (
            <p className="mt-4 text-ink-soft">Choose how much water to treat.</p>
          )}
          <p className="mt-3 border-l-4 border-yellow pl-3 text-sm font-semibold">
            Use only plain, unscented household bleach. Not scented, color-safe, or with added cleaners.
          </p>
          {dailyDose && daily && (
            <p className="mt-3 text-sm text-ink-soft" data-testid="water-daily">
              Your household drinks about {daily} L a day, so a day of treated water takes {dailyDose.drops} drops.
            </p>
          )}
        </div>
      </div>

      <table className="mt-10 w-full max-w-xl text-left" data-testid="water-table">
        <caption className="sr-only">Drops of {strength}% bleach per amount of {cloudy ? "cloudy" : "clear"} water</caption>
        <thead>
          <tr className="border-b border-rule-strong">
            <th scope="col" className="py-2 pr-4">Water</th>
            <th scope="col" className="py-2">Bleach</th>
          </tr>
        </thead>
        <tbody>
          {table.map((r) => (
            <tr key={r.liters} className="border-b border-rule" data-testid={`water-row-${r.liters}`}>
              <th scope="row" className="py-2 pr-4 font-semibold">{r.liters} {r.liters === 1 ? "liter" : "liters"}</th>
              <td className="tnum py-2">{r.drops} drops</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
