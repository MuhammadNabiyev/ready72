import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <header className="flex h-12 items-center">
        <Link href="/" aria-label="Ready72 home" className="inline-flex rounded-xl bg-sign-black px-3.5 py-2 text-white">
          <Logo />
        </Link>
      </header>
      <main id="main" className="py-16" data-testid="not-found">
        <p className="mono-label">Error 404</p>
        <h1 className="mt-3 text-[clamp(2.75rem,8vw,5rem)]">That page is not in your kit.</h1>
        <p className="mt-5 max-w-[50ch] text-lg text-ink-soft">
          The link may be old or mistyped. Your plan is safe: everything lives in this browser.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/dashboard" className="btn btn-primary" data-testid="nf-dashboard">
            Go to my dashboard
          </Link>
          <Link href="/" className="btn" data-testid="nf-home">
            Back to the start
          </Link>
        </div>
      </main>
    </div>
  );
}
