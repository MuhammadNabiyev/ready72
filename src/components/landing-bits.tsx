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
    { label: "Water", v: 0.8 },
    { label: "Food", v: 0.8 },
    { label: "Medication", v: 0.7 },
    { label: "Light & power", v: 0.5 },
    { label: "Family plan", v: 0.2, bad: true },
  ];
  return (
    <figure className="rise panel relative p-6 sm:p-8" style={{ ["--d" as string]: 3 }} aria-label="Illustration of the Ready72 dashboard">
      <figcaption className="mono-label mb-4 flex items-center justify-between">
        <span>Sample household</span>
        <span>Illustration</span>
      </figcaption>
      <p className="font-display text-3xl leading-tight font-medium sm:text-4xl">
        Ready for <span className="tnum hl">{days.toFixed(1)}</span> of 3 days.
      </p>
      <div className="mt-5">
        <ReadinessGauge score={62} level="Prepared" />
      </div>
      <ul className="mt-5 space-y-2.5" aria-hidden>
        {bars.map((b) => (
          <li key={b.label} className="grid grid-cols-[7rem_1fr] items-center gap-3 text-sm">
            <span className="font-semibold">{b.label}</span>
            <span className="relative h-2 rounded-full bg-ink/10">
              <span className="absolute inset-y-0 left-0 origin-left rounded-full" style={{ width: `${b.v * 100}%`, background: b.bad ? "var(--bad)" : "var(--signal-deep)", animation: "grow 900ms var(--ease-out) both" }} />
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-rule pt-3 font-semibold">
        Next: <span className="font-normal">Store 14 more liters of water</span>
      </p>
    </figure>
  );
}
