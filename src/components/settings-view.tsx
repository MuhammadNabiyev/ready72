"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Download, RotateCcw, Trash2, Upload } from "lucide-react";
import { setProfile } from "@/lib/actions";
import { mergeState } from "@/lib/migrate";
import { commit, loadSample, resetAll, setState, useApp } from "@/lib/store";
import type { State } from "@/lib/types";
import { HouseholdForm } from "./household-form";
import { Modal, PageTitle, toast } from "./ui";

export function SettingsView() {
  const state = useApp();
  const [confirm, setConfirm] = useState<"reset" | "sample" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ready72-backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Backup downloaded");
  }

  async function importJson(file: File) {
    try {
      const data = JSON.parse(await file.text()) as Partial<State>;
      if (!data || typeof data !== "object" || !("profile" in data) || !Array.isArray(data.entries)) throw new Error("shape");
      setState(mergeState(data));
      toast("Backup restored");
    } catch {
      toast("That file is not a Ready72 backup");
    }
  }

  return (
    <div>
      <PageTitle title="Settings">Change your household and manage your data. Everything lives in this browser.</PageTitle>

      <section className="mt-12" aria-labelledby="hh-h">
        <h2 id="hh-h" className="mb-6 text-3xl">Household</h2>
        {state.profile ? (
          <HouseholdForm
            key={JSON.stringify(state.profile)}
            initial={state.profile}
            submitLabel="Save changes"
            onSubmit={(p) => {
              commit((s) => setProfile(s, p));
              toast("Household updated. Your targets were recalculated");
            }}
          />
        ) : (
          <div data-testid="settings-no-household">
            <p className="max-w-[56ch] text-lg text-ink-soft">
              No household yet. Build a plan, load the sample, or restore a backup below.
            </p>
            <Link href="/setup" className="btn btn-primary mt-4" data-testid="settings-build">
              Build my plan
            </Link>
          </div>
        )}
      </section>

      <section className="mt-20 border-t border-rule-strong pt-10" aria-labelledby="data-h">
        <h2 id="data-h" className="text-3xl">Your data</h2>
        <p className="mt-2 max-w-[60ch] text-ink-soft">
          Ready72 stores everything in this browser only. There is no account and no server copy, so back up before you clear your browser data.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn" onClick={exportJson} data-testid="export-json">
            <Download className="size-4" aria-hidden />
            Download backup
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()} data-testid="import-json">
            <Upload className="size-4" aria-hidden />
            Restore backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Backup file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importJson(f);
              e.target.value = "";
            }}
          />
          <button type="button" className="btn" onClick={() => setConfirm("sample")} data-testid="load-sample-settings">
            <RotateCcw className="size-4" aria-hidden />
            Load the sample household
          </button>
          <button type="button" className="btn btn-danger" onClick={() => setConfirm("reset")} data-testid="reset-all">
            <Trash2 className="size-4" aria-hidden />
            Erase everything
          </button>
        </div>
      </section>

      {confirm && (
        <Modal
          open
          onOpenChange={(o) => !o && setConfirm(null)}
          title={confirm === "reset" ? "Erase everything?" : "Replace your data with the sample?"}
          description={confirm === "reset" ? "Your household, kit, contacts, meeting points and drills will be deleted from this browser." : "Your current data will be replaced by a half-prepared sample family."}
          testId="confirm-dialog"
        >
          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-quiet" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              type="button"
              className={`btn ${confirm === "reset" ? "btn-danger" : "btn-primary"}`}
              data-testid="confirm-yes"
              onClick={() => {
                if (confirm === "reset") resetAll();
                else loadSample();
                setConfirm(null);
                toast(confirm === "reset" ? "Everything erased" : "Sample household loaded");
              }}
            >
              {confirm === "reset" ? "Erase everything" : "Load sample"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
