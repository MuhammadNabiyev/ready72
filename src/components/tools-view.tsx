"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cardCompleteness } from "@/lib/cards";
import { bestRun, formatClock } from "@/lib/drill";
import { counts, schedule } from "@/lib/maintenance";
import { useApp } from "@/lib/store";
import { boilMinutes } from "@/lib/water";
import { Pictogram, type PictogramName } from "./pictogram";
import { PageTitle } from "./ui";

type Tool = { id: string; href: string; icon: PictogramName; title: string; body: string; stat: string; tone: "sign-black" | "sign-green" | "sign-yellow" | "sign-red" };

/** The practical extras: practise, maintain, carry, purify. */
export function ToolsView() {
  const state = useApp();
  const now = new Date();
  const best = bestRun(state.drillRuns);
  const c = counts(schedule(state, now));
  const cards = cardCompleteness(state);
  const late = c.overdue + c.soon;

  const tools: Tool[] = [
    {
      id: "drill",
      href: "/drill",
      icon: "timer",
      title: "Evacuation drill",
      body: "A 15-minute countdown and a checklist built from your own kit. Beat your best time.",
      stat: best ? `Best time ${formatClock(best.seconds)}` : "Not run yet",
      tone: "sign-black",
    },
    {
      id: "maintenance",
      href: "/maintenance",
      icon: "calendar",
      title: "Home maintenance",
      body: "Smoke alarms, stored water, batteries, extinguisher. Know what is due before it fails.",
      stat: c.overdue > 0 ? `${c.overdue} overdue` : late > 0 ? `${c.soon} due soon` : c.never > 0 ? `${c.never} not checked yet` : "All up to date",
      tone: c.overdue > 0 ? "sign-red" : late > 0 || c.never > 0 ? "sign-yellow" : "sign-green",
    },
    {
      id: "cards",
      href: "/cards",
      icon: "card",
      title: "Emergency cards",
      body: "Wallet-size cards with blood type, allergies, medication and contacts. Print and cut out.",
      stat: cards.cards === 0 ? "No cards yet" : `${cards.cards} ${cards.cards === 1 ? "card" : "cards"} ready`,
      tone: cards.cards === 0 ? "sign-yellow" : "sign-green",
    },
    {
      id: "water",
      href: "/guides#water-h",
      icon: "water",
      title: "Make water safe",
      body: "Boiling times and bleach drops per liter, for clear or cloudy water.",
      stat: `Boil ${boilMinutes(0)} min, 3 min high up`,
      tone: "sign-black",
    },
  ];

  return (
    <div>
      <PageTitle title="Tools">Four small things that decide how a bad day goes: practise the exit, keep the house safe, carry your details, and clean your water.</PageTitle>

      <ul className="mt-10 grid gap-6 md:grid-cols-2" data-testid="tools-list">
        {tools.map((t, i) => (
          <li key={t.id} className={i % 2 === 1 ? "md:mt-10" : ""}>
            <Link href={t.href} className={`sign ${t.tone} group flex h-full flex-col px-7 pt-7 pb-6 shadow-[var(--shadow-soft)]`} data-testid={`tool-${t.id}`}>
              <Pictogram name={t.icon} className="size-12" />
              <h2 className="mt-5 text-3xl">{t.title}</h2>
              <p className="mt-2 flex-1 text-lg">{t.body}</p>
              <p className="mt-6 flex items-center justify-between gap-3 border-t border-current/30 pt-4 font-extrabold" data-testid={`tool-${t.id}-stat`}>
                {t.stat}
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
