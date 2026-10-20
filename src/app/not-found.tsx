import Link from "next/link";
import { Logo } from "@/components/logo";
import { Pictogram } from "@/components/pictogram";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <header className="flex h-12 items-center">
        <Link href="/" aria-label="Ready72 home" className="inline-flex rounded-xl bg-sign-black px-3.5 py-2 text-white">
          <Logo />
        </Link>
      </header>
      <main id="main" className="grid items-center gap-12 py-14 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:py-20" data-testid="not-found">
        <div>
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
        </div>
        <div className="sign sign-yellow flip px-8 pt-9 pb-10 text-center shadow-[var(--shadow-soft)]" aria-hidden>
          <Pictogram name="warning" className="mx-auto size-20" />
          <p className="mt-4 text-[clamp(5rem,12vw,8rem)] leading-[0.88] font-black tracking-[-0.04em]">404</p>
          <p className="mt-3 text-sm font-extrabold tracking-[0.16em] uppercase">Exit not found</p>
        </div>
      </main>
    </div>
  );
}
