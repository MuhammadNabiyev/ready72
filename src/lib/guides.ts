import type { HazardId } from "./types";

export type Guide = { headline: string; before: string[]; during: string[]; after: string[] };

/** General public-safety guidance, in line with what civil-protection agencies publish. */
export const GUIDES: Record<HazardId, Guide> = {
  earthquake: {
    headline: "Drop, Cover, and Hold On",
    before: [
      "Anchor tall furniture and the water heater to the wall.",
      "Learn where the gas shutoff is and how it works.",
      "Keep sturdy shoes and a flashlight next to every bed.",
      "Agree on a meeting point you can reach on foot.",
    ],
    during: [
      "Drop to your hands and knees, cover your head and neck, and hold on to something sturdy.",
      "Stay where you are until the shaking stops. Do not run outside.",
      "In bed: stay there and protect your head with a pillow.",
      "Outdoors: move away from buildings, streetlights and power lines.",
      "Driving: pull over somewhere clear and stay in the car.",
    ],
    after: [
      "Expect aftershocks and be ready to drop, cover and hold on again.",
      "Wear shoes. Broken glass is everywhere.",
      "If you smell gas or hear hissing, leave and shut the gas off only if it is safe to reach.",
      "Text instead of calling so the phone lines stay free.",
      "Near the coast and the shaking was long or strong? Move to high ground without waiting for a siren.",
    ],
  },
  flood: {
    headline: "Turn around, don't drown",
    before: [
      "Know your evacuation route and whether your street floods.",
      "Keep documents in a waterproof bag, stored high.",
      "Check whether your insurance covers flood damage. Many policies do not.",
    ],
    during: [
      "Move to higher ground early. Do not wait for water to enter the house.",
      "Never walk, swim or drive through floodwater. A foot of moving water can carry a car away.",
      "Stay away from downed power lines and anything they touch.",
    ],
    after: [
      "Return only when the authorities say it is safe.",
      "Floodwater is contaminated. Avoid it, and wear boots and gloves if you must wade.",
      "Throw out food that touched floodwater, including cans that cannot be sanitized.",
      "Treat tap water as unsafe until officials say otherwise. Boil or use your stored water.",
      "Photograph the damage before you clean up.",
    ],
  },
  wildfire: {
    headline: "Leave early, not late",
    before: [
      "Clear dry leaves and brush from around the house.",
      "Know two ways out of your area and sign up for local alerts.",
      "Keep N95 masks. Cloth and surgical masks do not filter smoke.",
      "Plan where the pets go and keep carriers ready.",
    ],
    during: [
      "When told to evacuate, go right away. Fires move faster than people expect.",
      "Close car windows and set the vents to recirculate.",
      "If smoke is heavy at home, keep windows shut and stay in one room with the cleanest air.",
    ],
    after: [
      "Do not return until officials say it is safe.",
      "Watch for hot spots, ash pits and fallen trees.",
      "Wear an N95 mask and gloves when you clean ash.",
      "Discard food exposed to heat, smoke or soot.",
    ],
  },
  winter: {
    headline: "Stay warm without poisoning yourself",
    before: [
      "Weatherstrip doors and windows and know how to protect your pipes.",
      "Store blankets, hats and gloves where you can find them in the dark.",
      "Keep a working carbon monoxide alarm with fresh batteries.",
    ],
    during: [
      "Stay indoors, wear layers and close off rooms you do not need.",
      "Never run a generator, grill, camp stove or gas oven indoors for heat. Carbon monoxide kills.",
      "Keep drinking fluids and eating. Your body makes heat from food.",
      "Shivering, confusion and drowsiness are signs of hypothermia. Warm the person slowly and call for help.",
      "Check on neighbors, especially older people.",
    ],
    after: [
      "Shovel in small stretches. Overexertion is a real risk in cold.",
      "Stay far from downed lines.",
      "Check pipes for cracks before you turn the water back on.",
    ],
  },
  heat: {
    headline: "Drink before you are thirsty",
    before: [
      "Find the cool places nearby: libraries, malls, community centers.",
      "Add 25% to your water store. Ready72 does this when you pick heat.",
      "Agree who checks on older relatives and neighbors.",
    ],
    during: [
      "Drink water regularly, without waiting to feel thirsty.",
      "Stay in the coolest room, wear light loose clothing and take cool showers.",
      "Never leave a child or pet in a parked car.",
      "Heavy sweating, cold clammy skin, nausea or a weak fast pulse mean heat exhaustion: cool down and sip water.",
      "Hot dry skin, confusion or a body temperature of 40 °C (104 °F) is heat stroke. Call emergency services now.",
    ],
    after: ["Keep drinking and rest. You may feel drained for a day or two."],
  },
  outage: {
    headline: "Keep the fridge closed",
    before: [
      "Keep devices charged when storms or heat are forecast.",
      "Learn to open the garage door manually.",
      "Keep a cooler and ice packs for medicine that needs to stay cold.",
    ],
    during: [
      "Keep the fridge and freezer doors shut. A fridge stays cold about 4 hours, a full freezer about 48.",
      "Use flashlights and LED lanterns instead of candles.",
      "Run generators outdoors only, at least 6 meters (20 ft) from windows and doors.",
      "Check on neighbors, especially anyone who relies on powered medical equipment.",
    ],
    after: [
      "Throw out perishable food that was above 4 °C (40 °F) for more than 2 hours.",
      "Wait a few minutes before plugging appliances back in to avoid a surge.",
    ],
  },
};

export const GUIDE_DISCLAIMER =
  "General guidance based on public recommendations from civil-protection and health agencies. Always follow instructions from your local authorities.";
