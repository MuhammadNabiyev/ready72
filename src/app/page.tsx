import Link from "next/link";
import { HomeCtas, SampleReadout } from "@/components/landing-bits";
import { Logo } from "@/components/logo";
import { Pictogram, PictoTile, type PictogramName } from "@/components/pictogram";

const STEPS = [
  { t: "Tell us who is at home", d: "Adults, children, infants, pets, and the hazards that are realistic where you live." },
  { t: "Get your exact list", d: "Liters of water, kilocalories of food, flashlights, medication days. Worked out for your household, not copied from a poster." },
  { t: "Close the gaps", d: "Log what you own, follow the next best step, and watch your score and supply runway grow." },
];

const FEATURES: { t: string; d: string; icon: PictogramName }[] = [
  { t: "A checklist built for you", d: "Needs change with every child, pet, medication and hazard you add. Water alone is 4 liters per adult per day, before pets and heat.", icon: "docs" },
  { t: "Readiness score", d: "One number from 0 to 100, weighted toward what keeps you alive first: water, food, then power and medicine.", icon: "shield" },
  { t: "Supply runway and time machine", d: "See which supply runs out first, then drag the clock and watch each one drain. Expired items stop counting.", icon: "time" },
  { t: "Stress tests", d: "“Evacuate in 15 minutes”, “week-long outage”, or one you design yourself. Each checks your kit and plan, item by item.", icon: "warning" },
  { t: "Crisis mode", d: "One high-contrast screen: what to do now, who to call, where to meet, what to grab. It works with no internet.", icon: "power" },
  { t: "A plan the family can use", d: "Contacts, meeting points, drills. Print it, share a link, and add expiry reminders to your calendar.", icon: "plan" },
];

export default function Home() {
  return (
    <div>
      <header className="bg-sign-black text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Ready72 home">
            <Logo />
          </Link>
          <nav aria-label="Main" className="flex items-center gap-6 font-bold">
            <Link href="/guides" className="hidden text-white/75 hover:text-white sm:inline">Hazard guides</Link>
            <Link href="/dashboard" className="rounded-lg border border-white/30 px-3.5 py-1.5 hover:border-white" data-testid="home-dashboard">Dashboard</Link>
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <section className="grid items-center gap-12 pt-14 pb-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:pt-20">
          <div>
            <h1 className="rise text-[clamp(3rem,7.2vw,6.2rem)] leading-[0.94]">
              Could your household last <em className="hl">72&nbsp;hours</em>?
            </h1>
            <p className="rise mt-8 max-w-[46ch] text-xl text-ink-soft" style={{ ["--d" as string]: 1 }}>
              When the power, water or roads go out, the first three days are on you. Ready72 tells you exactly what your household needs, what you are missing, and what to do about it.
            </p>
            <div className="rise mt-10" style={{ ["--d" as string]: 2 }}>
              <HomeCtas />
            </div>
            <p className="rise mt-5 text-sm font-semibold text-ink-soft" style={{ ["--d" as string]: 3 }}>
              No account. Your data stays in this browser. Works offline once loaded.
            </p>
          </div>
          <SampleReadout />
        </section>

        <section aria-labelledby="how-h" className="border-t-4 border-ink pt-14">
          <h2 id="how-h" className="text-4xl sm:text-5xl">Three stops. About a minute.</h2>
          {/* a transit line: each step is a stop */}
          <ol className="relative mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
            <span aria-hidden className="absolute top-[1.1rem] right-[16%] left-[3%] hidden h-2 rounded-full bg-ink md:block" />
            {STEPS.map((s, i) => (
              <li key={s.t} className="rise relative" style={{ ["--d" as string]: i }}>
                <span className="tnum relative grid size-11 place-items-center rounded-full border-[6px] border-ink bg-yellow text-lg font-black text-[oklch(0.25_0.03_170)]">{i + 1}</span>
                <h3 className="mt-5 text-2xl">{s.t}</h3>
                <p className="mt-2 max-w-[36ch] text-ink-soft">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="what-h" className="mt-28">
          <h2 id="what-h" className="text-4xl sm:text-5xl">What you get</h2>
          <ul className="mt-10 grid gap-x-14 gap-y-9 md:grid-cols-2">
            {FEATURES.map((f) => (
              <li key={f.t} className="flex gap-5">
                <PictoTile name={f.icon} className="size-14 rounded-2xl" />
                <div>
                  <h3 className="text-2xl">{f.t}</h3>
                  <p className="mt-1.5 max-w-[46ch] text-ink-soft">{f.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="cta-h" className="sign sign-green mt-28 px-8 py-14 sm:px-14">
          <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
            <h2 id="cta-h" className="max-w-[16ch] text-4xl sm:text-6xl">Find your number before you need it.</h2>
            <Link href="/setup" className="btn min-h-14 border-transparent bg-yellow px-8 text-lg text-[oklch(0.25_0.03_170)] shadow-[inset_0_-3px_0_oklch(0_0_0/0.18)] hover:bg-yellow hover:brightness-105" data-testid="cta-bottom">
              <Pictogram name="shield" className="size-5" />
              Build my plan
            </Link>
          </div>
        </section>

        <footer className="mt-16 max-w-[70ch] text-sm text-ink-soft">
          <p>
            Ready72 gives general preparedness guidance based on public recommendations from civil-protection and health agencies. It is not a substitute for official instructions: in an emergency, follow your local authorities and call your emergency number.
          </p>
        </footer>
      </main>
    </div>
  );
}
