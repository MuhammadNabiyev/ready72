"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, Search } from "lucide-react";
import { logDrill } from "@/lib/actions";
import { dayKey } from "@/lib/engine";
import { markDone } from "@/lib/maintenance";
import { encodeShare, toSharedPlan } from "@/lib/share";
import { commit, getState, loadSample } from "@/lib/store";
import { getTheme, toggleTheme } from "@/lib/theme";
import { toast } from "./ui";

export const OPEN_PALETTE = "ready72:palette";
export const OPEN_SHARE = "ready72:share";

type Item = { id: string; label: string; hint: string; group: "Go to" | "Do"; keywords?: string; run: () => void };

/** Ctrl/Cmd+K: jump anywhere or run an action without touching the mouse. */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const go = useCallback((href: string) => () => router.push(href), [router]);

  const items: Item[] = useMemo(
    () => [
      { id: "go-dashboard", label: "Dashboard", hint: "Your score and next steps", group: "Go to", run: go("/dashboard") },
      { id: "go-kit", label: "My kit", hint: "Everything you need, and what you have", group: "Go to", keywords: "inventory supplies water food", run: go("/kit") },
      { id: "go-shopping", label: "Shopping list", hint: "Only what is missing", group: "Go to", keywords: "buy gaps", run: go("/shopping") },
      { id: "go-plan", label: "Family plan", hint: "Contacts, meeting points, drills", group: "Go to", keywords: "contacts meeting drill notes", run: go("/plan") },
      { id: "go-stress", label: "Stress test", hint: "Test your kit against a scenario", group: "Go to", keywords: "scenario evacuate outage", run: go("/stress-test") },
      { id: "go-guides", label: "Hazard guides", hint: "Before, during and after", group: "Go to", keywords: "earthquake flood wildfire", run: go("/guides") },
      { id: "go-tools", label: "Tools", hint: "Drill, maintenance, emergency cards, water", group: "Go to", keywords: "extras", run: go("/tools") },
      { id: "go-drill", label: "Evacuation drill", hint: "Timed 15-minute run with a checklist", group: "Go to", keywords: "practice evacuate timer countdown best time", run: go("/drill") },
      { id: "go-maintenance", label: "Home maintenance", hint: "What is due: alarms, water, batteries", group: "Go to", keywords: "smoke alarm battery extinguisher recurring schedule", run: go("/maintenance") },
      { id: "go-cards", label: "Emergency cards", hint: "Printable wallet cards", group: "Go to", keywords: "wallet blood type allergies medication print", run: go("/cards") },
      { id: "go-water", label: "Make water safe", hint: "Boiling time and bleach drops", group: "Go to", keywords: "purify treat bleach boil drinking", run: go("/guides#water-h") },
      { id: "go-crisis", label: "Crisis mode", hint: "What to do right now", group: "Go to", keywords: "emergency help", run: go("/crisis") },
      { id: "go-settings", label: "Settings", hint: "Household, backup, erase", group: "Go to", keywords: "backup restore household", run: go("/settings") },
      { id: "go-home", label: "Home page", hint: "Back to the start", group: "Go to", run: go("/") },
      {
        id: "do-drill",
        label: "Log a drill I did today",
        hint: "Keeps your plan fresh",
        group: "Do",
        keywords: "practice",
        run: () => {
          commit((s) => logDrill(s, dayKey(new Date())));
          toast("Drill logged. Nice work");
        },
      },
      {
        id: "do-smoke",
        label: "Mark smoke alarms tested today",
        hint: "Resets the monthly reminder",
        group: "Do",
        keywords: "maintenance check alarm",
        run: () => {
          commit((s) => markDone(s, "smoke", dayKey(new Date())));
          toast("Smoke alarm test recorded. Next one in 30 days");
        },
      },
      { id: "do-share", label: "Share my readiness card", hint: "Image and text for posting", group: "Do", keywords: "tweet image png", run: () => window.dispatchEvent(new Event(OPEN_SHARE)) },
      {
        id: "do-link",
        label: "Copy plan share link",
        hint: "Contacts and meeting points only",
        group: "Do",
        run: async () => {
          try {
            await navigator.clipboard.writeText(`${window.location.origin}/share#${encodeShare(toSharedPlan(getState()))}`);
            toast("Share link copied");
          } catch {
            toast("Copy is blocked in this browser");
          }
        },
      },
      { id: "do-theme", label: "Switch theme", hint: "Night mode and day mode", group: "Do", keywords: "dark light night", run: () => { toggleTheme(); toast(getTheme() === "night" ? "Night mode on" : "Day mode on"); } },
      { id: "do-sample", label: "Load the sample household", hint: "Replaces your data", group: "Do", run: () => { loadSample(); toast("Sample household loaded"); router.push("/dashboard"); } },
    ],
    [go, router],
  );

  const q = query.trim().toLowerCase();
  const shown = q
    ? items.filter((i) => q.split(/\s+/).every((t) => `${i.label} ${i.hint} ${i.keywords ?? ""}`.toLowerCase().includes(t)))
    : items;
  const safeActive = Math.min(active, Math.max(0, shown.length - 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE, onOpen);
    };
  }, []);

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [safeActive, open]);

  function choose(item?: Item) {
    if (!item) return;
    setOpen(false);
    setQuery("");
    setActive(0);
    // let the dialog close first so focus returns cleanly before the action runs
    setTimeout(() => item.run(), 0);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(shown.length ? (safeActive + 1) % shown.length : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(shown.length ? (safeActive - 1 + shown.length) % shown.length : 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(shown[safeActive]);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setQuery("");
          setActive(0);
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content
          className="fixed top-[12vh] left-1/2 z-[55] w-[min(36rem,calc(100vw-1.5rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-rule-strong bg-paper shadow-[0_30px_70px_-24px_oklch(0.2_0.05_248/0.55)]"
          style={{ animation: "pop 180ms var(--ease-out)" }}
          data-testid="palette"
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Dialog.Description className="sr-only">Type to filter. Arrow keys move, Enter runs, Escape closes.</Dialog.Description>
          <div className="flex items-center gap-3 border-b border-rule-strong px-4">
            <Search className="size-5 shrink-0 text-ink-soft" aria-hidden />
            <input
              role="combobox"
              aria-expanded
              aria-controls="palette-list"
              aria-activedescendant={shown[safeActive] ? `pal-${shown[safeActive].id}` : undefined}
              aria-label="Search pages and actions"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Jump to a page or run an action…"
              className="h-14 w-full bg-transparent text-lg outline-none placeholder:text-ink-soft"
              data-testid="palette-input"
              autoFocus
            />
          </div>
          <ul id="palette-list" ref={listRef} role="listbox" aria-label="Results" className="max-h-[50vh] overflow-y-auto p-2" data-testid="palette-list">
            {shown.length === 0 && (
              <li className="px-3 py-6 text-center text-ink-soft" data-testid="palette-empty">
                Nothing matches “{query}”.
              </li>
            )}
            {shown.map((item, i) => {
              const showGroup = i === 0 || shown[i - 1].group !== item.group;
              return (
                <li key={item.id} role="presentation">
                  {showGroup && <p className="mono-label px-3 pt-3 pb-1">{item.group}</p>}
                  <div
                    id={`pal-${item.id}`}
                    role="option"
                    aria-selected={i === safeActive}
                    data-testid={`palette-${item.id}`}
                    onMouseMove={() => setActive(i)}
                    onClick={() => choose(item)}
                    className="flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded px-3 py-2 aria-selected:bg-ink aria-selected:text-canvas"
                  >
                    <span>
                      <span className="block font-semibold">{item.label}</span>
                      <span className="block text-sm opacity-70">{item.hint}</span>
                    </span>
                    {i === safeActive && <CornerDownLeft className="size-4 shrink-0" aria-hidden />}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="flex gap-4 border-t border-rule px-4 py-2 font-mono text-xs text-ink-soft" aria-hidden>
            <span>↑↓ move</span>
            <span>↵ run</span>
            <span>esc close</span>
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
