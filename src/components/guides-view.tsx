"use client";

import { useState } from "react";
import { GUIDES, GUIDE_DISCLAIMER } from "@/lib/guides";
import { HAZARDS } from "@/lib/requirements";
import { useApp } from "@/lib/store";
import { HAZARD_IDS, type HazardId } from "@/lib/types";
import { HAZARD_PICTOGRAM, Pictogram, type PictogramName } from "./pictogram";
import { PageTitle } from "./ui";

export function GuidesView() {
  const state = useApp();
  const mine = state.profile?.hazards ?? [];
  const ordered = [...HAZARD_IDS].sort((a, b) => Number(mine.includes(b)) - Number(mine.includes(a)));
  const [h, setH] = useState<HazardId>(ordered[0]);
  const g = GUIDES[h];

  const cols: { key: "before" | "during" | "after"; title: string; items: string[]; icon: PictogramName }[] = [
    { key: "before", title: "Before", items: g.before, icon: "bag" },
    { key: "during", title: "During", items: g.during, icon: "warning" },
    { key: "after", title: "After", items: g.after, icon: "check" },
  ];

  return (
    <div>
      <PageTitle title="Hazard guides">Short, plain steps for the hazards you picked first. Read them now, not during.</PageTitle>

      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Hazard">
        {ordered.map((x) => (
          <button key={x} type="button" className="chip" aria-pressed={h === x} onClick={() => setH(x)} data-testid={`guide-${x}`}>
            <Pictogram name={HAZARD_PICTOGRAM[x]} className="size-4" />
            {HAZARDS[x].label}
            {mine.includes(x) && <span className="mono-label rounded-sm bg-signal px-1.5 py-px text-on-signal">Yours</span>}
          </button>
        ))}
      </div>

      <div key={h} className="rise mt-10" data-testid="guide">
        <div className="flex items-center gap-5">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-ink text-canvas sm:size-20">
            <Pictogram name={HAZARD_PICTOGRAM[h]} className="size-9 sm:size-11" />
          </span>
          <h2 className="text-[clamp(2rem,5vw,3.5rem)]" data-testid="guide-headline">{g.headline}</h2>
        </div>
        <div className="mt-10 grid items-start gap-6 md:grid-cols-3">
          {cols.map((c) => {
            const during = c.key === "during";
            return (
              <section
                key={c.key}
                aria-labelledby={`${c.key}-h`}
                data-testid={`guide-${c.key}`}
                className={during ? "sign sign-yellow px-7 py-8 shadow-[var(--shadow-soft)]" : "px-1 py-2"}
              >
                <h3 id={`${c.key}-h`} className={`flex items-center gap-3 pb-3 text-2xl ${during ? "border-b-2 border-current/40" : "border-b-2 border-ink"}`}>
                  <Pictogram name={c.icon} className="size-6" />
                  {c.title}
                </h3>
                <ul className="mt-5 space-y-4">
                  {c.items.map((t, n) => (
                    <li key={t} className="flex gap-3">
                      {during ? (
                        <span aria-hidden className="tnum mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[oklch(0.25_0.03_170)] text-sm font-black text-[oklch(0.97_0.012_90)]">{n + 1}</span>
                      ) : (
                        <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-signal-deep" />
                      )}
                      <span className={during ? "text-lg font-semibold" : ""}>{t}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      <p className="mt-16 max-w-[70ch] border-t border-rule pt-4 text-sm text-ink-soft">{GUIDE_DISCLAIMER}</p>
    </div>
  );
}
