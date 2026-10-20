"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-24 sm:px-6" role="alert" data-testid="error-page">
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
    </main>
  );
}
