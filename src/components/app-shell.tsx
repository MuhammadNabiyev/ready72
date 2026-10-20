"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Backpack, ClipboardList, LayoutDashboard, Settings, ShoppingCart, Siren } from "lucide-react";
import { loadSample, useApp } from "@/lib/store";
import { Logo } from "./logo";

const NAV = [
  { href: "/dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { href: "/kit", label: "My kit", short: "Kit", icon: Backpack },
  { href: "/shopping", label: "Shopping list", short: "Shop", icon: ShoppingCart },
  { href: "/plan", label: "Family plan", short: "Plan", icon: ClipboardList },
  { href: "/stress-test", label: "Stress test", short: "Test", icon: Siren },
  { href: "/guides", label: "Guides", short: "Guides", icon: BookOpen },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const state = useApp();
  const path = usePathname();

  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <header className="no-print sticky top-0 z-40 border-b-2 border-ink bg-canvas/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/" aria-label="Ready72 home" className="shrink-0">
            <Logo />
          </Link>
          <nav aria-label="Main" className="ml-2 hidden flex-1 items-center gap-1 md:flex">
            {NAV.map((n) => {
              const active = path === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  data-testid={`nav-${n.href.slice(1)}`}
                  className="relative px-3 py-2 font-semibold transition-colors hover:text-signal-deep aria-[current=page]:text-ink"
                >
                  {n.label}
                  <span
                    aria-hidden
                    className="absolute inset-x-3 -bottom-[13px] h-[3px] origin-left bg-signal transition-transform duration-300"
                    style={{ transform: active ? "scaleX(1)" : "scaleX(0)", transitionTimingFunction: "var(--ease-out)" }}
                  />
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <Link
              href="/crisis"
              data-testid="nav-crisis"
              className="mr-1 inline-flex min-h-10 items-center gap-2 rounded border-2 border-ink bg-ink px-3 text-sm font-bold text-canvas transition-colors hover:bg-signal hover:text-ink"
            >
              <span aria-hidden className="relative grid size-2.5 place-items-center">
                <span className="absolute size-2.5 rounded-full bg-signal" style={{ animation: "pulse-ring 1.8s ease-out infinite" }} />
                <span className="size-2 rounded-full bg-signal" />
              </span>
              Crisis mode
            </Link>
            <Link href="/settings" aria-label="Settings" data-testid="nav-settings" className="grid size-11 place-items-center rounded hover:bg-canvas-2">
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

      <nav aria-label="Main" className="no-print fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t-2 border-ink bg-canvas md:hidden">
        {NAV.map((n) => {
          const active = path === n.href;
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              aria-label={n.label}
              data-testid={`tab-${n.href.slice(1)}`}
              className="flex min-h-16 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold text-ink-soft transition-colors aria-[current=page]:bg-signal aria-[current=page]:text-ink"
            >
              <Icon className="size-5" aria-hidden />
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
    <div className="max-w-xl rise" data-testid="no-household">
      <h1 className="text-5xl">Start with your household.</h1>
      <p className="mt-4 text-lg text-ink-soft">
        Ready72 needs to know who lives with you and which hazards you face before it can work out what you need.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/setup" className="btn btn-primary" data-testid="go-setup">
          Build my plan
        </Link>
        <button type="button" className="btn" onClick={loadSample} data-testid="load-sample">
          Try a sample household
        </button>
      </div>
    </div>
  );
}
