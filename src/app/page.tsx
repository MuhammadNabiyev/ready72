import Link from "next/link";
import { HomeCtas, SampleReadout } from "@/components/landing-bits";
import { Logo } from "@/components/logo";

const STEPS = [
  { t: "Tell us who is at home", d: "Adults, children, infants, pets, and the hazards that are realistic where you live." },
  { t: "Get your exact list", d: "Litres of water, kilocalories of food, flashlights, medication days. Worked out for your household, not copied from a poster." },
  { t: "Close the gaps", d: "Log what you own, follow the next best step, and watch your score and supply runway grow." },
];

const FEATURES = [
  { t: "A checklist built for you", d: "Needs change with every child, pet, medication and hazard you add. Water alone is 4 liters per adult per day, before pets and heat." },
  { t: "Readiness score", d: "One number from 0 to 100, weighted toward what keeps you alive first: water, food, then power and medicine." },
  { t: "Supply runway", d: "See which supply runs out first. Expired items stop counting, so the score stays honest." },
  { t: "Stress tests", d: "“Evacuate in 15 minutes”, “week-long outage”, “winter storm”. Each one checks your kit and plan, item by item." },
  { t: "Crisis mode", d: "One high-contrast screen: what to do now, who to call, where to meet, what to grab. It works with no internet." },
  { t: "A plan the family can use", d: "Contacts, meeting points, drills. Print it, share a link, and add expiry reminders to your calendar." },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-5 sm:px-6">
      <header className="flex h-12 items-center justify-between">
        <Link href="/" aria-label="Ready72 home"><Logo /></Link>
        <nav aria-label="Main" className="flex items-center gap-5 font-semibold">
          <Link href="/guides" className="hidden underline-offset-4 hover:underline sm:inline">Hazard guides</Link>
          <Link href="/dashboard" className="underline decoration-2 underline-offset-4 hover:text-signal-deep" data-testid="home-dashboard">Dashboard</Link>
        </nav>
      </header>

      <main id="main">
        <section className="grid items-center gap-14 pb-24 pt-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:pt-20">
          <div>
            <h1 className="rise text-[clamp(3.1rem,7.4vw,6rem)] leading-[0.96]">
              Could your household last <em className="hl">72&nbsp;hours</em>?
            </h1>
            <p className="rise mt-7 max-w-[46ch] text-xl text-ink-soft" style={{ ["--d" as string]: 1 }}>
              When the power, water or roads go out, the first three days are on you. Ready72 tells you exactly what your household needs, what you are missing, and what to do about it.
            </p>
            <div className="rise mt-10" style={{ ["--d" as string]: 2 }}>
              <HomeCtas />
            </div>
            <p className="rise mt-5 text-sm text-ink-soft" style={{ ["--d" as string]: 3 }}>
              No account. Your data stays in this browser. Works offline once loaded.
            </p>
          </div>
          <SampleReadout />
        </section>

        <section aria-labelledby="how-h" className="border-t border-rule-strong pt-14">
          <h2 id="how-h" className="text-4xl sm:text-5xl">Three steps. About a minute.</h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.t} className="rise" style={{ ["--d" as string]: i }}>
                <span className="tnum font-display text-7xl font-normal italic text-signal-deep">{i + 1}</span>
                <h3 className="mt-2 text-2xl">{s.t}</h3>
                <p className="mt-2 text-ink-soft">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="what-h" className="mt-24 border-t border-rule-strong pt-14">
          <h2 id="what-h" className="text-4xl sm:text-5xl">What you get</h2>
          <dl className="mt-10 grid gap-x-16 md:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.t} className="border-b border-rule py-6">
                <dt className="font-display text-2xl font-medium">{f.t}</dt>
                <dd className="mt-1 text-ink-soft">{f.d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="cta-h" className="mt-24 rounded-3xl bg-ink px-6 py-12 text-canvas sm:px-12">
          <h2 id="cta-h" className="max-w-[18ch] text-4xl text-canvas sm:text-6xl">Find your number <em className="text-signal">before</em> you need it.</h2>
          <Link href="/setup" className="btn btn-primary mt-8 min-h-14 px-7 text-lg" data-testid="cta-bottom">
            Build my plan
          </Link>
        </section>
      </main>

      <footer className="mt-16 max-w-[70ch] text-sm text-ink-soft">
        <p>
          Ready72 gives general preparedness guidance based on public recommendations from civil-protection and health agencies. It is not a substitute for official instructions: in an emergency, follow your local authorities and call your emergency number.
        </p>
      </footer>
    </div>
  );
}
