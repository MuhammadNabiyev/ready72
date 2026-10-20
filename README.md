# Ready72

**Could your household last 72 hours?** Ready72 turns "who lives in your home" and "which disasters you face" into an exact list of what to store, a readiness score, a shopping list, and stress tests like *"evacuate in 15 minutes"*. No account. Everything stays in your browser. It installs as an app and works offline, because that is when it matters.

Built for the TestSprite Season 4 hackathon.

**Live:** https://ready72-weld.vercel.app

## The problem

Authorities say to be able to survive on your own for at least 72 hours. Almost nobody knows what that means for *their* household: how many liters of water for two adults, a child and a dog? Is the first-aid kit enough? Which of the things in the cupboard have expired? Generic checklists do not answer that, so people guess, or do nothing.

## What it does

| | |
|---|---|
| **Personal checklist** | 30+ items worked out from adults, children, infants, pets, medication, mobility needs and the hazards you pick (earthquake, flood, wildfire, winter storm, heat, outage). 4 / 3 / 2 L of water a day per adult / child / infant, 1 L per pet, +25% in a heat risk area. 2000 / 1500 / 800 kcal of food. |
| **Kit tracker** | Log water, food (with calories per unit and staple presets), gear, documents. Expired items stop counting. Flag items as *go-bag*. |
| **Readiness score** | 0-100, weighted toward water and food, then power, medicine, documents and the family plan. Categories that do not apply to you are left out. |
| **Supply runway** | Which supply runs out first, in days, against your target. |
| **Next best actions + shopping list** | The steps that raise the score most; a list of only what is missing; "mark bought" moves it into the kit. |
| **Stress tests** | Shelter 3 days, week-long outage, evacuate in 15 minutes (go-bag only), heatwave + blackout, winter storm. Each check passes or fails with the exact shortfall. |
| **Crisis mode** | One high-contrast screen: what to do now for your hazard, who to call (tap-to-dial), where to meet, a go-bag checklist. |
| **Family plan** | Contacts, meeting points, drills (180-day cadence), notes. Print it, copy it, share a read-only link (plan only, never the kit), or export expiry reminders as an `.ics` calendar file. |
| **Time machine** | Drag a clock from hour 0 to 14 days (or press "Run the clock") and watch water, food, medication and pet food drain at your pace, with a one-line story ("Water ran out on day 4, 00:00."). |
| **Your own scenarios** | Create a stress test: name, 1-30 days, extreme heat, go-bag only, the items you must have, contact and meeting-point requirements. Saved locally. |
| **Command palette** | `Ctrl/Cmd + K` jumps to any page or runs an action (log a drill, copy the share link, switch theme, share your card). |
| **Night mode** | A full dark theme, remembered between visits, with no flash on load. |
| **Share card** | A 1200x630 image of your score and days covered, plus ready-to-post text. It never includes your kit or contacts. |
| **Evacuation drill** | `/drill`: a live 15-minute countdown and a step checklist built from your own household (go-bag, pets, medication, mobility, meeting point). Finishing every step logs a drill and keeps your best time. |
| **Home maintenance** | `/maintenance`: recurring tasks (smoke alarms monthly, stored water and go-bag every 6 months, batteries and extinguisher yearly, plus ones for your hazards, pets and medication). One tap "Done today", overdue and due-soon states, your own tasks. Feeds the dashboard alerts and the calendar export (repeating events). |
| **Emergency cards** | `/cards`: a wallet-size card per person with blood type, allergies, medication, notes and the contacts from your plan. Print-ready sheet on A4, black on white in any theme. |
| **Water treatment helper** | On `/guides`: boiling time by altitude and bleach drops per liter by bleach strength, clear or cloudy water, with a quick table and your household's daily amount. |
| **Offline PWA** | Service worker + web manifest; data lives in `localStorage`. Backup and restore as JSON. |

## How it is tested (and how that is wired into shipping)

Ready72's value is in its numbers, so the numbers are tested twice, at two levels:

1. **Unit tests for the preparedness engine** (`src/lib/*.test.ts`, 131 tests, Vitest). Pure functions, no DOM: drill timer and best-time logic, maintenance scheduling (overdue, soon, never done, custom tasks, calendar output), wallet-card data, water-treatment doses, loading older saved data; plus requirement math, coverage and expiry, scoring weights, next actions, shopping list, alerts, scenario evaluation, custom scenarios, the time-machine timeline and narration, share card text, runway, share-link round trip, calendar output, input validation.
2. **End-to-end UI tests with [TestSprite](https://www.testsprite.com)** run against the deployed app on **every pull request** through the TestSprite GitHub App: household setup and live preview, kit entry dialogs (validation, presets, expiry picker), shopping list, plan forms, stress-test verdicts, crisis mode, settings (reset, restore).

GitHub Actions (`.github/workflows/ci.yml`) also runs lint, type check, unit tests and the production build on every PR, so a change cannot reach TestSprite without passing the cheap checks first. Every important control has a stable `data-testid`.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests
npm run lint && npm run typecheck && npm run build
```

Stack: Next.js (App Router), Tailwind CSS 4, Radix UI (dialog, select, radio group, popover), react-day-picker, date-fns, Vitest. No backend, no tracking.

## A note on safety

Ready72 gives general preparedness guidance based on public recommendations from civil-protection and health agencies. In an emergency, follow your local authorities and call your emergency number.
