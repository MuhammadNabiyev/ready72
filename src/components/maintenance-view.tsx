"use client";

import { useState } from "react";
import { CalendarPlus, Check, Trash2, Undo2 } from "lucide-react";
import { dayKey } from "@/lib/engine";
import { buildIcs } from "@/lib/ics";
import { addCustomTask, counts, describeDue, describeEvery, markDone, removeCustomTask, schedule, undoDone, validateCustomTask, type TaskErrors } from "@/lib/maintenance";
import { commit, useApp } from "@/lib/store";
import { Pictogram, StatusShape } from "./pictogram";
import { Field, PageTitle, SelectField, toast } from "./ui";

const EVERY_OPTIONS = [
  { value: "7", label: "Every week" },
  { value: "30", label: "Every month" },
  { value: "90", label: "Every 3 months" },
  { value: "180", label: "Every 6 months" },
  { value: "365", label: "Every year" },
];

const SHAPE = { overdue: "bad", soon: "warn", never: "info", ok: "ok" } as const;
const SHAPE_LABEL = { overdue: "Overdue", soon: "Due soon", never: "Not checked yet", ok: "Up to date" } as const;

/** Recurring home safety tasks: what is due, what is late, and a one-tap "done today". */
export function MaintenanceView() {
  const state = useApp();
  const now = new Date();
  const today = dayKey(now);
  const list = schedule(state, now);
  const c = counts(list);

  const [label, setLabel] = useState("");
  const [every, setEvery] = useState("90");
  const [err, setErr] = useState<TaskErrors>({});

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    const draft = { label, everyDays: Number(every) };
    const errors = validateCustomTask(draft);
    setErr(errors);
    if (Object.keys(errors).length) return;
    commit((s) => addCustomTask(s, draft));
    toast(`Added: ${label.trim()}`);
    setLabel("");
  }

  function downloadIcs() {
    const blob = new Blob([buildIcs(state, new Date())], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ready72-reminders.ics";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Calendar file downloaded. Tasks repeat on their own");
  }

  const summary =
    c.overdue + c.soon + c.never === 0
      ? "Everything is up to date."
      : [c.overdue && `${c.overdue} overdue`, c.soon && `${c.soon} due soon`, c.never && `${c.never} not checked yet`].filter(Boolean).join(" · ");

  return (
    <div>
      <PageTitle title="Home maintenance">
        A kit only works if the smoke alarm beeps and the water is fresh. Check each task off and Ready72 tells you when it is due again.
      </PageTitle>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <p className="text-lg font-bold" data-testid="maint-summary" data-overdue={c.overdue} data-soon={c.soon} data-never={c.never}>
          {summary}
        </p>
        <button type="button" className="btn btn-sm" onClick={downloadIcs} data-testid="maint-ics">
          <CalendarPlus className="size-4" aria-hidden />
          Add to calendar
        </button>
      </div>

      <ul className="mt-8 divide-y divide-rule border-y border-rule-strong" data-testid="maint-list">
        {list.map((s) => {
          const t = s.task;
          const doneToday = s.lastDone === today;
          return (
            <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4 sm:flex-nowrap" data-testid={`maint-task-${t.id}`} data-state={s.state}>
              <StatusShape kind={SHAPE[s.state]} className="size-8 shrink-0" label={SHAPE_LABEL[s.state]} />
              <div className="min-w-0 flex-1 basis-56">
                <p className="text-lg font-bold">{t.label}</p>
                <p className="text-sm text-ink-soft">{t.why}</p>
                <p className="mt-1 text-sm font-semibold" data-testid={`maint-status-${t.id}`}>
                  {describeDue(s)}
                  <span className="font-normal text-ink-soft"> · {describeEvery(t.everyDays)}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {doneToday ? (
                  <button type="button" className="btn btn-sm" onClick={() => commit((st) => undoDone(st, t.id))} data-testid={`maint-undo-${t.id}`}>
                    <Undo2 className="size-4" aria-hidden />
                    Undo
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      commit((st) => markDone(st, t.id, dayKey(new Date())));
                      toast(`Done: ${t.label}`);
                    }}
                    data-testid={`maint-done-${t.id}`}
                  >
                    <Check className="size-4" aria-hidden />
                    Done today
                  </button>
                )}
                {t.custom && (
                  <button type="button" className="grid size-10 place-items-center rounded text-bad hover:bg-bad-soft" aria-label={`Remove ${t.label}`} onClick={() => commit((st) => removeCustomTask(st, t.id))} data-testid={`maint-remove-${t.id}`}>
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <section className="mt-16 max-w-3xl" aria-labelledby="own-h">
        <h2 id="own-h" className="flex items-center gap-3 text-3xl">
          <Pictogram name="calendar" className="size-8" />
          Add your own
        </h2>
        <p className="mt-1 text-ink-soft">Water heater flush, generator test, anything you would otherwise forget.</p>
        <form onSubmit={addTask} noValidate className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem_auto] sm:items-start" data-testid="maint-form">
          <Field label="Task" htmlFor="mt-label" error={err.label}>
            <input id="mt-label" className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Test the generator" aria-invalid={!!err.label} data-testid="maint-new-label" />
          </Field>
          <Field label="How often" htmlFor="mt-every" error={err.everyDays}>
            <SelectField label="How often" testId="maint-new-every" value={every} onValueChange={setEvery} options={EVERY_OPTIONS} />
          </Field>
          <div className="sm:pt-[1.85rem]">
            <button type="submit" className="btn btn-primary w-full sm:w-auto" data-testid="maint-add">Add task</button>
          </div>
        </form>
      </section>
    </div>
  );
}
