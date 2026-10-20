"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Phone } from "lucide-react";
import { decodeShare, type SharedPlan } from "@/lib/share";
import { HAZARDS } from "@/lib/requirements";
import { Logo } from "./logo";

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
        <Link href="/" aria-label="Ready72 home"><Logo /></Link>
      </header>
      <main id="main" className="py-10">
        {!plan ? (
          <div data-testid="share-invalid">
            <h1 className="text-5xl">This link does not hold a plan.</h1>
            <p className="mt-4 text-lg text-ink-soft">Ask the sender to copy the share link again from their Family plan page.</p>
            <Link href="/setup" className="btn btn-primary mt-8">Build your own plan</Link>
          </div>
        ) : (
          <div className="rise" data-testid="share-plan">
            <p className="mono-label">Shared plan</p>
            <h1 className="mt-2 text-[clamp(2.25rem,6vw,3.75rem)]" data-testid="share-name">{plan.name}</h1>
            {plan.hazards.length > 0 && (
              <p className="mt-3 text-ink-soft">Prepared for: {plan.hazards.map((h) => HAZARDS[h].label.toLowerCase()).join(", ")}.</p>
            )}

            <h2 className="mt-12 text-3xl">Contacts</h2>
            <ul className="mt-4 divide-y divide-rule border-y-2 border-ink">
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

            <h2 className="mt-12 text-3xl">Meeting points</h2>
            <ul className="mt-4 divide-y divide-rule border-y-2 border-ink">
              {plan.points.length === 0 && <li className="py-3 text-ink-soft">None shared.</li>}
              {plan.points.map((m, i) => (
                <li key={i} className="py-3">
                  <p className="font-semibold">{m.label}</p>
                  <p className="text-sm text-ink-soft">{KIND[m.kind]}{m.address && ` · ${m.address}`}</p>
                </li>
              ))}
            </ul>

            {plan.notes && (
              <>
                <h2 className="mt-12 text-3xl">Notes</h2>
                <p className="mt-4 whitespace-pre-wrap text-lg">{plan.notes}</p>
              </>
            )}

            <div className="mt-16 border-t-2 border-ink pt-6">
              <p className="text-lg">Want the same for your own household?</p>
              <Link href="/setup" className="btn btn-primary mt-4">Build my plan</Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
