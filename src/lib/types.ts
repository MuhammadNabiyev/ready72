export type HazardId = "earthquake" | "flood" | "wildfire" | "winter" | "heat" | "outage";

export const HAZARD_IDS: HazardId[] = ["earthquake", "flood", "wildfire", "winter", "heat", "outage"];

export type TargetDays = 3 | 7 | 14;

export type Profile = {
  name: string;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  days: TargetDays;
  hazards: HazardId[];
  /** someone in the household takes regular prescription medication */
  meds: boolean;
  /** someone needs mobility help */
  mobility: boolean;
};

export type Category =
  | "water"
  | "food"
  | "power"
  | "health"
  | "meds"
  | "hygiene"
  | "tools"
  | "warmth"
  | "docs"
  | "pets";

export const CATEGORY_ORDER: Category[] = [
  "water",
  "food",
  "power",
  "health",
  "meds",
  "hygiene",
  "tools",
  "warmth",
  "docs",
  "pets",
];

/**
 * water  – liters             food  – kcal (entries carry kcal per unit)
 * count  – pieces             days  – days of supply on hand
 * check  – yes/no
 */
export type ReqKind = "water" | "food" | "count" | "days" | "check";

export type Requirement = {
  id: string;
  label: string;
  category: Category;
  kind: ReqKind;
  need: number;
  unit: string;
  hint: string;
  critical: boolean;
  /** counts toward the 15-minute evacuation check when the entry is flagged as go-bag */
  goBag: boolean;
};

export type Entry = {
  id: string;
  reqId: string;
  name: string;
  qty: number;
  /** food only */
  kcalPerUnit?: number;
  /** yyyy-MM-dd */
  expiry: string | null;
  goBag: boolean;
};

export type ContactRole = "family" | "out-of-area" | "neighbor" | "doctor" | "other";

export type Contact = { id: string; name: string; phone: string; role: ContactRole };

export type PointKind = "home" | "neighborhood" | "out-of-town";

export type MeetingPoint = { id: string; kind: PointKind; label: string; address: string };

export type State = {
  profile: Profile | null;
  entries: Entry[];
  contacts: Contact[];
  points: MeetingPoint[];
  /** ISO dates of practised drills, newest first */
  drills: string[];
  notes: string;
};

export const EMPTY_STATE: State = {
  profile: null,
  entries: [],
  contacts: [],
  points: [],
  drills: [],
  notes: "",
};
