"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Search, Settings, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { loadSample, useApp } from "@/lib/store";
import { toggleTheme, useTheme } from "@/lib/theme";
import { CommandPalette, OPEN_PALETTE, OPEN_SHARE } from "./command-palette";
import { Logo } from "./logo";
import { Pictogram, type PictogramName } from "./pictogram";
import { ShareCardDialog } from "./share-card";

const NAV: { href: string; label: string; short: string; icon: PictogramName }[] = [
  { href: "/dashboard", label: "Dashboard", short: "Home", icon: "shield" },
  { href: "/kit", label: "My kit", short: "Kit", icon: "bag" },
  { href: "/shopping", label: "Shopping list", short: "Shop", icon: "food" },
  { href: "/plan", label: "Family plan", short: "Plan", icon: "plan" },
  { href: "/stress-test", label: "Stress test", short: "Test", icon: "warning" },
  { href: "/guides", label: "Guides", short: "Guides", icon: "info" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const state = useApp();
  const path = usePathname();
  const theme = useTheme();
  const [sharing, setSharing] = useState(false);
  useEffect(() => {
    const open = () => setSharing(true);
    window.addEventListener(OPEN_SHARE, open);
    return () => window.removeEventListener(OPEN_SHARE, open);
  }, []);

  return (
    <div className="min-h-dvh pb-24 xl:pb-0">
      <header className="no-print sticky top-0 z-40 bg-sign-black text-white shadow-[0_6px_20px_-10px_oklch(0_0_0/0.5)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 xl:gap-6">
          <Link href="/" aria-label="Ready72 home" className="shrink-0">
            <Logo />
          </Link>
          <nav aria-label="Main" className="ml-2 hidden flex-1 items-center gap-1 xl:flex">
            {NAV.map((n) => {
              const active = path === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  data-testid={`nav-${n.href.slice(1)}`}
                  className="relative whitespace-nowrap px-3 py-2 font-bold text-white/70 transition-colors hover:text-white aria-[current=page]:text-white"
                >
                  {n.label}
                  <span
                    aria-hidden
                    className="absolute inset-x-3 -bottom-[15px] h-[5px] origin-left rounded-t-sm bg-yellow transition-transform duration-300"
                    style={{ transform: active ? "scaleX(1)" : "scaleX(0)", transitionTimingFunction: "var(--ease-out)" }}
                  />
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE))}
              aria-label="Search pages and actions (Ctrl+K)"
              data-testid="open-palette"
              className="mr-1 inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-lg border border-white/25 px-2.5 text-sm text-white/70 transition-colors hover:border-white hover:text-white 2xl:px-3"
            >
              <Search className="size-4" aria-hidden />
              <span className="hidden 2xl:inline">Search</span>
              <kbd className="hidden whitespace-nowrap rounded-sm border border-white/30 px-1.5 font-mono text-xs 2xl:inline">Ctrl K</kbd>
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "night" ? "Switch to day mode" : "Switch to night mode"}
              aria-pressed={theme === "night"}
              data-testid="theme-toggle"
              className="mr-1 grid size-10 place-items-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
            >
              {theme === "night" ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
            </button>
            <Link
              href="/crisis"
              data-testid="nav-crisis"
              className="mr-1 inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-lg bg-red px-3.5 text-sm font-extrabold tracking-wide text-white uppercase transition-colors hover:brightness-110"
            >
              <span aria-hidden className="relative grid size-2.5 place-items-center">
                <span className="absolute size-2.5 rounded-full bg-white" style={{ animation: "pulse-ring 1.8s ease-out infinite" }} />
                <span className="size-2 rounded-full bg-white" />
              </span>
              Crisis mode
            </Link>
            <Link href="/settings" aria-label="Settings" data-testid="nav-settings" className="grid size-11 place-items-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white">
              <Settings className="size-5" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {state.profile || path === "/settings" ? (
          <div key={path} className="rise" style={{ ["--d" as string]: 0 }}>
            {children}
          </div>
        ) : (
          <NoHousehold />
        )}
      </main>

      <CommandPalette />
      {sharing && <ShareCardDialog onClose={() => setSharing(false)} />}

      <nav aria-label="Main" className="no-print fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-rule-strong bg-canvas md:hidden">
        {NAV.map((n) => {
          const active = path === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              aria-label={n.label}
              data-testid={`tab-${n.href.slice(1)}`}
              className="relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-bold text-white/65 transition-colors aria-[current=page]:text-yellow aria-[current=page]:before:absolute aria-[current=page]:before:inset-x-3 aria-[current=page]:before:top-0 aria-[current=page]:before:h-[4px] aria-[current=page]:before:rounded-b-sm aria-[current=page]:before:bg-yellow"
            >
              <Pictogram name={n.icon} className="size-6" />
              {n.short}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function NoHousehold() {
  return (
    <div className="grid items-center gap-12 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]" data-testid="no-household">
      <div className="rise">
        <h1 className="text-[clamp(2.75rem,6vw,4.75rem)] leading-[0.96]">Start with your household.</h1>
        <p className="mt-6 max-w-[46ch] text-xl text-ink-soft">
          Ready72 needs to know who lives with you and which hazards you face before it can work out what you need. It takes about a minute.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/setup" className="btn btn-primary min-h-14 px-7 text-lg" data-testid="go-setup">
            Build my plan
          </Link>
          <button type="button" className="btn min-h-14 px-6 text-lg" onClick={loadSample} data-testid="load-sample">
            Try a sample household
          </button>
        </div>
      </div>
      <div className="sign sign-black flip px-8 pt-9 pb-10 text-center shadow-[var(--shadow-soft)]" aria-hidden>
        <Pictogram name="shield" className="mx-auto size-20" />
        <p className="mt-5 text-sm font-extrabold tracking-[0.16em] uppercase">Not set up yet</p>
        <p className="mt-2 text-[clamp(4.5rem,9vw,6.5rem)] leading-[0.9] font-black tracking-[-0.04em]">--</p>
        <p className="mt-1 text-lg font-bold">readiness score</p>
        <div className="mx-auto mt-6 flex max-w-[16rem] gap-[3px]">
          {Array.from({ length: 20 }, (_, i) => (
            <span key={i} className="h-4 flex-1 rounded-[2px] bg-current opacity-20" />
          ))}
        </div>
      </div>
    </div>
  );
}
