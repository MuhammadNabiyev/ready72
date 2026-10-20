# Ready72 — Product Requirements

Ready72 is a single-page-style web app (no backend, no sign-in) that tells a household exactly what it needs to survive 72 hours or more without outside help, tracks what it already has, and tests that kit against disaster scenarios. All data is stored in the browser's `localStorage`.

Base URL: `https://ready72-weld.vercel.app`. No login is required anywhere.

## Pages

| Path | Purpose |
|---|---|
| `/` | Landing page. CTA "Build my plan" → `/setup`; "Explore a sample household" loads sample data and opens `/dashboard`. |
| `/setup` | Household form (who, hazards, needs, target days) with a live preview of water, food and checklist size. |
| `/dashboard` | Headline "Ready for X of N days", readiness score 0–100 with gauge, supply runway, next actions, alerts, category bars. |
| `/kit` | Every requirement with progress bar; add / delete entries; go-bag flag. |
| `/shopping` | Only what is missing; "Mark bought" closes the gap. |
| `/plan` | Emergency contacts, meeting points, drills, notes, print/copy/share/calendar export. |
| `/stress-test` | Five scenarios evaluated line by line with pass/fail. |
| `/crisis` | High-contrast "what to do now" screen. |
| `/guides` | Before / during / after guidance per hazard. |
| `/tools` | Hub linking the four tools below, each with a live status line. |
| `/drill` | Timed evacuation drill. |
| `/maintenance` | Recurring home maintenance tasks. |
| `/cards` | Printable emergency wallet cards. |
| `/settings` | Edit household, backup/restore JSON, load sample, erase everything. |
| `/share#<token>` | Read-only plan received from a share link. |

If no household exists, any app page shows "Start with your household." with "Build my plan" and "Try a sample household".

## Core rules (acceptance criteria)

### Household and requirements
- Adults 1–10, children 0–10, infants 0–5, pets 0–10, at most 20 people. Out-of-range values show an error and block submit.
- Water per day: 4 L adult, 3 L child, 2 L infant, 1 L pet. If the "Extreme heat" hazard is selected, multiply by 1.25. Target = daily × days (3, 7 or 14), rounded up.
- Food per day: 2000 kcal adult, 1500 kcal child, 800 kcal infant. Target = daily × days.
- Example: 2 adults + 1 child, 3 days, no hazards → 33 L of water (11 L × 3) and 16,500 kcal of food (5,500 kcal × 3). The `/setup` preview shows these numbers and updates live.
- Medication requirement appears only if "Someone takes daily medication" is on (need = max(days, 7) days). Pet requirements appear only if pets > 0. Infant formula requirement only if infants > 0. Hazards add their own items (e.g. wildfire adds N95 masks, earthquake adds a gas shutoff wrench).
- Flashlights and whistles: one per person. Power banks: ceil(people / 2), minimum 1.

### Kit
- "Add" on a requirement opens a dialog. Name is required. Quantity must be > 0 (whole number except water, which allows decimals). Food needs calories per unit; choosing a staple preset (e.g. "Rice, 1 kg bag · 3,600 kcal") fills name and calories. The dialog previews the amount added ("Adds 7,200 kcal").
- Checklist-type items (e.g. hand sanitizer) are yes/no.
- Expired entries do not count toward the kit; the row shows "N expired and not counted". Items that expire today still count.
- Deleting an entry removes it and updates progress. Entries can be flagged "Go-bag".
- Category filter chips filter the list.

### Readiness score
- 0–100 weighted: water 20, food 20, power 8, first aid 8, medication 8 (only if applicable), hygiene 4, tools 6, warmth 4, documents 8, pets 5 (only if applicable), family plan 14.
- Levels: <25 Exposed, 25–49 Getting started, 50–74 Prepared, 75–89 Well prepared, ≥90 Ready.
- An empty kit scores 0. Adding water raises the score. Expired water lowers it.

### Shopping list
- Lists only requirements with a gap, critical ones first. Examples: "Store 20 more liters of water", "Get: hand sanitizer or wipes".
- "Mark bought" adds an entry that closes the gap and the line disappears. When nothing is missing it shows "Fully stocked."

### Family plan
- Contact: name required; phone must contain at least 7 digits and only digits, spaces, +, (), -, . Roles: Family, Out-of-town contact, Neighbor, Doctor, Other.
- Meeting point: place text required. Types: right outside the home, in the neighborhood, out of town.
- "Log a drill I did today" records today's drill once per day. A drill older than 180 days is "overdue".
- Notes save when the textarea loses focus.
- Copy share link produces `/share#…` containing contacts, meeting points, notes and hazards only (never the kit).

### Stress tests
- Scenarios: Shelter in place 3 days, Week-long outage 7 days, Evacuate in 15 minutes (only go-bag items count, 1 day of water/food), Heatwave and blackout 3 days (+25% water), Winter storm 5 days.
- Each check shows pass/fail and the shortfall, e.g. "20 of 33 L (short by 13 L)". The verdict is "Pass" only if every check passes, otherwise "Not yet" with a link to fix it.
- Evacuation also requires one emergency contact and one meeting point away from home.

### Crisis mode
- Shows steps for the selected hazard, tap-to-dial contacts, meeting points, a go-bag checklist (tappable items get struck through), and the supply that runs out first.

### Dashboard extras
- **Time machine** (`data-testid="time-machine"`): a slider `tm-slider` from 0 to 336 hours in 6-hour steps, a clock `tm-clock` ("Day 1, 00:00"), a "Run the clock" button `tm-play` that advances time and turns into "Pause", and `tm-reset`. Water drains at the household's daily need, food at its daily kcal, medication/pet food/infant supplies at 1 day per 24 hours. A supply at zero shows "Gone". The headline `tm-headline` names the first supply that has run out ("Water ran out on day 4, 00:00.") or says "Everything is still holding."
- **Share my score** opens a dialog with a canvas card, the post text, "Download image" and "Copy text".

### Custom scenarios
- On `/stress-test`, "Create your own scenario" opens a dialog: name (required, max 60), days 1-30, "Extreme heat (+25% water)", "Go-bag only", optional must-have items, contact and meeting-point requirements. The new scenario appears in the list with a delete button and is evaluated like the built-ins.

### Evacuation drill (`/drill`)
- Steps are built from the household: always go-bag, shut-off, documents, head count, meeting point; plus mobility help first (if mobility needs), pets (if pets > 0), medication (if takes medication). The meeting-point step shows the first non-home meeting point, else the home one, else a prompt to add one.
- `drill-start` starts a 15:00 countdown shown in `drill-clock` ("Time left"); past zero it shows "Over the limit by". Steps `drill-step-<id>` (`gobag`, `shutoff`, `pets`, `meds`, `docs`, `headcount`, `meeting`, `mobility`) are `role=checkbox` buttons, disabled until the clock runs. `drill-progress` shows "N of M steps".
- `drill-finish` stops the clock and saves the run. Label is "Finish" when every step is ticked, otherwise "Stop and save (N of M)". The result shows `drill-verdict`: Outstanding (<= 5:00), Solid (<= 10:00), You made it (<= 15:00), Too slow (> 15:00) when every step was done; "Not finished" otherwise.
- A run with every step done also logs today's drill (same record as "Log a drill I did today", once per day). An unfinished run is kept in `drill-history` but is not a drill and never a record.
- `drill-best-time` is the fastest fully completed run; a faster run shows `drill-pb` ("New best time"); `drill-compare` compares with the previous completed run. `drill-again` restarts. With no finished run `drill-no-best` is shown. History keeps the last 50 runs, 5 are listed.
- The sample household has one completed run of 13:05, so `drill-best-time` reads 13:05.

### Home maintenance (`/maintenance`)
- Tasks: test smoke and CO alarms (30 days), rotate stored water (180), refresh go-bag (180), replace batteries (365), check fire extinguisher (365); medication review (180) only if takes medication; find shutoffs (365) for earthquake, wildfire or flood; clear drains (flood); clear brush (wildfire); service heater (winter); pet records (pets > 0).
- Each row `maint-task-<id>` has `data-state` = `overdue`, `soon`, `never` or `ok`, and `maint-status-<id>` text: "Never done", "Overdue by N days", "Due today", "Due tomorrow", "Due in N days" plus the interval. Due date = last done + interval. "Soon" is within 5 days for tasks of 31 days or less, within 14 days otherwise. Order: overdue, never done, soon, ok.
- `maint-done-<id>` ("Done today") records today; the row then shows `maint-undo-<id>`. `maint-summary` reads e.g. "1 overdue � 1 due soon � 5 not checked yet" or "Everything is up to date." with `data-overdue`, `data-soon`, `data-never`.
- Custom tasks: `maint-new-label` (required, max 60), `maint-new-every` (select: week, month, 3 months, 6 months, year), `maint-add`; custom rows have `maint-remove-<id>`.
- Dashboard "Needs attention": overdue task = warning, due-soon = note, plus one note "N home maintenance tasks have never been checked off". All link to `/maintenance`. `maint-ics` (and the plan page's calendar button) export one repeating event per task (`RRULE:FREQ=DAILY;INTERVAL=<days>`) starting on its due date (tomorrow if overdue).
- The sample household has smoke alarms overdue by 11 days and stored water due in 10 days. The command palette action "Mark smoke alarms tested today" records it.

### Emergency cards (`/cards`)
- Person: name required (max 60), blood type from a list (`card-blood`, "Not known" default), allergies, medication, notes (each max 200). `card-save` adds (or saves when editing via `card-edit-<id>`); `card-remove-<id>` removes. Up to 20 people.
- `cards-from-household` ("Add my household (N)") fills up to the household size with "Adult 1", "Child 1", "Infant 1"... names and is disabled ("Household added") when the list is already as long as the household. The sample household has 3 of its 4 people, so the button adds one.
- `card-sheet` holds one `card-<id>` per person: "In case of emergency", household name, name, blood type, allergies, medication (both "None known" when empty), notes, and up to three contacts (out-of-town contact first). `cards-print` opens the print dialog; only the sheet prints, at 90 mm wide, two columns on A4, black on white in night mode too. `card-contacts-missing` appears when the plan has no contacts. `cards-empty` appears with no people.

### Water treatment (on `/guides`, `data-testid="water-helper"`)
- `water-boil`: 1 minute up to 2,000 m, 3 minutes above (`water-altitude` select). `water-drops`: drops of bleach for `water-liters` (1-100) at `water-strength` (5%, 6%, 8.25%): 8 drops of 6% per US gallon (3.785 L), 10 for 5%, 6 for 8.25%, rounded up; doubled when `water-cloudy` is on (`water-clear` resets); wait 30 minutes (`water-wait`). Default 4 L at 6% clear = 9 drops; cloudy = 17. `water-table` rows `water-row-1|2|4|10|20`. `water-daily` shows the household's daily need (sample: 15 L, 32 drops).

### Command palette and theme
- `Ctrl+K` (or `Cmd+K`) opens a palette: type to filter, arrow keys move, Enter runs, Escape closes. It lists pages and actions (log a drill, mark smoke alarms tested, share card, copy share link, switch theme, load sample, and pages `palette-go-tools`, `palette-go-drill`, `palette-go-maintenance`, `palette-go-cards`, `palette-go-water`).
- The moon/sun button `theme-toggle` switches night mode; the choice persists.

### Settings
- Editing the household recalculates all targets. "Erase everything" and "Load the sample household" ask for confirmation in a dialog. Backup downloads JSON; restore accepts that JSON.

## Test data
Use "Explore a sample household" on `/` for a ready-made half-prepared family (2 adults, 2 children, 1 dog; earthquake, wildfire, outage; takes medication; 3 days). It has an expired water entry, low medication, an overdue drill and one contact.

## Stable selectors
Important controls expose `data-testid`, for example: `cta-build`, `cta-sample`, `hh-adults-inc`, `hazard-earthquake`, `days-7`, `hh-submit`, `add-water`, `entry-name`, `entry-qty`, `entry-save`, `bought-water`, `contact-name`, `contact-phone`, `contact-save`, `log-drill`, `scenario-evac15`, `verdict`, `reset-all`, `confirm-yes`, `nav-tools`, `tool-drill`, `drill-start`, `drill-finish`, `maint-done-smoke`, `cards-from-household`, `card-sheet`, `water-drops`.
