"use client";

import { Check, Copy, Printer } from "lucide-react";
import { addPurchase } from "@/lib/actions";
import { shoppingList, type ShoppingLine } from "@/lib/engine";
import { CATEGORY_LABEL } from "@/lib/requirements";
import { commit, useApp } from "@/lib/store";
import { PageTitle, toast } from "./ui";

function Line({ l }: { l: ShoppingLine }) {
  const rice = l.req.kind === "food" ? Math.ceil(l.missing / 3600) : 0;
  const beans = l.req.kind === "food" ? Math.ceil(l.missing / 340) : 0;
  return (
    <li className="row-hover flex flex-wrap items-center gap-x-4 gap-y-2 py-4" data-testid={`shop-${l.req.id}`}>
      <div className="min-w-0 flex-1 basis-64">
        <p className="text-lg font-semibold" data-testid={`shop-text-${l.req.id}`}>{l.text}</p>
        <p className="text-sm text-ink-soft">
          {CATEGORY_LABEL[l.req.category]}
          {l.req.kind === "food" && ` · or about ${beans} cans of beans, or ${rice} kg of rice`}
        </p>
      </div>
      <button
        type="button"
        className="btn btn-sm"
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
        <div className="stamp mt-12 max-w-xl rounded border-2 border-ok bg-ok-soft p-6" data-testid="shop-empty">
          <p className="font-display text-3xl font-bold text-ok">Fully stocked.</p>
          <p className="mt-2 text-lg">Your kit covers every item for {state.profile!.days} days. Check the expiry dates now and then.</p>
        </div>
      ) : (
        <>
          <div className="no-print mt-6 flex flex-wrap items-center gap-3">
            <p className="mr-2 font-mono text-sm" data-testid="shop-count">{lines.length} items to get</p>
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
            <section className="mt-10" aria-labelledby="ess-h">
              <h2 id="ess-h" className="text-3xl">Essentials</h2>
              <p className="mt-1 text-ink-soft">The gaps that matter most in the first 72 hours.</p>
              <ul className="mt-4 divide-y divide-rule border-y-2 border-ink" data-testid="shop-essentials">
                {essentials.map((l) => <Line key={l.req.id} l={l} />)}
              </ul>
            </section>
          )}
          {rest.length > 0 && (
            <section className="mt-12" aria-labelledby="rest-h">
              <h2 id="rest-h" className="text-3xl">Everything else</h2>
              <ul className="mt-4 divide-y divide-rule border-y-2 border-ink" data-testid="shop-rest">
                {rest.map((l) => <Line key={l.req.id} l={l} />)}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
