import type { ContactRole, HazardId, PointKind, State } from "./types";

/** What goes into a share link: the plan only. Never the kit. */
export type SharedPlan = {
  name: string;
  hazards: HazardId[];
  contacts: { name: string; phone: string; role: ContactRole }[];
  points: { kind: PointKind; label: string; address: string }[];
  notes: string;
};

const ROLES: ContactRole[] = ["family", "out-of-area", "neighbor", "doctor", "other"];
const KINDS: PointKind[] = ["home", "neighborhood", "out-of-town"];
const HAZARD_SET = ["earthquake", "flood", "wildfire", "winter", "heat", "outage"];

export function toSharedPlan(state: State): SharedPlan {
  return {
    name: state.profile?.name ?? "My household",
    hazards: state.profile?.hazards ?? [],
    contacts: state.contacts.map((c) => ({ name: c.name, phone: c.phone, role: c.role })),
    points: state.points.map((p) => ({ kind: p.kind, label: p.label, address: p.address })),
    notes: state.notes,
  };
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function encodeShare(plan: SharedPlan): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify({ v: 1, ...plan })));
}

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.slice(0, max) : "");

/** Returns null for anything that is not a valid version 1 plan. Never throws. */
export function decodeShare(token: string): SharedPlan | null {
  try {
    const raw = JSON.parse(new TextDecoder().decode(fromBase64Url(token.trim())));
    if (!raw || raw.v !== 1) return null;
    return {
      name: str(raw.name, 80) || "Household",
      hazards: Array.isArray(raw.hazards) ? raw.hazards.filter((h: unknown): h is HazardId => HAZARD_SET.includes(h as string)) : [],
      contacts: (Array.isArray(raw.contacts) ? raw.contacts : []).slice(0, 30).map((c: Record<string, unknown>) => ({
        name: str(c.name, 80),
        phone: str(c.phone, 40),
        role: ROLES.includes(c.role as ContactRole) ? (c.role as ContactRole) : "other",
      })),
      points: (Array.isArray(raw.points) ? raw.points : []).slice(0, 30).map((p: Record<string, unknown>) => ({
        kind: KINDS.includes(p.kind as PointKind) ? (p.kind as PointKind) : "home",
        label: str(p.label, 120),
        address: str(p.address, 200),
      })),
      notes: str(raw.notes, 2000),
    };
  } catch {
    return null;
  }
}
