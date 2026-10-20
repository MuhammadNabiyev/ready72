"use client";

import { useMemo, useState } from "react";
import { Backpack, ChevronDown, Plus, Trash2 } from "lucide-react";
import { addEntry, removeEntry, updateEntry, validateEntry, type EntryErrors } from "@/lib/actions";
import { fmtAmount, progressFor, type Progress } from "@/lib/engine";
import { CATEGORY_LABEL, FOOD_PRESETS } from "@/lib/requirements";
import { commit, useApp } from "@/lib/store";
import { CATEGORY_ORDER, type Category, type Entry, type Requirement } from "@/lib/types";
import { DatePicker, fmtDate } from "./date-picker";
import { SupplyBar } from "./gauge";
import { CATEGORY_PICTOGRAM, PictoTile } from "./pictogram";
import { Field, Modal, PageTitle, SelectField, toast } from "./ui";

const qtyLabel = (r: Requirement) =>
  r.kind === "water" ? "Liters" : r.kind === "days" ? "Days of supply" : r.kind === "food" ? "How many units" : "Quantity";

export function KitView() {
  const state = useApp();
  const today = new Date();
  const list = useMemo(() => progressFor(state, today), [state]); // eslint-disable-line react-hooks/exhaustive-deps
  const [cat, setCat] = useState<Category | "all">("all");
  const [adding, setAdding] = useState<Requirement | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const cats = CATEGORY_ORDER.filter((c) => list.some((p) => p.req.category === c));
  const shown = list.filter((p) => cat === "all" || p.req.category === cat);
  const done = list.filter((p) => p.fraction >= 1).length;

  return (
    <div>
      <PageTitle title="My kit">
        Everything your household needs, worked out from who lives with you. Add what you already own and watch the gaps close.
      </PageTitle>
      <p className="mt-4 font-mono text-sm" data-testid="kit-summary">
        {done} of {list.length} items complete
      </p>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        <button type="button" className="chip" aria-pressed={cat === "all"} onClick={() => setCat("all")} data-testid="cat-all">
          All
        </button>
        {cats.map((c) => (
          <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(c)} data-testid={`cat-${c}`}>
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <ul className="mt-8 divide-y divide-rule border-y border-rule-strong" data-testid="kit-list">
        {shown.map((p, i) => (
          <Row
            key={p.req.id}
            p={p}
            index={i}
            entries={state.entries.filter((e) => e.reqId === p.req.id)}
            expanded={open === p.req.id}
            onToggle={() => setOpen(open === p.req.id ? null : p.req.id)}
            onAdd={() => setAdding(p.req)}
            today={today}
          />
        ))}
      </ul>

      {adding && <EntryDialog req={adding} onClose={() => setAdding(null)} />}
    </div>
  );
}

function Row({
  p,
  index,
  entries,
  expanded,
  onToggle,
  onAdd,
  today,
}: {
  p: Progress;
  index: number;
  entries: Entry[];
  expanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  today: Date;
}) {
  const { req } = p;
  const complete = p.fraction >= 1;
  const status = complete
    ? { text: "Complete", cls: "bg-ok-soft text-ok" }
    : p.have === 0
      ? { text: req.kind === "check" ? "Missing" : "None yet", cls: "bg-bad-soft text-bad" }
      : { text: `${Math.round(p.fraction * 100)}%`, cls: "bg-warn-soft text-warn" };

  return (
    <li className="rise py-5" style={{ ["--d" as string]: Math.min(index, 8) }} data-testid={`req-${req.id}`} data-complete={complete ? "true" : "false"}>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <PictoTile name={CATEGORY_PICTOGRAM[req.category]} className="size-12 rounded-xl" />
        <div className="min-w-0 flex-1 basis-64">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl">{req.label}</h2>
            {req.critical && <span className="mono-label rounded-sm border border-ink-soft px-1.5 py-px">Critical</span>}
            <span className={`rounded-sm px-2 py-0.5 text-sm font-bold ${status.cls}`} data-testid={`status-${req.id}`}>
              {status.text}
            </span>
          </div>
          {req.hint && <p className="mt-1 max-w-[62ch] text-ink-soft">{req.hint}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-sm" onClick={onAdd} data-testid={`add-${req.id}`} aria-label={`Add ${req.label}`}>
            <Plus className="size-4" aria-hidden />
            Add
          </button>
          <button
            type="button"
            className="btn btn-sm btn-quiet"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={`entries-${req.id}`}
            data-testid={`toggle-${req.id}`}
          >
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
            <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
        <div className="w-full sm:flex-1">
          <SupplyBar fraction={p.fraction} label={`${req.label}: ${Math.round(p.fraction * 100)}%`} />
        </div>
        <p className="tnum shrink-0 font-mono text-sm sm:w-60 sm:text-right" data-testid={`have-${req.id}`}>
          {req.kind === "check" ? (complete ? "Have" : "Missing") : `${fmtAmount(req, p.have)} / ${fmtAmount(req, req.need)}`}
        </p>
      </div>
      {p.expired > 0 && (
        <p className="mt-2 text-sm font-semibold text-bad" data-testid={`expired-${req.id}`}>
          {fmtAmount(req, p.expired)} expired and not counted
        </p>
      )}

      {expanded && (
        <ul id={`entries-${req.id}`} className="reveal mt-4 divide-y divide-rule rounded border border-rule bg-paper" data-testid={`entries-${req.id}`}>
          {entries.length === 0 && <li className="px-4 py-3 text-ink-soft">Nothing added yet.</li>}
          {entries.map((e) => {
            const expired = !!e.expiry && e.expiry < localKey(today);
            return (
              <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3" data-testid={`entry-${e.id}`}>
                <div className="min-w-0 flex-1 basis-48">
                  <p className="font-semibold">{e.name}</p>
                  <p className="text-sm text-ink-soft">
                    {req.kind === "check" ? "Have it" : req.kind === "food" ? `${e.qty} × ${e.kcalPerUnit?.toLocaleString("en-US")} kcal` : `${e.qty} ${req.unit}`}
                    {e.expiry && (
                      <span className={expired ? "font-semibold text-bad" : ""}> · {expired ? "expired" : "expires"} {fmtDate(e.expiry)}</span>
                    )}
                  </p>
                </div>
                {req.goBag && (
                  <button
                    type="button"
                    className="chip min-h-9 text-sm"
                    aria-pressed={e.goBag}
                    onClick={() => commit((s) => updateEntry(s, e.id, { goBag: !e.goBag }))}
                    data-testid={`gobag-${e.id}`}
                  >
                    <Backpack className="size-4" aria-hidden />
                    Go-bag
                  </button>
                )}
                <button
                  type="button"
                  className="grid size-10 place-items-center rounded text-bad hover:bg-bad-soft"
                  aria-label={`Delete ${e.name}`}
                  onClick={() => {
                    commit((s) => removeEntry(s, e.id));
                    toast(`Removed ${e.name}`);
                  }}
                  data-testid={`delete-${e.id}`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

const localKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function EntryDialog({ req, onClose }: { req: Requirement; onClose: () => void }) {
  const [preset, setPreset] = useState<string>("custom");
  const [name, setName] = useState(req.kind === "check" ? req.label : "");
  const [qty, setQty] = useState(req.kind === "check" ? "1" : "");
  const [kcal, setKcal] = useState("");
  const [expiry, setExpiry] = useState("");
  const [goBag, setGoBag] = useState(false);
  const [errors, setErrors] = useState<EntryErrors>({});

  const q = Number(qty);
  const k = Number(kcal);
  const preview =
    req.kind === "water" && q > 0
      ? `Adds ${q} L`
      : req.kind === "food" && q > 0 && k > 0
        ? `Adds ${(q * k).toLocaleString("en-US")} kcal`
        : null;

  function pickPreset(id: string) {
    setPreset(id);
    const p = FOOD_PRESETS.find((x) => x.id === id);
    if (p) {
      setName(p.name);
      setKcal(String(p.kcal));
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const draft: Omit<Entry, "id"> = {
      reqId: req.id,
      name,
      qty: req.kind === "check" ? 1 : q,
      kcalPerUnit: req.kind === "food" ? k : undefined,
      expiry: expiry || null,
      goBag,
    };
    const err = validateEntry(req, draft);
    setErrors(err);
    if (Object.keys(err).length) return;
    commit((s) => addEntry(s, draft));
    toast(`Added ${name.trim()}`);
    onClose();
  }

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={`Add: ${req.label}`} description={req.hint || "Record what you have so it counts toward your score."} testId="entry-dialog">
      <form onSubmit={submit} noValidate className="space-y-5">
        {req.kind === "food" && (
          <Field label="Pick a staple" htmlFor="preset">
            <SelectField
              label="Pick a staple"
              testId="preset"
              value={preset}
              onValueChange={pickPreset}
              options={[{ value: "custom", label: "Custom food" }, ...FOOD_PRESETS.map((p) => ({ value: p.id, label: `${p.name} · ${p.kcal.toLocaleString("en-US")} kcal` }))]}
            />
          </Field>
        )}
        <Field label="Name" htmlFor="entry-name" error={errors.name}>
          <input id="entry-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={req.kind === "water" ? "e.g. Bottled water, 6 x 1.5 L" : "e.g. Brand or description"} aria-invalid={!!errors.name} data-testid="entry-name" autoFocus />
        </Field>
        {req.kind !== "check" && (
          <div className={req.kind === "food" ? "grid gap-4 sm:grid-cols-2" : ""}>
            <Field label={qtyLabel(req)} htmlFor="entry-qty" error={errors.qty}>
              <input id="entry-qty" className="input tnum" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} aria-invalid={!!errors.qty} data-testid="entry-qty" />
            </Field>
            {req.kind === "food" && (
              <Field label="kcal per unit" htmlFor="entry-kcal" error={errors.kcalPerUnit}>
                <input id="entry-kcal" className="input tnum" inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} aria-invalid={!!errors.kcalPerUnit} data-testid="entry-kcal" />
              </Field>
            )}
          </div>
        )}
        {preview && (
          <p className="font-mono text-sm" data-testid="entry-preview">
            {preview}
          </p>
        )}
        <Field label="Expiry date (optional)" htmlFor="entry-expiry" error={errors.expiry}>
          <DatePicker value={expiry} onChange={setExpiry} label="Expiry date" testId="entry-expiry" placeholder="Does not expire" />
        </Field>
        {req.goBag && (
          <button type="button" className="chip" aria-pressed={goBag} onClick={() => setGoBag(!goBag)} data-testid="entry-gobag">
            <Backpack className="size-4" aria-hidden />
            This is in my go-bag
          </button>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" data-testid="entry-save">
            Add to kit
          </button>
        </div>
      </form>
    </Modal>
  );
}
