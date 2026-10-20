"use client";

import Link from "next/link";
import { Pictogram } from "@/components/pictogram";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto grid max-w-5xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:py-28" role="alert" data-testid="error-page">
      <div>
        <h1 className="text-[clamp(2.5rem,7vw,4.5rem)]">Something broke on our side.</h1>
        <p className="mt-5 max-w-[50ch] text-lg text-ink-soft">
          Your saved plan has not been touched. Try again, or go back to the dashboard.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" onClick={reset} data-testid="error-retry">
            Try again
          </button>
          <Link href="/dashboard" className="btn">
            Go to my dashboard
          </Link>
        </div>
      </div>
      <div className="sign sign-red px-8 pt-9 pb-10 text-center shadow-[var(--shadow-soft)]" aria-hidden>
        <Pictogram name="cross" className="mx-auto size-20" />
        <p className="mt-5 text-sm font-extrabold tracking-[0.16em] uppercase">Out of order</p>
        <p className="mt-2 text-2xl font-bold">Nothing was lost.</p>
      </div>
    </main>
  );
}
