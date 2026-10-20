"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { loadSample, useApp } from "@/lib/store";
import { ClientOnly } from "./client-only";
import { useCountUp } from "./gauge";
import { Pictogram, type PictogramName } from "./pictogram";

export function HomeCtas() {
  return (
    <ClientOnly fallback={<div className="h-14" />}>
      <Inner />
    </ClientOnly>
  );
}

function Inner() {
  const state = useApp();
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      {state.profile ? (
        <Link href="/dashboard" className="btn btn-primary min-h-14 px-7 text-lg" data-testid="cta-dashboard">
          Open my dashboard
          <ArrowRight className="size-5" aria-hidden />
        </Link>
      ) : (
        <Link href="/setup" className="btn btn-primary min-h-14 px-7 text-lg" data-testid="cta-build">
          Build my plan
          <ArrowRight className="size-5" aria-hidden />
        </Link>
      )}
      <button
        type="button"
        className="btn min-h-14 px-6 text-lg"
        data-testid="cta-sample"
        onClick={() => {
          loadSample();
          router.push("/dashboard");
        }}
      >
        Explore a sample household
      </button>
    </div>
  );
}

/** A static, clearly labelled illustration of the dashboard, drawn as a safety sign. */
export function SampleReadout() {
  const days = useCountUp(2.4);
  const rows: { label: string; v: number; icon: PictogramName; state: "mid" | "full" | "empty" }[] = [
    { label: "Water", v: 0.8, icon: "water", state: "mid" },
    { label: "Food", v: 0.8, icon: "food", state: "mid" },
    { label: "Medication", v: 0.7, icon: "meds", state: "mid" },
    { label: "Light & power", v: 0.5, icon: "power", state: "mid" },
    { label: "Family plan", v: 0.2, icon: "plan", state: "empty" },
  ];
  return (
    <figure className="sign sign-green flip px-7 pt-9 pb-10 shadow-[var(--shadow-soft)] sm:px-10" aria-label="Illustration of the Ready72 dashboard">
      <figcaption className="flex items-center justify-between text-xs font-extrabold tracking-[0.16em] uppercase">
        <span>Sample household</span>
        <span>Illustration</span>
      </figcaption>
      <p className="mt-5 text-[clamp(2.4rem,4.6vw,3.6rem)] leading-[0.98] font-black tracking-[-0.03em]">
        Ready for <span className="tnum hl">{days.toFixed(1)}</span> of 3 days.
      </p>
      <ul className="mt-8 space-y-3.5" aria-hidden>
        {rows.map((b) => (
          <li key={b.label} className="grid grid-cols-[2rem_6.5rem_1fr] items-center gap-3 text-sm font-bold sm:grid-cols-[2rem_7.5rem_1fr]">
            <Pictogram name={b.icon} className="size-7" />
            <span>{b.label}</span>
            <span className="bar" data-state={b.state}>
              <span style={{ transform: `scaleX(${b.v})` }} />
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-8 border-t-2 border-current/40 pt-4 font-bold">
        Next: <span className="font-medium">Store 14 more liters of water</span>
      </p>
    </figure>
  );
}
