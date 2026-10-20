"use client";

import { useState } from "react";
import { GUIDES, GUIDE_DISCLAIMER } from "@/lib/guides";
import { HAZARDS } from "@/lib/requirements";
import { useApp } from "@/lib/store";
import { HAZARD_IDS, type HazardId } from "@/lib/types";
import { PageTitle } from "./ui";

export function GuidesView() {
  const state = useApp();
  const mine = state.profile?.hazards ?? [];
  const ordered = [...HAZARD_IDS].sort((a, b) => Number(mine.includes(b)) - Number(mine.includes(a)));
  const [h, setH] = useState<HazardId>(ordered[0]);
  const g = GUIDES[h];

  const cols = [
    { key: "before", title: "Before", items: g.before },
    { key: "during", title: "During", items: g.during },
    { key: "after", title: "After", items: g.after },
  ] as const;

  return (
    <div>
      <PageTitle title="Hazard guides">Short, plain steps for the hazards you picked first. Read them now, not during.</PageTitle>

      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Hazard">
        {ordered.map((x) => (
          <button key={x} type="button" className="chip" aria-pressed={h === x} onClick={() => setH(x)} data-testid={`guide-${x}`}>
            {HAZARDS[x].label}
            {mine.includes(x) && <span className="mono-label rounded-sm bg-signal px-1.5 py-px text-on-signal">Yours</span>}
          </button>
        ))}
      </div>

      <div key={h} className="rise mt-10" data-testid="guide">
        <h2 className="text-[clamp(2rem,5vw,3.5rem)] text-signal-deep" data-testid="guide-headline">{g.headline}</h2>
        <div className="mt-8 grid gap-10 md:grid-cols-3">
          {cols.map((c) => (
            <section key={c.key} aria-labelledby={`${c.key}-h`} data-testid={`guide-${c.key}`}>
              <h3 id={`${c.key}-h`} className="border-b border-rule-strong pb-2 text-2xl">{c.title}</h3>
              <ul className="mt-4 space-y-3">
                {c.items.map((t) => (
                  <li key={t} className="flex gap-3">
                    <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-signal-deep" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <p className="mt-16 max-w-[70ch] border-t border-rule pt-4 text-sm text-ink-soft">{GUIDE_DISCLAIMER}</p>
    </div>
  );
}
