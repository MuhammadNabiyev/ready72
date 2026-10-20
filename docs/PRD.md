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

### Settings
- Editing the household recalculates all targets. "Erase everything" and "Load the sample household" ask for confirmation in a dialog. Backup downloads JSON; restore accepts that JSON.

## Test data
Use "Explore a sample household" on `/` for a ready-made half-prepared family (2 adults, 2 children, 1 dog; earthquake, wildfire, outage; takes medication; 3 days). It has an expired water entry, low medication, an overdue drill and one contact.

## Stable selectors
Important controls expose `data-testid`, for example: `cta-build`, `cta-sample`, `hh-adults-inc`, `hazard-earthquake`, `days-7`, `hh-submit`, `add-water`, `entry-name`, `entry-qty`, `entry-save`, `bought-water`, `contact-name`, `contact-phone`, `contact-save`, `log-drill`, `scenario-evac15`, `verdict`, `reset-all`, `confirm-yes`.
