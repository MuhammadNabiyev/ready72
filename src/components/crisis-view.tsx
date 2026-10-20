"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Phone } from "lucide-react";
import { haveFor, inSentence, runway } from "@/lib/engine";
import { GUIDES } from "@/lib/guides";
import { HAZARDS, buildRequirements } from "@/lib/requirements";
import { useApp } from "@/lib/store";
import { HAZARD_IDS, type HazardId } from "@/lib/types";
import { HAZARD_PICTOGRAM, Pictogram, StatusShape } from "./pictogram";

const H2 = "flex items-center gap-4 font-display text-3xl font-extrabold";

/**
 * High-contrast, one-screen "what do I do right now". Works offline.
 * Always dark with bright type, in day and night mode alike, so it reads in a stressful moment.
 */
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
    <div className="on-dark -mx-4 rounded-none bg-sign-black px-4 py-8 text-white sm:-mx-6 sm:rounded-3xl sm:px-10 sm:py-12" data-testid="crisis">
      <div className="flex items-center gap-4 sm:gap-6">
        <StatusShape kind="warn" className="size-14 sm:size-20" />
        <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] text-yellow">Crisis mode</h1>
      </div>
      <p className="mt-4 max-w-[55ch] text-xl text-white/85">Stay calm. Work down this page. Nothing here needs the internet.</p>

      <section className="mt-10" aria-labelledby="c-do">
        <h2 id="c-do" className={H2}><span className="step-tag size-10 text-xl" aria-hidden>1</span>What to do now</h2>
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Hazard">
          {choices.map((x) => (
            <button
              key={x}
              type="button"
              aria-pressed={h === x}
              onClick={() => setH(x)}
              data-testid={`crisis-hazard-${x}`}
              className="inline-flex min-h-14 items-center gap-2.5 rounded-xl border-2 border-white/55 px-5 text-lg font-bold transition-colors hover:bg-white/15 aria-pressed:border-yellow aria-pressed:bg-yellow aria-pressed:text-[oklch(0.25_0.03_170)]"
            >
              <Pictogram name={HAZARD_PICTOGRAM[x]} className="size-6" />
              {HAZARDS[x].label}
            </button>
          ))}
        </div>
        <p className="mt-8 font-display text-3xl font-extrabold text-yellow sm:text-4xl" data-testid="crisis-headline">{GUIDES[h].headline}</p>
        <ol className="mt-4 divide-y divide-white/15 border-y border-white/15" data-testid="crisis-steps">
          {GUIDES[h].during.map((t, i) => (
            <li key={t} className="flex items-start gap-4 py-4">
              <span className="tnum grid size-10 shrink-0 place-items-center rounded-full bg-yellow font-display text-xl font-black text-[oklch(0.25_0.03_170)]">{i + 1}</span>
              <span className="pt-1 text-[1.35rem] leading-snug sm:text-2xl">{t}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14" aria-labelledby="c-call">
        <h2 id="c-call" className={H2}><span className="step-tag size-10 text-xl" aria-hidden>2</span>Call or text</h2>
        <p className="mt-2 text-lg text-white/80">Texts get through when calls do not.</p>
        {state.contacts.length === 0 ? (
          <p className="mt-4 text-xl" data-testid="crisis-no-contacts">
            No contacts saved. <Link href="/plan" className="underline decoration-2 underline-offset-4">Add some in your plan.</Link>
          </p>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2" data-testid="crisis-contacts">
            {state.contacts.map((c) => (
              <li key={c.id}>
                <a
                  href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                  className="group flex min-h-20 items-center gap-4 rounded-2xl border-2 border-white/55 px-4 py-3 transition-colors hover:border-yellow hover:bg-yellow hover:text-[oklch(0.25_0.03_170)]"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-yellow text-[oklch(0.25_0.03_170)] group-hover:bg-[oklch(0.25_0.03_170)] group-hover:text-yellow">
                    <Phone className="size-6" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-2xl font-bold">{c.name}</span>
                    <span className="tnum block text-xl text-white/85 group-hover:text-inherit">{c.phone}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-14" aria-labelledby="c-meet">
        <h2 id="c-meet" className={H2}><span className="step-tag size-10 text-xl" aria-hidden>3</span>Where to meet</h2>
        {state.points.length === 0 ? (
          <p className="mt-4 text-xl">No meeting point set yet.</p>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2" data-testid="crisis-points">
            {state.points.map((m) => (
              <li key={m.id} className="flex items-center gap-4 rounded-2xl border-2 border-white/25 px-4 py-3 text-xl">
                <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/12 text-yellow">
                  <Pictogram name="plan" className="size-7" />
                </span>
                <span className="min-w-0">
                  <strong className="block text-2xl">{m.label}</strong>
                  {m.address && <span className="block text-white/80">{m.address}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-14" aria-labelledby="c-bag">
        <h2 id="c-bag" className={H2}><span className="step-tag size-10 text-xl" aria-hidden>4</span>Grab the go-bag</h2>
        <p className="mt-2 text-lg text-white/80" data-testid="crisis-bag-count">{packedCount} of {bag.length} items are in your go-bag. Tap an item to mark it grabbed.</p>
        <ul className="mt-5 grid gap-2.5 sm:grid-cols-2" data-testid="crisis-bag">
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
                  className="flex min-h-14 w-full items-center gap-3 rounded-xl border-2 border-white/30 px-3.5 py-2 text-left text-lg transition-colors hover:border-white aria-pressed:border-yellow aria-pressed:bg-yellow/15"
                >
                  <span className={`grid size-7 shrink-0 place-items-center rounded-md border-2 ${on ? "border-yellow bg-yellow text-[oklch(0.25_0.03_170)]" : "border-white/70"}`}>
                    {on && <Check className="stamp size-5" strokeWidth={3.5} aria-hidden />}
                  </span>
                  <span className={`flex-1 ${on ? "line-through opacity-75" : ""}`}>{r.label}</span>
                  {on ? (
                    <span className="mono-label rounded-sm bg-yellow px-1.5 py-0.5 text-[oklch(0.25_0.03_170)]" data-testid={`grabbed-${r.id}`}>Grabbed</span>
                  ) : (
                    !packed && <span className="mono-label rounded-sm bg-[oklch(0.52_0.16_32)] px-1.5 py-0.5 text-white">Not in go-bag</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {short && (
        <p className="mt-14 border-t-2 border-white/30 pt-5 text-xl" data-testid="crisis-runway">
          Your shortest supply is <strong>{inSentence(short.label)}</strong>: about <strong className="tnum">{short.days}</strong> {short.days === 1 ? "day" : "days"} left.
        </p>
      )}
    </div>
  );
}
