"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { enUS } from "react-day-picker/locale";
import { addYears, format, startOfDay, subYears } from "date-fns";
import { CalendarDays, ChevronDown, X } from "lucide-react";
import "react-day-picker/style.css";

export function fmtDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return format(new Date(y, m - 1, d), "d MMM yyyy");
}

/** Calendar popover. Value is a yyyy-MM-dd string or "". Weeks start on Monday. */
export function DatePicker({
  value,
  onChange,
  label,
  testId,
  placeholder = "No date",
  clearable = true,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  testId?: string;
  placeholder?: string;
  clearable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? (() => { const [y, m, d] = value.split("-").map(Number); return new Date(y, m - 1, d); })() : undefined;
  const today = startOfDay(new Date());

  return (
    <div className="flex items-stretch gap-2">
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          aria-label={`${label}: ${value ? fmtDate(value) : placeholder}`}
          data-testid={testId}
          className="select-trigger group flex-1 text-left"
        >
          <span className="flex items-center gap-2">
            <CalendarDays className="size-4 text-ink-soft" aria-hidden />
            <span className={value ? "tnum" : "text-ink-soft"}>{value ? fmtDate(value) : placeholder}</span>
          </span>
          <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={6}
            collisionPadding={12}
            className="z-[60] rounded-xl border border-rule-strong bg-paper p-3 shadow-[var(--shadow-soft)]"
            style={{ animation: "pop 160ms var(--ease-out)" }}
          >
            <DayPicker
              mode="single"
              locale={enUS}
              weekStartsOn={1}
              selected={selected}
              defaultMonth={selected ?? today}
              onSelect={(d) => {
                if (d) {
                  onChange(format(d, "yyyy-MM-dd"));
                  setOpen(false);
                }
              }}
              startMonth={subYears(today, 2)}
              endMonth={addYears(today, 10)}
              captionLayout="dropdown"
              autoFocus
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {clearable && value && (
        <button type="button" aria-label={`Clear ${label}`} onClick={() => onChange("")} className="grid size-11 place-items-center rounded-lg border border-transparent hover:border-ink">
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
