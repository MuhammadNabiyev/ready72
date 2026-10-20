import { uid } from "./engine";
import { buildRequirements } from "./requirements";
import type { Contact, ContactRole, Entry, MeetingPoint, PointKind, Profile, Requirement, State } from "./types";

/* ------------------------------------------------------------------ */
/* validation (pure; returns an error code per field)                  */
/* ------------------------------------------------------------------ */

export type ProfileErrors = Partial<Record<"adults" | "children" | "infants" | "pets" | "total", string>>;

const inRange = (n: number, lo: number, hi: number) => Number.isInteger(n) && n >= lo && n <= hi;

export function validateProfile(p: Profile): ProfileErrors {
  const e: ProfileErrors = {};
  if (!inRange(p.adults, 1, 10)) e.adults = "Between 1 and 10 adults";
  if (!inRange(p.children, 0, 10)) e.children = "Between 0 and 10 children";
  if (!inRange(p.infants, 0, 5)) e.infants = "Between 0 and 5 infants";
  if (!inRange(p.pets, 0, 10)) e.pets = "Between 0 and 10 pets";
  if (!e.adults && !e.children && !e.infants && p.adults + p.children + p.infants > 20) e.total = "At most 20 people";
  return e;
}

export type EntryErrors = Partial<Record<"name" | "qty" | "kcalPerUnit" | "expiry", string>>;

export function validateEntry(req: Requirement, e: Omit<Entry, "id">): EntryErrors {
  const err: EntryErrors = {};
  if (!e.name.trim()) err.name = "Give it a name";
  if (req.kind === "check") {
    // qty is implied
  } else if (!(Number.isFinite(e.qty) && e.qty > 0)) {
    err.qty = "Enter an amount above 0";
  } else if (req.kind !== "water" && !Number.isInteger(e.qty)) {
    err.qty = "Use a whole number";
  }
  if (req.kind === "food" && !(Number.isFinite(e.kcalPerUnit) && (e.kcalPerUnit ?? 0) > 0)) {
    err.kcalPerUnit = "Enter calories per unit";
  }
  if (e.expiry && !/^\d{4}-\d{2}-\d{2}$/.test(e.expiry)) err.expiry = "Use a valid date";
  return err;
}

export type ContactErrors = Partial<Record<"name" | "phone", string>>;

export const phoneDigits = (s: string) => s.replace(/\D/g, "");

export function validateContact(c: { name: string; phone: string }): ContactErrors {
  const e: ContactErrors = {};
  if (!c.name.trim()) e.name = "Enter a name";
  if (!/^[+\d][\d\s().-]*$/.test(c.phone.trim()) || phoneDigits(c.phone).length < 7) e.phone = "Enter a phone number with at least 7 digits";
  return e;
}

/* ------------------------------------------------------------------ */
/* state transitions                                                   */
/* ------------------------------------------------------------------ */

export function setProfile(state: State, profile: Profile): State {
  return { ...state, profile: { ...profile, name: profile.name.trim() || "My household" } };
}

export function addEntry(state: State, e: Omit<Entry, "id">): State {
  const entry: Entry = { ...e, id: uid("e"), name: e.name.trim(), qty: e.qty, expiry: e.expiry || null };
  return { ...state, entries: [...state.entries, entry] };
}

export function updateEntry(state: State, id: string, patch: Partial<Omit<Entry, "id">>): State {
  return { ...state, entries: state.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) };
}

export const removeEntry = (state: State, id: string): State => ({ ...state, entries: state.entries.filter((e) => e.id !== id) });

/** Add the missing amount of a requirement in one step (shopping list: "mark as bought"). */
export function addPurchase(state: State, reqId: string, missing: number): State {
  if (!state.profile) return state;
  const req = buildRequirements(state.profile).find((r) => r.id === reqId);
  if (!req || missing <= 0) return state;
  return addEntry(state, {
    reqId,
    name: "Shopping trip",
    qty: req.kind === "check" ? 1 : req.kind === "food" ? 1 : missing,
    kcalPerUnit: req.kind === "food" ? missing : undefined,
    expiry: null,
    goBag: false,
  });
}

export function addContact(state: State, c: { name: string; phone: string; role: ContactRole }): State {
  const contact: Contact = { id: uid("c"), name: c.name.trim(), phone: c.phone.trim(), role: c.role };
  return { ...state, contacts: [...state.contacts, contact] };
}
export const removeContact = (state: State, id: string): State => ({ ...state, contacts: state.contacts.filter((c) => c.id !== id) });

export function addPoint(state: State, p: { kind: PointKind; label: string; address: string }): State {
  const point: MeetingPoint = { id: uid("m"), kind: p.kind, label: p.label.trim(), address: p.address.trim() };
  return { ...state, points: [...state.points, point] };
}
export const removePoint = (state: State, id: string): State => ({ ...state, points: state.points.filter((p) => p.id !== id) });

/** `iso` is the day the drill took place; duplicates on the same day are ignored. */
export function logDrill(state: State, iso: string): State {
  const day = iso.slice(0, 10);
  if (state.drills.some((d) => d.slice(0, 10) === day)) return state;
  return { ...state, drills: [iso, ...state.drills].sort().reverse() };
}

export const setNotes = (state: State, notes: string): State => ({ ...state, notes });

/** Plain-text version of the family plan, for copying or printing. */
export function planText(state: State): string {
  const p = state.profile;
  const lines: string[] = [];
  lines.push(`${p?.name ?? "My household"} - emergency plan`);
  lines.push("");
  lines.push("CONTACTS");
  if (!state.contacts.length) lines.push("  (none yet)");
  for (const c of state.contacts) lines.push(`  ${c.name} (${c.role}): ${c.phone}`);
  lines.push("");
  lines.push("MEETING POINTS");
  if (!state.points.length) lines.push("  (none yet)");
  for (const m of state.points) lines.push(`  ${m.kind}: ${m.label}${m.address ? `, ${m.address}` : ""}`);
  if (state.notes.trim()) {
    lines.push("");
    lines.push("NOTES");
    lines.push(`  ${state.notes.trim().replace(/\n/g, "\n  ")}`);
  }
  return lines.join("\n");
}
