"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Printer, Trash2, UsersRound } from "lucide-react";
import { BLOOD_LABEL, BLOOD_TYPES, addFromHousehold, addMember, buildCards, emptyDraft, removeMember, updateMember, validateMember, type Card, type MemberDraft, type MemberErrors } from "@/lib/cards";
import { commit, useApp } from "@/lib/store";
import type { BloodType } from "@/lib/types";
import { Field, PageTitle, SelectField, toast } from "./ui";

const UNKNOWN = "unknown";
const toOption = (b: BloodType) => ({ value: b === "" ? UNKNOWN : b, label: BLOOD_LABEL(b) });

/* The card is drawn with fixed colors on purpose: it must print black on white whatever theme is on screen. */
const PRINT_CSS = `
.wallet-sheet { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 90mm), 90mm)); gap: 6mm; justify-content: start; }
.wallet-card { break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
@media print {
  @page { margin: 10mm; size: A4; }
  html, body { background: #fff !important; }
  main { padding: 0 !important; max-width: none !important; }
  .wallet-sheet { grid-template-columns: repeat(2, 90mm); }
}
`;

function WalletCard({ card }: { card: Card }) {
  return (
    <article
      className="wallet-card flex min-h-[56mm] w-full max-w-[90mm] flex-col overflow-hidden rounded-[3mm] border-[0.4mm] border-dashed border-[#6b6b6b] bg-white text-[#141414]"
      data-testid={`card-${card.id}`}
      aria-label={`Emergency card for ${card.name}`}
    >
      <header className="flex items-center justify-between gap-3 bg-[#141414] px-[4mm] py-[1.6mm] text-[#f2b705]">
        <span className="text-[7.5pt] font-extrabold tracking-[0.14em] uppercase">In case of emergency</span>
        <span className="truncate text-[7.5pt] font-bold">{card.household}</span>
      </header>
      <div className="flex flex-1 flex-col gap-[1.6mm] px-[4mm] py-[2.4mm]">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15pt] leading-tight font-black" data-testid="card-print-name">{card.name}</h3>
          <div className="shrink-0 rounded-[1.5mm] border-[0.5mm] border-[#141414] px-[2mm] py-[0.6mm] text-center leading-none">
            <span className="block text-[5.5pt] font-bold tracking-wider uppercase">Blood</span>
            <span className="block text-[13pt] font-black" data-testid="card-print-blood">{card.blood === "Not known" ? "?" : card.blood}</span>
          </div>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-[2.4mm] gap-y-[0.8mm] text-[7.5pt] leading-snug">
          <dt className="font-extrabold uppercase">Allergies</dt>
          <dd data-testid="card-print-allergies">{card.allergies}</dd>
          <dt className="font-extrabold uppercase">Medication</dt>
          <dd data-testid="card-print-meds">{card.medications}</dd>
          {card.notes && (
            <>
              <dt className="font-extrabold uppercase">Notes</dt>
              <dd>{card.notes}</dd>
            </>
          )}
        </dl>
      </div>
      <footer className="border-t-[0.4mm] border-[#141414] px-[4mm] py-[1.6mm] text-[7.5pt] leading-snug">
        {card.contacts.length === 0 ? (
          <p className="italic">Add contacts in the family plan to print them here.</p>
        ) : (
          <ul>
            {card.contacts.map((c) => (
              <li key={c.phone + c.name} className="flex justify-between gap-2">
                <span><strong>{c.name}</strong> <span className="text-[#555]">({c.role})</span></span>
                <span className="font-bold tabular-nums">{c.phone}</span>
              </li>
            ))}
          </ul>
        )}
      </footer>
    </article>
  );
}

/** Wallet-size emergency cards, one per person, ready to print and cut out. */
export function CardsView() {
  const state = useApp();
  const cards = buildCards(state);

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<MemberDraft>(emptyDraft());
  const [errors, setErrors] = useState<MemberErrors>({});

  const set = <K extends keyof MemberDraft>(k: K, v: MemberDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  function reset() {
    setEditing(null);
    setDraft(emptyDraft());
    setErrors({});
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateMember(draft);
    setErrors(err);
    if (Object.keys(err).length) return;
    if (editing) {
      commit((s) => updateMember(s, editing, draft));
      toast(`Updated ${draft.name.trim()}'s card`);
    } else {
      commit((s) => addMember(s, draft));
      toast(`Card added for ${draft.name.trim()}`);
    }
    reset();
  }

  function edit(id: string) {
    const m = state.members.find((x) => x.id === id);
    if (!m) return;
    setEditing(id);
    setErrors({});
    setDraft({ name: m.name, blood: m.blood, allergies: m.allergies, medications: m.medications, notes: m.notes });
    document.getElementById("card-name")?.focus();
  }

  const missing = state.profile ? addFromHousehold(state).members.length - state.members.length : 0;

  return (
    <div>
      <style>{PRINT_CSS}</style>
      <div className="no-print">
        <PageTitle title="Emergency cards">
          One wallet-size card per person: blood type, allergies, medication and who to call. Print the sheet, cut along the dashes, and keep one in every wallet and go-bag.
        </PageTitle>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()} disabled={cards.length === 0} data-testid="cards-print">
            <Printer className="size-4" aria-hidden />
            Print the cards
          </button>
          <button
            type="button"
            className="btn btn-sm"
            disabled={missing === 0}
            onClick={() => {
              commit(addFromHousehold);
              toast("Added everyone in your household");
            }}
            data-testid="cards-from-household"
          >
            <UsersRound className="size-4" aria-hidden />
            {missing > 0 ? `Add my household (${missing})` : "Household added"}
          </button>
        </div>

        <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <section aria-labelledby="who-h">
            <h2 id="who-h" className="text-3xl">{editing ? "Edit card" : "Add a person"}</h2>
            <form onSubmit={submit} noValidate className="mt-5 grid gap-4 sm:grid-cols-2" data-testid="card-form">
              <Field label="Name" htmlFor="card-name" error={errors.name}>
                <input id="card-name" className="input" value={draft.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} data-testid="card-name" />
              </Field>
              <Field label="Blood type" htmlFor="card-blood" error={errors.blood}>
                <SelectField
                  label="Blood type"
                  testId="card-blood"
                  value={draft.blood === "" ? UNKNOWN : draft.blood}
                  onValueChange={(v) => set("blood", (v === UNKNOWN ? "" : v) as BloodType)}
                  options={BLOOD_TYPES.map(toOption)}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Allergies" htmlFor="card-allergies" error={errors.allergies} hint="Drugs, food, latex, insect stings.">
                  <input id="card-allergies" className="input" value={draft.allergies} onChange={(e) => set("allergies", e.target.value)} aria-invalid={!!errors.allergies} data-testid="card-allergies" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Medication" htmlFor="card-meds" error={errors.medications} hint="Name and dose, for example: Metformin 500 mg twice a day.">
                  <input id="card-meds" className="input" value={draft.medications} onChange={(e) => set("medications", e.target.value)} aria-invalid={!!errors.medications} data-testid="card-meds" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Anything else a responder should know" htmlFor="card-notes" error={errors.notes}>
                  <input id="card-notes" className="input" value={draft.notes} onChange={(e) => set("notes", e.target.value)} aria-invalid={!!errors.notes} data-testid="card-notes" />
                </Field>
              </div>
              <div className="flex flex-wrap gap-3 sm:col-span-2">
                <button type="submit" className="btn btn-primary" data-testid="card-save">{editing ? "Save changes" : "Add card"}</button>
                {editing && (
                  <button type="button" className="btn" onClick={reset} data-testid="card-cancel">Cancel</button>
                )}
              </div>
            </form>
          </section>

          <section aria-labelledby="people-h">
            <h2 id="people-h" className="text-3xl">People</h2>
            <ul className="mt-5 divide-y divide-rule border-y border-rule-strong" data-testid="card-members">
              {state.members.length === 0 && (
                <li className="py-4 text-ink-soft" data-testid="cards-empty">No cards yet. Add a person, or add your whole household in one tap.</li>
              )}
              {state.members.map((m) => (
                <li key={m.id} className="reveal flex items-center gap-3 py-3" data-testid={`card-member-${m.id}`}>
                  <span className="tnum grid h-10 min-w-12 shrink-0 place-items-center rounded-md bg-ink px-2 font-black text-canvas" aria-label={`Blood type ${BLOOD_LABEL(m.blood)}`}>
                    {m.blood || "?"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{m.name}</p>
                    <p className="truncate text-sm text-ink-soft">{m.allergies || m.medications ? [m.allergies && `Allergic: ${m.allergies}`, m.medications && `Takes: ${m.medications}`].filter(Boolean).join(" · ") : "No medical details yet"}</p>
                  </div>
                  <button type="button" className="grid size-10 place-items-center rounded hover:bg-canvas-2" aria-label={`Edit ${m.name}`} onClick={() => edit(m.id)} data-testid={`card-edit-${m.id}`}>
                    <Pencil className="size-4" aria-hidden />
                  </button>
                  <button type="button" className="grid size-10 place-items-center rounded text-bad hover:bg-bad-soft" aria-label={`Remove ${m.name}`} onClick={() => commit((s) => removeMember(s, m.id))} data-testid={`card-remove-${m.id}`}>
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            {state.contacts.length === 0 && (
              <p className="mt-4 text-ink-soft" data-testid="card-contacts-missing">
                Your cards have no phone numbers yet. <Link href="/plan" className="font-bold underline">Add emergency contacts</Link> and they appear on every card.
              </p>
            )}
          </section>
        </div>

        {cards.length > 0 && <h2 className="mt-16 mb-6 text-3xl">Print preview</h2>}
      </div>

      {cards.length > 0 && (
        <div className="wallet-sheet" data-testid="card-sheet">
          {cards.map((c) => (
            <WalletCard key={c.id} card={c} />
          ))}
        </div>
      )}
    </div>
  );
}
