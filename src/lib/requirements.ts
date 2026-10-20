import type { Category, HazardId, Profile, Requirement } from "./types";

export const HAZARDS: Record<HazardId, { label: string; blurb: string }> = {
  earthquake: { label: "Earthquake", blurb: "Strong shaking, broken gas lines, damaged roads" },
  flood: { label: "Flood", blurb: "Rising water, contaminated supply, fast evacuation" },
  wildfire: { label: "Wildfire", blurb: "Smoke, evacuation orders, poor air quality" },
  winter: { label: "Winter storm", blurb: "Cold, ice, being snowed in without heat" },
  heat: { label: "Extreme heat", blurb: "Heatwaves, higher water needs, grid strain" },
  outage: { label: "Power outage", blurb: "Hours or days without electricity" },
};

export const CATEGORY_LABEL: Record<Category, string> = {
  water: "Water",
  food: "Food",
  power: "Light & power",
  health: "First aid & health",
  meds: "Medication",
  hygiene: "Hygiene & sanitation",
  tools: "Tools & safety",
  warmth: "Warmth & shelter",
  docs: "Documents & cash",
  pets: "Pets",
};

/** scoring weight of each category; categories that do not apply to a household are dropped */
export const CATEGORY_WEIGHT: Record<Category | "plan", number> = {
  water: 20,
  food: 20,
  power: 8,
  health: 8,
  meds: 8,
  hygiene: 4,
  tools: 6,
  warmth: 4,
  docs: 8,
  pets: 5,
  plan: 14,
};

export const DAILY_WATER = { adult: 4, child: 3, infant: 2, pet: 1 } as const;
export const DAILY_KCAL = { adult: 2000, child: 1500, infant: 800 } as const;

export const people = (p: Profile) => p.adults + p.children + p.infants;

export const baseDailyWater = (p: Profile) =>
  p.adults * DAILY_WATER.adult + p.children * DAILY_WATER.child + p.infants * DAILY_WATER.infant + p.pets * DAILY_WATER.pet;

export const dailyWater = (p: Profile) => (p.hazards.includes("heat") ? baseDailyWater(p) * 1.25 : baseDailyWater(p));

export const dailyKcal = (p: Profile) =>
  p.adults * DAILY_KCAL.adult + p.children * DAILY_KCAL.child + p.infants * DAILY_KCAL.infant;

/** Pantry staples offered in the "add food" dialog. kcal are per unit as sold. */
export const FOOD_PRESETS = [
  { id: "rice", name: "Rice, 1 kg bag", kcal: 3600 },
  { id: "pasta", name: "Pasta, 500 g", kcal: 1750 },
  { id: "beans", name: "Canned beans, 400 g", kcal: 340 },
  { id: "tuna", name: "Canned tuna, 160 g", kcal: 190 },
  { id: "soup", name: "Canned soup, 400 g", kcal: 200 },
  { id: "pb", name: "Peanut butter, 340 g jar", kcal: 2000 },
  { id: "crackers", name: "Crackers, 200 g", kcal: 850 },
  { id: "bars", name: "Energy bar", kcal: 250 },
  { id: "fruit", name: "Dried fruit, 200 g", kcal: 560 },
  { id: "noodles", name: "Instant noodles, pack", kcal: 380 },
] as const;

type Draft = Omit<Requirement, "category" | "critical" | "goBag"> & Partial<Pick<Requirement, "critical" | "goBag">>;

function req(category: Category, d: Draft): Requirement {
  return { critical: false, goBag: false, ...d, category };
}

/** The full, personalised list of things a household needs, derived only from the profile. */
export function buildRequirements(p: Profile): Requirement[] {
  const n = Math.max(1, people(p));
  const D = p.days;
  const has = (h: HazardId) => p.hazards.includes(h);
  const list: Requirement[] = [];

  list.push(
    req("water", {
      id: "water",
      label: "Drinking water",
      kind: "water",
      need: Math.ceil(dailyWater(p) * D),
      unit: "L",
      hint: `${dailyWater(p)} L a day for ${D} days${has("heat") ? " (+25% for heat)" : ""}. Counts drinking and basic hygiene.`,
      critical: true,
      goBag: true,
    }),
    req("food", {
      id: "food",
      label: "Non-perishable food",
      kind: "food",
      need: dailyKcal(p) * D,
      unit: "kcal",
      hint: `${dailyKcal(p).toLocaleString("en-US")} kcal a day for ${D} days. Choose food that needs no cooking or little water.`,
      critical: true,
      goBag: true,
    }),
    req("power", { id: "flashlight", label: "Flashlights or headlamps", kind: "count", need: n, unit: "pcs", hint: "One per person, so hands stay free.", critical: true, goBag: true }),
    req("power", { id: "batteries", label: "Spare battery sets", kind: "count", need: 2, unit: "sets", hint: "Match the sizes your flashlights and radio use." }),
    req("power", { id: "powerbank", label: "Charged power bank", kind: "count", need: Math.max(1, Math.ceil(n / 2)), unit: "pcs", hint: "Roughly one per two people to keep phones alive.", goBag: true }),
    req("power", { id: "radio", label: "Battery or hand-crank radio", kind: "count", need: 1, unit: "pcs", hint: "Official alerts keep coming when the networks are down." }),
    req("health", { id: "firstaid", label: "First-aid kit", kind: "count", need: 1, unit: "kit", hint: "Bandages, antiseptic, gloves, tape, pain relief.", critical: true, goBag: true }),
    req("hygiene", { id: "toiletpaper", label: "Toilet paper", kind: "count", need: Math.max(1, Math.ceil((n * D) / 4)), unit: "rolls", hint: "About one roll per person every four days." }),
    req("hygiene", { id: "sanitizer", label: "Hand sanitizer or wipes", kind: "check", need: 1, unit: "", hint: "Water may be scarce, so keep hands clean without it." }),
    req("hygiene", { id: "trashbags", label: "Trash bags and ties", kind: "check", need: 1, unit: "", hint: "Also usable as an emergency toilet liner." }),
    req("hygiene", { id: "personal", label: "Personal hygiene items", kind: "check", need: 1, unit: "", hint: "Toothpaste, soap, menstrual products, glasses or lens supplies." }),
    req("tools", { id: "whistle", label: "Whistles", kind: "count", need: n, unit: "pcs", hint: "One per person. Three blasts signals for help.", goBag: true }),
    req("tools", { id: "multitool", label: "Multi-tool or knife", kind: "count", need: 1, unit: "pcs", hint: "" }),
    req("tools", { id: "canopener", label: "Manual can opener", kind: "check", need: 1, unit: "", hint: "Canned food is useless without one." }),
    req("tools", { id: "ducttape", label: "Duct tape and plastic sheeting", kind: "check", need: 1, unit: "", hint: "Quick repairs and sealing a room." }),
    req("tools", { id: "extinguisher", label: "Fire extinguisher", kind: "check", need: 1, unit: "", hint: "Check the pressure gauge once a year." }),
    req("tools", { id: "purify", label: "Water purification tablets or filter", kind: "check", need: 1, unit: "", hint: "A backup if your stored water runs out." }),
    req("warmth", { id: "blankets", label: "Blankets or sleeping bags", kind: "count", need: n, unit: "pcs", hint: "One per person." }),
    req("docs", { id: "idcopies", label: "ID and insurance copies", kind: "check", need: 1, unit: "", hint: "Waterproof bag, plus a copy stored digitally.", critical: true, goBag: true }),
    req("docs", { id: "paperlist", label: "Paper list of phone numbers", kind: "check", need: 1, unit: "", hint: "Phones die. Paper does not.", goBag: true }),
    req("docs", { id: "cash", label: "Cash in small bills", kind: "check", need: 1, unit: "", hint: "Cards and ATMs fail in outages.", goBag: true }),
  );

  if (p.meds) {
    list.push(
      req("meds", { id: "meds", label: "Prescription medication", kind: "days", need: Math.max(D, 7), unit: "days", hint: "Days of supply on hand. Ask your pharmacy about an emergency refill.", critical: true, goBag: true }),
      req("meds", { id: "medlist", label: "Medication and allergy list", kind: "check", need: 1, unit: "", hint: "Names, doses, doctor contacts.", goBag: true }),
    );
  }
  if (p.mobility) {
    list.push(req("health", { id: "mobility", label: "Backup for mobility equipment", kind: "check", need: 1, unit: "", hint: "Spare batteries, manual backup, a charged power source.", critical: true }));
  }
  if (p.infants > 0) {
    list.push(req("health", { id: "infant", label: "Infant formula, diapers and wipes", kind: "days", need: D, unit: "days", hint: "Days of supply for each infant.", critical: true, goBag: true }));
  }
  if (p.pets > 0) {
    list.push(
      req("pets", { id: "petfood", label: "Pet food", kind: "days", need: D, unit: "days", hint: "Days of food on hand.", critical: true, goBag: true }),
      req("pets", { id: "petcarrier", label: "Carrier, leash or harness", kind: "check", need: 1, unit: "", hint: "Needed to evacuate with your pets.", goBag: true }),
      req("pets", { id: "petrecords", label: "Vaccination records", kind: "check", need: 1, unit: "", hint: "Shelters often require them." }),
    );
  }

  if (has("earthquake")) {
    list.push(
      req("tools", { id: "shoes", label: "Sturdy shoes by each bed", kind: "check", need: 1, unit: "", hint: "Broken glass is the common injury after shaking." }),
      req("tools", { id: "gaswrench", label: "Gas shutoff wrench", kind: "check", need: 1, unit: "", hint: "Learn where the valve is and when to use it." }),
    );
  }
  if (has("flood")) {
    list.push(
      req("docs", { id: "drybag", label: "Waterproof bag for documents", kind: "check", need: 1, unit: "", hint: "", goBag: true }),
      req("tools", { id: "boots", label: "Rubber boots", kind: "check", need: 1, unit: "", hint: "Floodwater carries contamination." }),
    );
  }
  if (has("wildfire")) {
    list.push(
      req("health", { id: "n95", label: "N95 masks", kind: "count", need: n * 2, unit: "pcs", hint: "Two per person. Smoke can travel far.", goBag: true }),
      req("tools", { id: "goggles", label: "Safety goggles", kind: "count", need: n, unit: "pcs", hint: "One per person." }),
    );
  }
  if (has("winter")) {
    list.push(
      req("warmth", { id: "warmclothes", label: "Warm layers, hats and gloves", kind: "check", need: 1, unit: "", hint: "For every person, kept together." }),
      req("warmth", { id: "handwarmers", label: "Hand and body warmers", kind: "count", need: n * 2, unit: "pcs", hint: "Two per person." }),
    );
  }
  if (has("heat")) {
    list.push(
      req("health", { id: "electrolytes", label: "Electrolyte or hydration mix", kind: "check", need: 1, unit: "", hint: "" }),
      req("power", { id: "fan", label: "Battery-powered fan", kind: "count", need: 1, unit: "pcs", hint: "" }),
    );
  }
  if (has("outage")) {
    list.push(
      req("power", { id: "lantern", label: "LED lanterns", kind: "count", need: 2, unit: "pcs", hint: "Better than candles, with no fire risk." }),
      req("tools", { id: "cooler", label: "Cooler and ice packs", kind: "check", need: 1, unit: "", hint: "Keeps medicine and food cold during short outages." }),
    );
  }

  return list;
}
