"use client";

import { Check, Copy, Printer } from "lucide-react";
import { addPurchase } from "@/lib/actions";
import { shoppingList, type ShoppingLine } from "@/lib/engine";
import { CATEGORY_LABEL } from "@/lib/requirements";
import { commit, useApp } from "@/lib/store";
import { CATEGORY_PICTOGRAM, PictoTile, StatusShape } from "./pictogram";
import { PageTitle, Sep, toast } from "./ui";

function Line({ l, major }: { l: ShoppingLine; major?: boolean }) {
  const rice = l.req.kind === "food" ? Math.ceil(l.missing / 3600) : 0;
  const beans = l.req.kind === "food" ? Math.ceil(l.missing / 340) : 0;
  return (
    <li className={`row-hover flex flex-wrap items-center gap-x-4 gap-y-2 ${major ? "py-4" : "py-3"}`} data-testid={`shop-${l.req.id}`}>
      <span className="print-check" aria-hidden />
      <PictoTile name={CATEGORY_PICTOGRAM[l.req.category]} tone={major ? "yellow" : "ink"} className={`${major ? "size-12 rounded-xl" : "size-9 rounded-lg"}`} />
      <div className="min-w-0 flex-1 basis-64">
        <p className={`${major ? "text-lg" : ""} font-semibold`} data-testid={`shop-text-${l.req.id}`}>{l.text}</p>
        <p className="text-sm text-ink-soft">
          {CATEGORY_LABEL[l.req.category]}
          {l.req.kind === "food" && <><Sep />{`or about ${beans} cans of beans, or ${rice} kg of rice`}</>}
        </p>
      </div>
      <button
        type="button"
        className="btn btn-sm no-print"
        onClick={() => {
          commit((s) => addPurchase(s, l.req.id, l.missing));
          toast(`Marked as bought: ${l.req.label}`);
        }}
        data-testid={`bought-${l.req.id}`}
        aria-label={`Mark bought: ${l.req.label}`}
      >
        <Check className="size-4" aria-hidden />
        Mark bought
      </button>
    </li>
  );
}

export function ShoppingView() {
  const state = useApp();
  const lines = shoppingList(state, new Date());
  const essentials = lines.filter((l) => l.req.critical);
  const rest = lines.filter((l) => !l.req.critical);

  async function copy() {
    const text = lines.map((l) => `[ ] ${l.text}`).join("\n");
    try {
      await navigator.clipboard.writeText(`Ready72 shopping list\n\n${text}`);
      toast("List copied");
    } catch {
      toast("Copy is blocked in this browser");
    }
  }

  return (
    <div>
      <PageTitle title="Shopping list">
        Only what is missing from your kit. Mark things as bought and they move into My kit automatically.
      </PageTitle>

      {lines.length === 0 ? (
        <div className="stamp mt-12 max-w-xl rounded-xl border border-ok bg-ok-soft p-6" data-testid="shop-empty">
          <p className="font-display text-3xl font-bold text-ok">Fully stocked.</p>
          <p className="mt-2 text-lg">Your kit covers every item for {state.profile!.days} days. Check the expiry dates now and then.</p>
        </div>
      ) : (
        <>
          <div className="no-print mt-6 flex flex-wrap items-center gap-3">
            <p className="mr-2 inline-flex items-center gap-2 rounded-md bg-[var(--tag)] px-2.5 py-1 text-sm font-extrabold text-[oklch(0.25_0.03_170)] tnum" data-testid="shop-count">{lines.length} items to get</p>
            <button type="button" className="btn btn-sm" onClick={copy} data-testid="copy-list">
              <Copy className="size-4" aria-hidden />
              Copy list
            </button>
            <button type="button" className="btn btn-sm" onClick={() => window.print()} data-testid="print-list">
              <Printer className="size-4" aria-hidden />
              Print
            </button>
          </div>

          {essentials.length > 0 && (
            <section className="panel mt-10 overflow-hidden border-t-[6px] border-t-yellow px-5 pt-6 pb-2 sm:px-8" aria-labelledby="ess-h">
              <h2 id="ess-h" className="flex items-center gap-3 text-3xl"><StatusShape kind="warn" className="size-8" />Essentials</h2>
              <p className="mt-1 text-ink-soft">The gaps that matter most in the first 72 hours.</p>
              <ul className="mt-3 divide-y divide-rule" data-testid="shop-essentials">
                {essentials.map((l) => <Line key={l.req.id} l={l} major />)}
              </ul>
            </section>
          )}
          {rest.length > 0 && (
            <section className="mt-12" aria-labelledby="rest-h">
              <h2 id="rest-h" className="kicker">Everything else</h2>
              <ul className="mt-2 divide-y divide-rule border-b border-rule-strong" data-testid="shop-rest">
                {rest.map((l) => <Line key={l.req.id} l={l} />)}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
