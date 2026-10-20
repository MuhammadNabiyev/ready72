import type { BloodType, Contact, Member, Profile, State } from "./types";

export const BLOOD_TYPES: BloodType[] = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const BLOOD_LABEL = (b: BloodType) => (b === "" ? "Not known" : b);

export const MAX_MEMBERS = 20;
const MAX_TEXT = 200;

export type MemberDraft = Omit<Member, "id">;
export type MemberErrors = Partial<Record<"name" | "blood" | "allergies" | "medications" | "notes", string>>;

export const emptyDraft = (): MemberDraft => ({ name: "", blood: "", allergies: "", medications: "", notes: "" });

export function validateMember(d: MemberDraft): MemberErrors {
  const e: MemberErrors = {};
  if (!d.name.trim()) e.name = "Enter a name";
  else if (d.name.trim().length > 60) e.name = "Keep the name under 60 characters";
  if (!BLOOD_TYPES.includes(d.blood)) e.blood = "Pick a blood type from the list";
  for (const k of ["allergies", "medications", "notes"] as const) {
    if (d[k].trim().length > MAX_TEXT) e[k] = `Keep it under ${MAX_TEXT} characters`;
  }
  return e;
}

let seq = 0;

export function addMember(state: State, d: MemberDraft): State {
  if (Object.keys(validateMember(d)).length || state.members.length >= MAX_MEMBERS) return state;
  const member: Member = {
    id: `mem_${Date.now().toString(36)}${(seq++).toString(36)}`,
    name: d.name.trim(),
    blood: d.blood,
    allergies: d.allergies.trim(),
    medications: d.medications.trim(),
    notes: d.notes.trim(),
  };
  return { ...state, members: [...state.members, member] };
}

export function updateMember(state: State, id: string, d: MemberDraft): State {
  if (Object.keys(validateMember(d)).length) return state;
  return {
    ...state,
    members: state.members.map((m) =>
      m.id === id ? { ...m, name: d.name.trim(), blood: d.blood, allergies: d.allergies.trim(), medications: d.medications.trim(), notes: d.notes.trim() } : m,
    ),
  };
}

export const removeMember = (state: State, id: string): State => ({ ...state, members: state.members.filter((m) => m.id !== id) });

/** "Adult 1", "Adult 2", "Child 1", "Infant 1" for everyone in the household profile. */
export function placeholderNames(p: Profile): string[] {
  const names: string[] = [];
  const add = (label: string, n: number) => {
    for (let i = 1; i <= n; i++) names.push(`${label} ${i}`);
  };
  add("Adult", p.adults);
  add("Child", p.children);
  add("Infant", p.infants);
  return names;
}

/** Add one blank-but-named member for each person in the household who has no card yet. Never duplicates a name. */
export function addFromHousehold(state: State): State {
  if (!state.profile) return state;
  const have = new Set(state.members.map((m) => m.name.toLowerCase()));
  let next = state;
  for (const name of placeholderNames(state.profile)) {
    if (!have.has(name.toLowerCase())) next = addMember(next, { ...emptyDraft(), name });
  }
  return next;
}

/** Shown on a card when a field is empty, so a responder can tell "none" from "forgot to fill in". */
export const NONE = "None known";

export type Card = {
  id: string;
  household: string;
  name: string;
  blood: string;
  allergies: string;
  medications: string;
  notes: string;
  contacts: { name: string; phone: string; role: string }[];
};

const ROLE_ORDER: Contact["role"][] = ["out-of-area", "family", "neighbor", "doctor", "other"];
const ROLE_NAME: Record<Contact["role"], string> = { "out-of-area": "Out of town", family: "Family", neighbor: "Neighbor", doctor: "Doctor", other: "Contact" };

/** The contacts printed on a card: the out-of-town contact first, then family, at most `max`. */
export function cardContacts(contacts: Contact[], max = 3) {
  return [...contacts]
    .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))
    .slice(0, max)
    .map((c) => ({ name: c.name, phone: c.phone, role: ROLE_NAME[c.role] }));
}

export function buildCards(state: State): Card[] {
  const household = state.profile?.name ?? "My household";
  const contacts = cardContacts(state.contacts);
  return state.members.map((m) => ({
    id: m.id,
    household,
    name: m.name,
    blood: BLOOD_LABEL(m.blood),
    allergies: m.allergies.trim() || NONE,
    medications: m.medications.trim() || NONE,
    notes: m.notes.trim(),
    contacts,
  }));
}

/** Phone number as a tel: target. */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** How many cards carry medical details, and whether the plan has any contacts to print on them. */
export function cardCompleteness(state: State): { cards: number; withMedical: number; hasContacts: boolean } {
  return {
    cards: state.members.length,
    withMedical: state.members.filter((m) => m.blood !== "" || m.allergies.trim() || m.medications.trim()).length,
    hasContacts: state.contacts.length > 0,
  };
}
