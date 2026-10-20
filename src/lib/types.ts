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

export type Scenario = {
  id: string;
  name: string;
  summary: string;
  days: number;
  /** multiply base water need (heat) */
  waterMult: number;
  /** only items flagged as go-bag count */
  goBag: boolean;
  /** requirement ids that must be fully met, when they apply to this household */
  extras: string[];
  needsContact: boolean;
  needsOutsidePoint: boolean;
  /** true for scenarios the user created */
  custom?: boolean;
};

export type BloodType = "" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

/** A person in the household, used for the printable emergency wallet cards. */
export type Member = {
  id: string;
  name: string;
  /** empty string = unknown */
  blood: BloodType;
  allergies: string;
  medications: string;
  /** anything a responder should know: conditions, implants, language, mobility */
  notes: string;
};

export type CustomTask = { id: string; label: string; everyDays: number };

/** Home maintenance: when each recurring task was last done (yyyy-MM-dd) plus the user's own tasks. */
export type Maintenance = { done: Record<string, string>; custom: CustomTask[] };

/** One timed evacuation drill. */
export type DrillRun = {
  /** yyyy-MM-dd */
  date: string;
  seconds: number;
  stepsDone: number;
  stepsTotal: number;
};

export type State = {
  profile: Profile | null;
  entries: Entry[];
  contacts: Contact[];
  points: MeetingPoint[];
  /** ISO dates of practised drills, newest first */
  drills: string[];
  notes: string;
  /** scenarios created by the user */
  scenarios: Scenario[];
  /** people for the emergency wallet cards */
  members: Member[];
  /** recurring home maintenance */
  maintenance: Maintenance;
  /** timed evacuation drills, newest first */
  drillRuns: DrillRun[];
};

export const EMPTY_STATE: State = {
  profile: null,
  entries: [],
  contacts: [],
  points: [],
  drills: [],
  notes: "",
  scenarios: [],
  members: [],
  maintenance: { done: {}, custom: [] },
  drillRuns: [],
};
