"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, Minus, Plus, X } from "lucide-react";
import { useSyncExternalStore } from "react";
import { PictoTile, StatusShape, type PictogramName } from "./pictogram";

/* ---------------- Modal ---------------- */

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  testId,
  wide,
  icon,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
  testId?: string;
  wide?: boolean;
  icon?: PictogramName;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="modal" data-testid={testId} data-wide={wide ? "true" : "false"}>
          <div className="flex items-start gap-4">
            {icon && <PictoTile name={icon} className="size-12 rounded-xl" />}
            <div className="min-w-0 flex-1">
              <Dialog.Title className="font-display text-2xl font-bold">
                {title}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-ink-soft">{description}</Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close"
              className="-mr-2 -mt-1 grid size-11 shrink-0 place-items-center rounded-lg transition-colors hover:bg-canvas-2"
            >
              <X className="size-5" aria-hidden />
            </Dialog.Close>
          </div>
          <div className="mt-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ---------------- Select ---------------- */

export function SelectField({
  value,
  onValueChange,
  options,
  label,
  testId,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
  testId?: string;
}) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger className="select-trigger" aria-label={label} data-testid={testId}>
        <Select.Value />
        <Select.Icon>
          <ChevronDown className="size-4" aria-hidden />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="select-content" position="popper" sideOffset={6} collisionPadding={12}>
          <Select.Viewport>
            {options.map((o) => (
              <Select.Item key={o.value} value={o.value} className="select-item" data-testid={testId ? `${testId}-${o.value}` : undefined}>
                <Select.ItemText>{o.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <Check className="size-4" aria-hidden />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

/* ---------------- Stepper ---------------- */

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 10,
  label,
  testId,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label: string;
  testId?: string;
}) {
  return (
    <div className="inline-flex items-center border border-rule-strong rounded-xl bg-paper" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        data-testid={testId ? `${testId}-dec` : undefined}
        className="grid size-11 place-items-center transition-colors hover:bg-canvas-2 disabled:opacity-35"
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <output className="tnum w-10 text-center font-display text-xl font-bold" aria-live="polite" data-testid={testId ? `${testId}-value` : undefined}>
        {value}
      </output>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        data-testid={testId ? `${testId}-inc` : undefined}
        className="grid size-11 place-items-center transition-colors hover:bg-canvas-2 disabled:opacity-35"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}

/* ---------------- Toasts ---------------- */

type Toast = { id: number; text: string };
const NO_TOASTS: Toast[] = [];
let toasts: Toast[] = NO_TOASTS;
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(text: string) {
  const t = { id: nextId++, text };
  toasts = [...toasts.slice(-2), t];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    emit();
  }, 3200);
}

const subscribeToasts = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function Toaster() {
  const list = useSyncExternalStore(subscribeToasts, () => toasts, () => NO_TOASTS);
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed bottom-24 left-1/2 z-[70] flex -translate-x-1/2 flex-col items-center gap-2 xl:bottom-8">
      {list.map((t) => (
        <div
          key={t.id}
          data-testid="toast"
          className="pointer-events-auto flex items-center gap-3 rounded-xl bg-ink py-2.5 pr-5 pl-3 font-semibold text-canvas shadow-[0_14px_34px_-14px_oklch(0.2_0.03_170/0.7)]"
          style={{ animation: "toast-in 260ms var(--ease-out) both" }}
        >
          <StatusShape kind="ok" className="size-6" />
          {t.text}
        </div>
      ))}
    </div>
  );
}

/* ---------------- small pieces ---------------- */

export function Field({
  label,
  error,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="field-label">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
      {error && (
        <p className="field-error" role="alert" id={`${htmlFor}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

/** A small round separator for inline metadata, drawn rather than typed so it never hugs the next word. */
export function Sep() {
  return <span aria-hidden className="mx-2 inline-block size-[0.3em] -translate-y-[0.1em] rounded-full bg-current opacity-60" />;
}

/** A section heading with a pictogram tile, the way a sign names a room. */
export function SectionHead({ icon, title, id, children }: { icon: PictogramName; title: string; id: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <PictoTile name={icon} className="mt-0.5 size-12 rounded-xl" />
      <div className="min-w-0">
        <h2 id={id} className="text-3xl">{title}</h2>
        {children && <p className="mt-1.5 max-w-[52ch] text-ink-soft">{children}</p>}
      </div>
    </div>
  );
}

export function PageTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rise">
      <h1 className="text-[clamp(2.25rem,6vw,3.75rem)]">{title}</h1>
      {children && <p className="mt-3 max-w-[60ch] text-lg text-ink-soft">{children}</p>}
    </div>
  );
}
