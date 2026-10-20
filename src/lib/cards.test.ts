import { describe, expect, it } from "vitest";
import { addContact } from "./actions";
import { MAX_MEMBERS, NONE, addFromHousehold, addMember, buildCards, cardCompleteness, cardContacts, emptyDraft, placeholderNames, removeMember, telHref, updateMember, validateMember } from "./cards";
import { mergeState } from "./migrate";
import { EMPTY_STATE, type Profile, type State } from "./types";

const profile: Profile = { name: "The Smiths", adults: 2, children: 1, infants: 1, pets: 0, days: 3, hazards: [], meds: false, mobility: false };
const base = (patch: Partial<State> = {}): State => ({ ...EMPTY_STATE, profile, ...patch });
const draft = (over: Partial<ReturnType<typeof emptyDraft>> = {}) => ({ ...emptyDraft(), name: "Ana", ...over });

describe("member validation", () => {
  it("needs a name and limits its length", () => {
    expect(validateMember(draft({ name: "  " })).name).toBeDefined();
    expect(validateMember(draft({ name: "x".repeat(61) })).name).toBeDefined();
    expect(validateMember(draft())).toEqual({});
  });
  it("accepts every blood type and rejects anything else", () => {
    for (const b of ["", "A+", "O-", "AB+"] as const) expect(validateMember(draft({ blood: b }))).toEqual({});
    expect(validateMember(draft({ blood: "C+" as never })).blood).toBeDefined();
  });
  it("caps free-text fields", () => {
    expect(validateMember(draft({ allergies: "x".repeat(201) })).allergies).toBeDefined();
    expect(validateMember(draft({ medications: "x".repeat(201) })).medications).toBeDefined();
  });
});

describe("members", () => {
  it("adds, updates and removes without mutating", () => {
    const s0 = base();
    const s1 = addMember(s0, draft({ blood: "O+", allergies: " penicillin " }));
    expect(s0.members).toHaveLength(0);
    expect(s1.members[0]).toMatchObject({ name: "Ana", blood: "O+", allergies: "penicillin" });
    const id = s1.members[0].id;
    const s2 = updateMember(s1, id, draft({ name: "Ana Maria", blood: "A-" }));
    expect(s2.members[0]).toMatchObject({ name: "Ana Maria", blood: "A-", allergies: "" });
    expect(removeMember(s2, id).members).toHaveLength(0);
  });
  it("ignores invalid input and stops at the limit", () => {
    const s = base();
    expect(addMember(s, draft({ name: "" }))).toBe(s);
    let many = s;
    for (let i = 0; i < MAX_MEMBERS + 3; i++) many = addMember(many, draft({ name: `P${i}` }));
    expect(many.members).toHaveLength(MAX_MEMBERS);
  });
  it("names household members from the profile", () => {
    expect(placeholderNames(profile)).toEqual(["Adult 1", "Adult 2", "Child 1", "Infant 1"]);
  });
  it("adds the household once, without duplicating names or touching existing members", () => {
    const once = addFromHousehold(addMember(base(), draft({ name: "adult 1" })));
    expect(once.members.map((m) => m.name)).toEqual(["adult 1", "Adult 2", "Child 1", "Infant 1"]);
    expect(addFromHousehold(once).members).toHaveLength(4);
    expect(addFromHousehold({ ...EMPTY_STATE }).members).toHaveLength(0);
  });
  it("people you already added count toward the household, so it only fills the gap", () => {
    let s = addMember(base(), draft({ name: "Marisol" }));
    s = addMember(s, draft({ name: "Diego" }));
    s = addFromHousehold(s);
    expect(s.members).toHaveLength(4);
    expect(s.members.slice(0, 2).map((m) => m.name)).toEqual(["Marisol", "Diego"]);
    expect(addFromHousehold(s).members).toHaveLength(4);
  });
});

describe("cards", () => {
  const withPeople = (): State => {
    let s = addContact(base(), { name: "Neighbor Bob", phone: "555 0100", role: "neighbor" });
    s = addContact(s, { name: "Aunt Rosa", phone: "+34 600 111 222", role: "out-of-area" });
    s = addContact(s, { name: "Sam", phone: "555 0199", role: "family" });
    s = addContact(s, { name: "Dr Lee", phone: "555 0123", role: "doctor" });
    return addMember(s, draft({ blood: "B+", medications: "Insulin" }));
  };
  it("prints the out-of-town contact first and at most three contacts", () => {
    const c = cardContacts(withPeople().contacts);
    expect(c).toHaveLength(3);
    expect(c.map((x) => x.name)).toEqual(["Aunt Rosa", "Sam", "Neighbor Bob"]);
    expect(c[0].role).toBe("Out of town");
  });
  it("builds one card per member with the household name", () => {
    const [card] = buildCards(withPeople());
    expect(card).toMatchObject({ household: "The Smiths", name: "Ana", blood: "B+", medications: "Insulin" });
  });
  it("marks empty fields as None known rather than leaving blanks", () => {
    const [card] = buildCards(addMember(base(), draft()));
    expect(card).toMatchObject({ blood: "Not known", allergies: NONE, medications: NONE, notes: "" });
    expect(card.contacts).toEqual([]);
  });
  it("makes dialable links and summarises completeness", () => {
    expect(telHref("+34 (600) 111-222")).toBe("tel:+34600111222");
    expect(cardCompleteness(withPeople())).toEqual({ cards: 1, withMedical: 1, hasContacts: true });
    expect(cardCompleteness(addMember(base(), draft()))).toEqual({ cards: 1, withMedical: 0, hasContacts: false });
  });
});

describe("loading older saved data", () => {
  it("fills the new fields when an old save does not have them", () => {
    const old = { profile, entries: [], contacts: [], points: [], drills: [], notes: "n", scenarios: [] };
    const s = mergeState(old);
    expect(s.members).toEqual([]);
    expect(s.drillRuns).toEqual([]);
    expect(s.maintenance).toEqual({ done: {}, custom: [] });
    expect(s.notes).toBe("n");
  });
  it("replaces fields of the wrong shape instead of crashing later", () => {
    const s = mergeState({ members: "oops", drillRuns: 5, maintenance: { done: [], custom: "x" } });
    expect(s.members).toEqual([]);
    expect(s.drillRuns).toEqual([]);
    expect(s.maintenance).toEqual({ done: {}, custom: [] });
  });
  it("keeps valid new data and copes with junk input", () => {
    const mem = [{ id: "m", name: "A", blood: "O+", allergies: "", medications: "", notes: "" }];
    expect(mergeState({ members: mem, maintenance: { done: { smoke: "2026-10-01" }, custom: [] } }).maintenance.done.smoke).toBe("2026-10-01");
    expect(mergeState(null)).toEqual(EMPTY_STATE);
    expect(mergeState([1, 2])).toEqual(EMPTY_STATE);
  });
});
