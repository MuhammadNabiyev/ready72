"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { commit, useApp } from "@/lib/store";
import { setProfile } from "@/lib/actions";
import { Logo } from "./logo";
import { DEFAULT_PROFILE, HouseholdForm } from "./household-form";
import { toast } from "./ui";

export function SetupView() {
  const router = useRouter();
  const state = useApp();
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="flex h-12 items-center">
        <Link href="/" aria-label="Ready72 home" className="inline-flex rounded-xl bg-sign-black px-3.5 py-2 text-white">
          <Logo />
        </Link>
      </header>
      <main id="main" className="py-10 sm:py-14">
        <h1 className="rise text-[clamp(2.5rem,7vw,4.5rem)]">Build your 72-hour plan.</h1>
        <p className="rise mt-4 mb-12 max-w-[56ch] text-lg text-ink-soft" style={{ ["--d" as string]: 1 }}>
          Four quick questions. Ready72 turns the answers into an exact list of what to store, with no account and nothing leaving your device.
        </p>
        <HouseholdForm
          initial={state.profile ?? DEFAULT_PROFILE}
          submitLabel="Create my plan"
          onSubmit={(p) => {
            commit((s) => setProfile(s, p));
            toast("Your plan is ready");
            router.push("/dashboard");
          }}
        />
      </main>
    </div>
  );
}
