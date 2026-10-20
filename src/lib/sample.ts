import { addDays, format, subDays } from "date-fns";
import type { Entry, State } from "./types";

/** A half-prepared family, so every screen has something real to show. Dates are relative to `today`. */
export function sampleState(today: Date): State {
  const d = (n: number) => format(addDays(today, n), "yyyy-MM-dd");
  let i = 0;
  const e = (reqId: string, name: string, qty: number, extra: Partial<Entry> = {}): Entry => ({
    id: `sample_${i++}`,
    reqId,
    name,
    qty,
    expiry: null,
    goBag: false,
    ...extra,
  });

  return {
    profile: {
      name: "The Alvarez family",
      adults: 2,
      children: 2,
      infants: 0,
      pets: 1,
      days: 3,
      hazards: ["earthquake", "wildfire", "outage"],
      meds: true,
      mobility: false,
    },
    entries: [
      e("water", "Bottled water, 6 x 6 L", 36, { expiry: d(240), goBag: false }),
      e("water", "Go-bag water pouches", 4, { expiry: d(150), goBag: true }),
      e("water", "Old jugs from the garage", 10, { expiry: d(-1) }),
      e("food", "Rice, 1 kg bag", 2, { kcalPerUnit: 3600, expiry: d(300) }),
      e("food", "Canned beans, 400 g", 12, { kcalPerUnit: 340, expiry: d(25) }),
      e("food", "Pasta, 500 g", 3, { kcalPerUnit: 1750, expiry: d(400) }),
      e("food", "Energy bar", 8, { kcalPerUnit: 250, expiry: d(120), goBag: true }),
      e("flashlight", "LED flashlights", 3, { goBag: true }),
      e("batteries", "AA battery sets", 2),
      e("powerbank", "20,000 mAh power bank", 1, { goBag: true }),
      e("firstaid", "Family first-aid kit", 1, { goBag: true }),
      e("toiletpaper", "Toilet paper", 6),
      e("sanitizer", "Hand sanitizer", 1),
      e("whistle", "Safety whistles", 2, { goBag: true }),
      e("canopener", "Manual can opener", 1),
      e("blankets", "Wool blankets", 4),
      e("idcopies", "ID and insurance copies in a dry bag", 1, { goBag: true }),
      e("cash", "Cash envelope", 1, { goBag: true }),
      e("meds", "Blood pressure medication", 5, { goBag: true, expiry: d(90) }),
      e("petfood", "Dog food", 2),
      e("n95", "N95 masks", 4, { goBag: true }),
    ],
    contacts: [{ id: "sample_c1", name: "Marisol Alvarez", phone: "+1 555 010 4417", role: "family" }],
    points: [{ id: "sample_m1", kind: "home", label: "Front yard by the oak tree", address: "" }],
    drills: [format(subDays(today, 200), "yyyy-MM-dd")],
    notes: "Gas shutoff is behind the garage. Neighbor on the left has a spare key.",
    scenarios: [],
  };
}
