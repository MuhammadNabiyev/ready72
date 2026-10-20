"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarPlus, Copy, Link2, Phone, Printer, Trash2 } from "lucide-react";
import { addContact, addPoint, logDrill, planText, removeContact, removePoint, setNotes, validateContact, type ContactErrors } from "@/lib/actions";
import { DRILL_INTERVAL_DAYS, dayKey, planParts } from "@/lib/engine";
import { buildIcs } from "@/lib/ics";
import { encodeShare, toSharedPlan } from "@/lib/share";
import { commit, useApp } from "@/lib/store";
import type { ContactRole, PointKind } from "@/lib/types";
import { addDays, parseISO } from "date-fns";
import { fmtDate } from "./date-picker";
import { Field, PageTitle, SelectField, toast } from "./ui";

const ROLE_LABEL: Record<ContactRole, string> = {
  family: "Family",
  "out-of-area": "Out-of-town contact",
  neighbor: "Neighbor",
  doctor: "Doctor",
  other: "Other",
};
const KIND_LABEL: Record<PointKind, string> = {
  home: "Right outside your home",
  neighborhood: "In your neighborhood",
  "out-of-town": "Out of town",
};

export function PlanView() {
  const state = useApp();
  const today = new Date();
  const parts = planParts(state, today);

  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cRole, setCRole] = useState<ContactRole>("family");
  const [cErr, setCErr] = useState<ContactErrors>({});

  const [pKind, setPKind] = useState<PointKind>("home");
  const [pLabel, setPLabel] = useState("");
  const [pAddr, setPAddr] = useState("");
  const [pErr, setPErr] = useState("");

  const [notes, setNotesLocal] = useState(state.notes);

  function submitContact(e: React.FormEvent) {
    e.preventDefault();
    const err = validateContact({ name: cName, phone: cPhone });
    setCErr(err);
    if (Object.keys(err).length) return;
    commit((s) => addContact(s, { name: cName, phone: cPhone, role: cRole }));
    toast(`Saved ${cName.trim()}`);
    setCName("");
    setCPhone("");
  }

  function submitPoint(e: React.FormEvent) {
    e.preventDefault();
    if (!pLabel.trim()) {
      setPErr("Describe the place");
      return;
    }
    setPErr("");
    commit((s) => addPoint(s, { kind: pKind, label: pLabel, address: pAddr }));
    toast("Meeting point saved");
    setPLabel("");
    setPAddr("");
  }

  async function copyText(text: string, ok: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast(ok);
    } catch {
      toast("Copy is blocked in this browser");
    }
  }

  function downloadIcs() {
    const blob = new Blob([buildIcs(state, new Date())], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ready72-reminders.ics";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Calendar file downloaded");
  }

  const lastDrill = state.drills[0];
  const nextDue = lastDrill ? dayKey(addDays(parseISO(lastDrill), DRILL_INTERVAL_DAYS)) : null;

  return (
    <div>
      <div className="no-print">
        <PageTitle title="Family plan">
          Supplies do not help if nobody knows where to go or who to call. Write it down while it is calm.
        </PageTitle>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn btn-sm" onClick={() => window.print()} data-testid="print-plan">
            <Printer className="size-4" aria-hidden />
            Print the plan
          </button>
          <button type="button" className="btn btn-sm" onClick={() => copyText(planText(state), "Plan copied as text")} data-testid="copy-plan">
            <Copy className="size-4" aria-hidden />
            Copy as text
          </button>
          <button
            type="button"
            className="btn btn-sm"
            data-testid="copy-share"
            onClick={() => copyText(`${window.location.origin}/share#${encodeShare(toSharedPlan(state))}`, "Share link copied. It contains your plan, not your kit")}
          >
            <Link2 className="size-4" aria-hidden />
            Copy share link
          </button>
          <button type="button" className="btn btn-sm" onClick={downloadIcs} data-testid="download-ics">
            <CalendarPlus className="size-4" aria-hidden />
            Add reminders to calendar
          </button>
        </div>

        <div className="mt-14 grid gap-16 lg:grid-cols-2">
          {/* Contacts */}
          <section aria-labelledby="contacts-h">
            <h2 id="contacts-h" className="text-3xl">Emergency contacts</h2>
            <p className="mt-1 text-ink-soft">Keep one person who lives outside your area. Local lines jam first.</p>
            <ul className="mt-5 divide-y divide-rule border-y border-rule-strong" data-testid="contacts">
              {state.contacts.length === 0 && <li className="py-4 text-ink-soft" data-testid="no-contacts">No contacts yet.</li>}
              {state.contacts.map((c) => (
                <li key={c.id} className="reveal flex items-center gap-3 py-3" data-testid={`contact-${c.id}`}>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-sm text-ink-soft">{ROLE_LABEL[c.role]}</p>
                  </div>
                  <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="btn btn-sm tnum" aria-label={`Call ${c.name}`}>
                    <Phone className="size-4" aria-hidden />
                    {c.phone}
                  </a>
                  <button type="button" className="grid size-10 place-items-center rounded text-bad hover:bg-bad-soft" aria-label={`Remove ${c.name}`} onClick={() => commit((s) => removeContact(s, c.id))} data-testid={`remove-contact-${c.id}`}>
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <form onSubmit={submitContact} noValidate className="mt-6 grid gap-4 sm:grid-cols-2" data-testid="contact-form">
              <Field label="Name" htmlFor="c-name" error={cErr.name}>
                <input id="c-name" className="input" value={cName} onChange={(e) => setCName(e.target.value)} aria-invalid={!!cErr.name} data-testid="contact-name" />
              </Field>
              <Field label="Phone" htmlFor="c-phone" error={cErr.phone}>
                <input id="c-phone" className="input tnum" inputMode="tel" value={cPhone} onChange={(e) => setCPhone(e.target.value)} placeholder="+1 555 010 4417" aria-invalid={!!cErr.phone} data-testid="contact-phone" />
              </Field>
              <Field label="Who is this?" htmlFor="c-role">
                <SelectField label="Who is this?" testId="contact-role" value={cRole} onValueChange={(v) => setCRole(v as ContactRole)} options={(Object.keys(ROLE_LABEL) as ContactRole[]).map((r) => ({ value: r, label: ROLE_LABEL[r] }))} />
              </Field>
              <div className="flex items-end">
                <button type="submit" className="btn btn-primary w-full sm:w-auto" data-testid="contact-save">Save contact</button>
              </div>
            </form>
          </section>

          {/* Meeting points */}
          <section aria-labelledby="points-h">
            <h2 id="points-h" className="text-3xl">Meeting points</h2>
            <p className="mt-1 text-ink-soft">Where you meet if you cannot get home or cannot reach each other.</p>
            <ul className="mt-5 divide-y divide-rule border-y border-rule-strong" data-testid="points">
              {state.points.length === 0 && <li className="py-4 text-ink-soft" data-testid="no-points">No meeting points yet.</li>}
              {state.points.map((m) => (
                <li key={m.id} className="reveal flex items-center gap-3 py-3" data-testid={`point-${m.id}`}>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{m.label}</p>
                    <p className="text-sm text-ink-soft">
                      {KIND_LABEL[m.kind]}
                      {m.address && ` · ${m.address}`}
                    </p>
                  </div>
                  <button type="button" className="grid size-10 place-items-center rounded text-bad hover:bg-bad-soft" aria-label={`Remove ${m.label}`} onClick={() => commit((s) => removePoint(s, m.id))} data-testid={`remove-point-${m.id}`}>
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <form onSubmit={submitPoint} noValidate className="mt-6 grid gap-4 sm:grid-cols-2" data-testid="point-form">
              <Field label="Type" htmlFor="p-kind">
                <SelectField label="Type" testId="point-kind" value={pKind} onValueChange={(v) => setPKind(v as PointKind)} options={(Object.keys(KIND_LABEL) as PointKind[]).map((k) => ({ value: k, label: KIND_LABEL[k] }))} />
              </Field>
              <Field label="Place" htmlFor="p-label" error={pErr}>
                <input id="p-label" className="input" value={pLabel} onChange={(e) => setPLabel(e.target.value)} placeholder="e.g. The oak tree in the front yard" aria-invalid={!!pErr} data-testid="point-label" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Address or directions (optional)" htmlFor="p-addr">
                  <input id="p-addr" className="input" value={pAddr} onChange={(e) => setPAddr(e.target.value)} data-testid="point-address" />
                </Field>
              </div>
              <div>
                <button type="submit" className="btn btn-primary" data-testid="point-save">Save meeting point</button>
              </div>
            </form>
          </section>
        </div>

        {/* Drills and notes */}
        <div className="mt-16 grid gap-16 lg:grid-cols-2">
          <section aria-labelledby="drill-h">
            <h2 id="drill-h" className="text-3xl">Practice drills</h2>
            <p className="mt-1 text-ink-soft">Walk the plan once or twice a year: grab the go-bag, reach the meeting point, call your out-of-town contact.</p>
            <p className="mt-5 text-lg" data-testid="drill-status">
              {lastDrill ? (
                <>
                  Last drill <strong>{fmtDate(lastDrill.slice(0, 10))}</strong>
                  {parts.drillAgeDays !== null && parts.drillAgeDays > DRILL_INTERVAL_DAYS ? <span className="font-semibold text-bad"> · overdue</span> : <span> · next due {fmtDate(nextDue!)}</span>}
                </>
              ) : (
                "You have not logged a drill yet."
              )}
            </p>
            <Link href="/drill" className="btn btn-primary mt-4 mr-3" data-testid="start-timed-drill">
              Start a timed drill
            </Link>
            <button
              type="button"
              className="btn mt-4"
              data-testid="log-drill"
              onClick={() => {
                commit((s) => logDrill(s, dayKey(new Date())));
                toast("Drill logged. Nice work");
              }}
            >
              Log a drill I did today
            </button>
            {state.drills.length > 0 && (
              <ul className="mt-5 divide-y divide-rule border-y border-rule" data-testid="drills">
                {state.drills.slice(0, 5).map((d) => (
                  <li key={d} className="tnum py-2">{fmtDate(d.slice(0, 10))}</li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="notes-h">
            <h2 id="notes-h" className="text-3xl">Notes</h2>
            <p className="mt-1 text-ink-soft">Gas shutoff location, spare keys, allergies, anything someone else would need to know.</p>
            <label htmlFor="notes" className="sr-only">Notes</label>
            <textarea
              id="notes"
              rows={6}
              className="input mt-5 resize-y"
              value={notes}
              onChange={(e) => setNotesLocal(e.target.value)}
              onBlur={() => notes !== state.notes && commit((s) => setNotes(s, notes))}
              data-testid="notes"
            />
            <p className="mt-2 text-sm text-ink-soft">Saved when you leave the box.</p>
          </section>
        </div>
      </div>

      {/* What comes out of the printer */}
      <div className="print-only" data-testid="print-sheet">
        <h1 style={{ fontSize: "24pt" }}>{state.profile?.name} — emergency plan</h1>
        <h2 style={{ marginTop: "14pt" }}>Contacts</h2>
        <ul>{state.contacts.map((c) => <li key={c.id}>{c.name} ({ROLE_LABEL[c.role]}): {c.phone}</li>)}</ul>
        <h2 style={{ marginTop: "14pt" }}>Meeting points</h2>
        <ul>{state.points.map((m) => <li key={m.id}>{KIND_LABEL[m.kind]}: {m.label}{m.address ? `, ${m.address}` : ""}</li>)}</ul>
        {state.notes.trim() && (<><h2 style={{ marginTop: "14pt" }}>Notes</h2><p style={{ whiteSpace: "pre-wrap" }}>{state.notes}</p></>)}
      </div>
    </div>
  );
}
