"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { loadSample, useApp } from "@/lib/store";
import { ClientOnly } from "./client-only";
import { ReadinessGauge, useCountUp } from "./gauge";

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

/** A static, clearly labelled illustration of the dashboard. */
export function SampleReadout() {
  const days = useCountUp(2.4);
  const bars = [
    { label: "Water", v: 0.8, c: "var(--signal)" },
    { label: "Food", v: 0.8, c: "var(--signal)" },
    { label: "Medication", v: 0.7, c: "var(--signal)" },
    { label: "Light & power", v: 0.5, c: "var(--signal)" },
    { label: "Family plan", v: 0.2, c: "var(--bad)" },
  ];
  return (
    <figure className="rise relative rounded-md border-2 border-ink bg-paper p-5 shadow-[8px_8px_0_var(--ink)] sm:p-7" style={{ ["--d" as string]: 3 }} aria-label="Illustration of the Ready72 dashboard">
      <figcaption className="mono-label mb-4 flex items-center justify-between">
        <span>Sample household</span>
        <span>Illustration</span>
      </figcaption>
      <p className="font-display text-4xl font-extrabold leading-none sm:text-5xl" style={{ fontVariationSettings: '"wdth" 112' }}>
        Ready for <span className="tnum text-signal-deep">{days.toFixed(1)}</span> of 3 days.
      </p>
      <div className="mt-6">
        <ReadinessGauge score={62} />
      </div>
      <ul className="mt-6 space-y-3" aria-hidden>
        {bars.map((b) => (
          <li key={b.label} className="grid grid-cols-[7rem_1fr] items-center gap-3 text-sm">
            <span className="font-semibold">{b.label}</span>
            <span className="relative h-2.5 border-[1.5px] border-ink bg-canvas-2">
              <span className="absolute inset-y-0 left-0 origin-left" style={{ width: `${b.v * 100}%`, background: b.c, animation: "grow 900ms var(--ease-out) both" }} />
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-6 border-t-2 border-ink pt-3 font-semibold">
        Next: <span className="font-normal">Store 14 more liters of water</span>
      </p>
    </figure>
  );
}
