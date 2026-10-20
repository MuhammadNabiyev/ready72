import { addDays, differenceInCalendarDays, format, isValid, parseISO, startOfDay } from "date-fns";
import type { Alert } from "./engine";
import type { CustomTask, Profile, State } from "./types";

/* ------------------------------------------------------------------ */
/* the recurring tasks                                                 */
/* ------------------------------------------------------------------ */

export type TaskDef = {
  id: string;
  label: string;
  why: string;
  everyDays: number;
  custom?: boolean;
  appliesTo?: (p: Profile) => boolean;
};

export const MAINTENANCE_TASKS: TaskDef[] = [
  { id: "smoke", label: "Test smoke and CO alarms", why: "Press the test button. A silent alarm protects nobody.", everyDays: 30 },
  { id: "water-rotate", label: "Rotate stored water", why: "Empty, clean and refill containers so the water stays fresh.", everyDays: 180 },
  { id: "gobag", label: "Refresh the go-bag", why: "Swap seasonal clothes, food and anything that expired.", everyDays: 180 },
  { id: "meds-review", label: "Review medications and expiry dates", why: "Refill early and move the oldest stock to the front.", everyDays: 180, appliesTo: (p) => p.meds },
  { id: "batteries", label: "Replace alarm and flashlight batteries", why: "Fresh batteries once a year, on a date you will remember.", everyDays: 365 },
  { id: "extinguisher", label: "Check the fire extinguisher gauge", why: "The needle must sit in the green. Shake dry-powder units.", everyDays: 365 },
  { id: "shutoffs", label: "Find and test gas and water shutoffs", why: "Everyone who can reach the valve should know where it is.", everyDays: 365, appliesTo: (p) => p.hazards.includes("earthquake") || p.hazards.includes("wildfire") || p.hazards.includes("flood") },
  { id: "drains", label: "Clear gutters and storm drains", why: "Blocked drains turn heavy rain into a flooded basement.", everyDays: 365, appliesTo: (p) => p.hazards.includes("flood") },
  { id: "defensible", label: "Clear dry brush around the house", why: "Keep a clear zone of at least 10 meters around the walls.", everyDays: 365, appliesTo: (p) => p.hazards.includes("wildfire") },
  { id: "heating", label: "Service the heater and chimney", why: "Check heating and ventilation before the cold season.", everyDays: 365, appliesTo: (p) => p.hazards.includes("winter") },
  { id: "pet-records", label: "Update pet vaccination records and tags", why: "Shelters ask for proof of vaccines and a working ID tag.", everyDays: 365, appliesTo: (p) => p.pets > 0 },
];

export const MIN_EVERY_DAYS = 7;
export const MAX_EVERY_DAYS = 1095;

const customDef = (c: CustomTask): TaskDef => ({ id: c.id, label: c.label, why: "Your own reminder.", everyDays: c.everyDays, custom: true });

/** The built-in tasks that apply to this household, followed by the user's own. */
export function tasksFor(state: State): TaskDef[] {
  const p = state.profile;
  const builtIn = MAINTENANCE_TASKS.filter((t) => !t.appliesTo || (p !== null && t.appliesTo(p)));
  return [...builtIn, ...state.maintenance.custom.map(customDef)];
}

/* ------------------------------------------------------------------ */
/* status                                                              */
/* ------------------------------------------------------------------ */

export type TaskState = "never" | "overdue" | "soon" | "ok";

export type TaskStatus = {
  task: TaskDef;
  state: TaskState;
  lastDone: string | null;
  /** yyyy-MM-dd, null when the task was never done */
  dueOn: string | null;
  /** negative when overdue, null when never done */
  daysUntil: number | null;
};

const DAY = "yyyy-MM-dd";
const isDay = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && isValid(parseISO(s));

/** How many days before the due date a task is shown as "soon". Short cycles get a short warning. */
export const soonWindow = (everyDays: number) => (everyDays <= 31 ? 5 : 14);

export function taskStatus(task: TaskDef, lastDone: string | undefined, today: Date): TaskStatus {
  if (!isDay(lastDone)) return { task, state: "never", lastDone: null, dueOn: null, daysUntil: null };
  const due = addDays(parseISO(lastDone), task.everyDays);
  const daysUntil = differenceInCalendarDays(due, startOfDay(today));
  const state: TaskState = daysUntil < 0 ? "overdue" : daysUntil <= soonWindow(task.everyDays) ? "soon" : "ok";
  return { task, state, lastDone, dueOn: format(due, DAY), daysUntil };
}

const RANK: Record<TaskState, number> = { overdue: 0, never: 1, soon: 2, ok: 3 };

/** Every task with its status, most urgent first (most overdue, then never done, then soonest due). */
export function schedule(state: State, today: Date): TaskStatus[] {
  return tasksFor(state)
    .map((t) => taskStatus(t, state.maintenance.done[t.id], today))
    .sort((a, b) => RANK[a.state] - RANK[b.state] || (a.daysUntil ?? 0) - (b.daysUntil ?? 0) || a.task.label.localeCompare(b.task.label));
}

export function counts(list: TaskStatus[]) {
  const c = { overdue: 0, never: 0, soon: 0, ok: 0 };
  for (const s of list) c[s.state]++;
  return c;
}

/** "Due in 3 days", "Overdue by 12 days", "Never done". */
export function describeDue(s: TaskStatus): string {
  if (s.daysUntil === null) return "Never done";
  const n = Math.abs(s.daysUntil);
  const unit = n === 1 ? "day" : "days";
  if (s.daysUntil < 0) return `Overdue by ${n} ${unit}`;
  if (s.daysUntil === 0) return "Due today";
  if (s.daysUntil === 1) return "Due tomorrow";
  return `Due in ${n} days`;
}

/** "Every month", "Every 6 months", "Every year", "Every 45 days". */
export function describeEvery(days: number): string {
  if (days === 7) return "Every week";
  if (days === 30) return "Every month";
  if (days === 90) return "Every 3 months";
  if (days === 180) return "Every 6 months";
  if (days === 365) return "Every year";
  return `Every ${days} days`;
}

/* ------------------------------------------------------------------ */
/* transitions                                                         */
/* ------------------------------------------------------------------ */

/** Record `day` (yyyy-MM-dd) as the last time the task was done. Unknown ids and invalid days change nothing. */
export function markDone(state: State, taskId: string, day: string): State {
  if (!isDay(day) || !tasksFor(state).some((t) => t.id === taskId)) return state;
  return { ...state, maintenance: { ...state.maintenance, done: { ...state.maintenance.done, [taskId]: day } } };
}

export function undoDone(state: State, taskId: string): State {
  const { [taskId]: _removed, ...rest } = state.maintenance.done;
  void _removed;
  return { ...state, maintenance: { ...state.maintenance, done: rest } };
}

export type TaskErrors = Partial<Record<"label" | "everyDays", string>>;

export function validateCustomTask(t: { label: string; everyDays: number }): TaskErrors {
  const e: TaskErrors = {};
  if (!t.label.trim()) e.label = "Name the task";
  else if (t.label.trim().length > 60) e.label = "Keep it under 60 characters";
  if (!Number.isInteger(t.everyDays) || t.everyDays < MIN_EVERY_DAYS || t.everyDays > MAX_EVERY_DAYS) {
    e.everyDays = `Between ${MIN_EVERY_DAYS} and ${MAX_EVERY_DAYS} days`;
  }
  return e;
}

let seq = 0;
export function addCustomTask(state: State, t: { label: string; everyDays: number }): State {
  if (Object.keys(validateCustomTask(t)).length) return state;
  const task: CustomTask = { id: `mt_${Date.now().toString(36)}${(seq++).toString(36)}`, label: t.label.trim(), everyDays: t.everyDays };
  return { ...state, maintenance: { ...state.maintenance, custom: [...state.maintenance.custom, task] } };
}

export function removeCustomTask(state: State, id: string): State {
  const { [id]: _removed, ...rest } = state.maintenance.done;
  void _removed;
  return { ...state, maintenance: { done: rest, custom: state.maintenance.custom.filter((c) => c.id !== id) } };
}

/* ------------------------------------------------------------------ */
/* dashboard alerts and calendar export                                */
/* ------------------------------------------------------------------ */

/** Overdue and soon-due tasks, plus one line for tasks nobody has ever checked off. */
export function maintenanceAlerts(state: State, today: Date): Alert[] {
  if (!state.profile) return [];
  const out: Alert[] = [];
  const list = schedule(state, today);
  for (const s of list) {
    if (s.state === "overdue") {
      out.push({ id: `maint:${s.task.id}`, severity: "warn", text: `${s.task.label}: ${describeDue(s).toLowerCase()}`, href: "/maintenance" });
    } else if (s.state === "soon") {
      out.push({ id: `maint:${s.task.id}`, severity: "info", text: `${s.task.label}: ${describeDue(s).toLowerCase()}`, href: "/maintenance" });
    }
  }
  const never = list.filter((s) => s.state === "never").length;
  if (never > 0) {
    out.push({ id: "maint:never", severity: "info", text: `${never} home maintenance ${never === 1 ? "task has" : "tasks have"} never been checked off`, href: "/maintenance" });
  }
  return out;
}

export type CalendarTask = { id: string; label: string; why: string; start: Date; everyDays: number };

/** First calendar date for each recurring task: its due date, or a few days out if overdue or never done. */
export function calendarTasks(state: State, today: Date): CalendarTask[] {
  const t0 = startOfDay(today);
  return schedule(state, today).map((s) => {
    const due = s.dueOn ? parseISO(s.dueOn) : null;
    const start = due && due >= t0 ? due : addDays(t0, s.state === "never" ? 3 : 1);
    return { id: s.task.id, label: s.task.label, why: s.task.why, start, everyDays: s.task.everyDays };
  });
}
