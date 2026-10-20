"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Phone } from "lucide-react";
import { haveFor, runway } from "@/lib/engine";
import { GUIDES } from "@/lib/guides";
import { HAZARDS, buildRequirements } from "@/lib/requirements";
import { useApp } from "@/lib/store";
import { HAZARD_IDS, type HazardId } from "@/lib/types";

/** High-contrast, one-screen "what do I do right now". Works offline. */
export function CrisisView() {
  const state = useApp();
  const profile = state.profile!;
  const today = new Date();
  const mine = HAZARD_IDS.filter((h) => profile.hazards.includes(h));
  const choices: HazardId[] = mine.length ? mine : HAZARD_IDS;
  const [h, setH] = useState<HazardId>(choices[0]);
  const [grabbed, setGrabbed] = useState<Record<string, boolean>>({});

  const bag = buildRequirements(profile).filter((r) => r.goBag);
  const short = runway(state, today)[0];
  const packedCount = bag.filter((r) => haveFor(r, state.entries, today, true) >= r.need).length;

  return (
    <div className="-mx-4 rounded-none bg-ink px-4 py-8 text-canvas sm:-mx-6 sm:rounded-lg sm:px-8 sm:py-10" data-testid="crisis">
      <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] text-signal">Crisis mode</h1>
      <p className="mt-3 max-w-[55ch] text-xl text-canvas/80">Stay calm. Work down this page. Nothing here needs the internet.</p>

      <section className="mt-10" aria-labelledby="c-do">
        <h2 id="c-do" className="text-3xl">1. What to do now</h2>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Hazard">
          {choices.map((x) => (
            <button
              key={x}
              type="button"
              aria-pressed={h === x}
              onClick={() => setH(x)}
              data-testid={`crisis-hazard-${x}`}
              className="min-h-12 rounded border-2 border-canvas px-4 font-bold transition-colors hover:bg-canvas/15 aria-pressed:bg-signal aria-pressed:text-on-signal aria-pressed:border-signal"
            >
              {HAZARDS[x].label}
            </button>
          ))}
        </div>
        <p className="mt-6 font-display text-3xl font-extrabold text-signal" data-testid="crisis-headline">{GUIDES[h].headline}</p>
        <ol className="mt-4 space-y-3 text-xl" data-testid="crisis-steps">
          {GUIDES[h].during.map((t, i) => (
            <li key={t} className="flex gap-4">
              <span className="tnum font-display text-2xl font-extrabold text-signal">{i + 1}</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12" aria-labelledby="c-call">
        <h2 id="c-call" className="text-3xl">2. Call or text</h2>
        <p className="mt-1 text-canvas/70">Texts get through when calls do not.</p>
        {state.contacts.length === 0 ? (
          <p className="mt-4 text-xl" data-testid="crisis-no-contacts">
            No contacts saved. <Link href="/plan" className="underline decoration-2 underline-offset-4">Add some in your plan.</Link>
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2" data-testid="crisis-contacts">
            {state.contacts.map((c) => (
              <li key={c.id}>
                <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="flex min-h-16 items-center gap-4 rounded border-2 border-canvas px-4 transition-colors hover:bg-canvas hover:text-ink">
                  <Phone className="size-6 shrink-0" aria-hidden />
                  <span>
                    <span className="block text-xl font-bold">{c.name}</span>
                    <span className="tnum block text-canvas/70">{c.phone}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12" aria-labelledby="c-meet">
        <h2 id="c-meet" className="text-3xl">3. Where to meet</h2>
        {state.points.length === 0 ? (
          <p className="mt-4 text-xl">No meeting point set yet.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-xl" data-testid="crisis-points">
            {state.points.map((m) => (
              <li key={m.id}>
                <strong>{m.label}</strong>
                {m.address && <span className="text-canvas/70"> · {m.address}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12" aria-labelledby="c-bag">
        <h2 id="c-bag" className="text-3xl">4. Grab the go-bag</h2>
        <p className="mt-1 text-canvas/70" data-testid="crisis-bag-count">{packedCount} of {bag.length} items are in your go-bag. Tap an item to mark it grabbed.</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2" data-testid="crisis-bag">
          {bag.map((r) => {
            const packed = haveFor(r, state.entries, today, true) >= r.need;
            const on = !!grabbed[r.id];
            return (
              <li key={r.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setGrabbed((g) => ({ ...g, [r.id]: !g[r.id] }))}
                  data-testid={`bag-${r.id}`}
                  className="flex min-h-12 w-full items-center gap-3 rounded border-2 border-canvas/40 px-3 text-left transition-colors hover:border-canvas aria-pressed:border-signal aria-pressed:bg-signal/15"
                >
                  <span className={`grid size-6 shrink-0 place-items-center rounded-sm border-2 ${on ? "border-signal bg-signal text-on-signal" : "border-canvas/60"}`}>
                    {on && <Check className="stamp size-4" strokeWidth={3} aria-hidden />}
                  </span>
                  <span className={`flex-1 ${on ? "line-through opacity-70" : ""}`}>{r.label}</span>
                  {on ? (
                    <span className="mono-label rounded-sm bg-signal px-1.5 py-px text-on-signal" data-testid={`grabbed-${r.id}`}>Grabbed</span>
                  ) : (
                    !packed && <span className="mono-label rounded-sm bg-bad px-1.5 py-px text-paper">Not in go-bag</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {short && (
        <p className="mt-12 border-t-2 border-canvas/30 pt-5 text-lg" data-testid="crisis-runway">
          Your shortest supply is <strong>{short.label.toLowerCase()}</strong>: about <strong className="tnum">{short.days}</strong> {short.days === 1 ? "day" : "days"} left.
        </p>
      )}
    </div>
  );
}
