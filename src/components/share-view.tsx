"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Phone } from "lucide-react";
import { decodeShare, type SharedPlan } from "@/lib/share";
import { HAZARDS } from "@/lib/requirements";
import { Logo } from "./logo";
import { HAZARD_PICTOGRAM, Pictogram, StatusShape } from "./pictogram";
import { SectionHead, Sep } from "./ui";

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const getHash = () => window.location.hash.slice(1);

const ROLE: Record<string, string> = { family: "Family", "out-of-area": "Out-of-town contact", neighbor: "Neighbor", doctor: "Doctor", other: "Other" };
const KIND: Record<string, string> = { home: "Right outside the home", neighborhood: "In the neighborhood", "out-of-town": "Out of town" };

/** Read-only plan received through a share link. Nothing is stored. */
export function ShareView() {
  const hash = useSyncExternalStore(subscribe, getHash, () => "");
  const plan: SharedPlan | null = hash ? decodeShare(hash) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <header className="flex h-12 items-center">
        <Link href="/" aria-label="Ready72 home" className="inline-flex rounded-xl bg-sign-black px-3.5 py-2 text-white"><Logo /></Link>
      </header>
      <main id="main" className="py-10">
        {!plan ? (
          <div data-testid="share-invalid">
            <StatusShape kind="warn" className="size-14" />
            <h1 className="mt-5 text-[clamp(2.25rem,6vw,3.75rem)]">This link does not hold a plan.</h1>
            <p className="mt-4 text-lg text-ink-soft">Ask the sender to copy the share link again from their Family plan page.</p>
            <Link href="/setup" className="btn btn-primary mt-8">Build your own plan</Link>
          </div>
        ) : (
          <div className="rise" data-testid="share-plan">
            <div className="sign sign-blue px-7 py-9 shadow-[var(--shadow-soft)] sm:px-10">
              <p className="text-xs font-extrabold tracking-[0.16em] uppercase">Shared plan</p>
              <h1 className="mt-3 text-[clamp(2.25rem,6vw,3.75rem)]" data-testid="share-name">{plan.name}</h1>
              {plan.hazards.length > 0 && (
                <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-lg font-semibold">
                  <span>Prepared for</span>
                  {plan.hazards.map((h) => (
                    <span key={h} className="inline-flex items-center gap-2">
                      <Pictogram name={HAZARD_PICTOGRAM[h]} className="size-5" />
                      {HAZARDS[h].label.toLowerCase()}
                    </span>
                  ))}
                </p>
              )}
            </div>

            <div className="mt-14">
              <SectionHead icon="info" id="sh-contacts" title="Contacts" />
            </div>
            <ul className="mt-5 divide-y divide-rule border-y border-rule-strong">
              {plan.contacts.length === 0 && <li className="py-3 text-ink-soft">None shared.</li>}
              {plan.contacts.map((c, i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  <div className="flex-1">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-sm text-ink-soft">{ROLE[c.role]}</p>
                  </div>
                  <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="btn btn-sm tnum"><Phone className="size-4" aria-hidden />{c.phone}</a>
                </li>
              ))}
            </ul>

            <div className="mt-14">
              <SectionHead icon="plan" id="sh-points" title="Meeting points" />
            </div>
            <ul className="mt-5 divide-y divide-rule border-y border-rule-strong">
              {plan.points.length === 0 && <li className="py-3 text-ink-soft">None shared.</li>}
              {plan.points.map((m, i) => (
                <li key={i} className="py-3">
                  <p className="font-semibold">{m.label}</p>
                  <p className="text-sm text-ink-soft">{KIND[m.kind]}{m.address && <><Sep />{m.address}</>}</p>
                </li>
              ))}
            </ul>

            {plan.notes && (
              <>
                <div className="mt-14">
                  <SectionHead icon="docs" id="sh-notes" title="Notes" />
                </div>
                <p className="panel mt-5 p-5 text-lg whitespace-pre-wrap">{plan.notes}</p>
              </>
            )}

            <div className="mt-16 border-t-2 border-ink pt-6">
              <p className="font-display text-2xl font-extrabold">Want the same for your own household?</p>
              <p className="mt-1 text-ink-soft">It takes about a minute, needs no account, and stays in your browser.</p>
              <Link href="/setup" className="btn btn-primary mt-4">Build my plan</Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
