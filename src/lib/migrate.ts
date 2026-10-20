import { EMPTY_STATE, type State } from "./types";

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Turn whatever was saved (an older version, a hand-edited backup) into a complete State.
 * Fields added after the first release fall back to their empty defaults, and a field of
 * the wrong shape is replaced by its default instead of crashing a screen.
 */
export function mergeState(raw: unknown): State {
  const data = isObj(raw) ? raw : {};
  const merged = { ...EMPTY_STATE, ...data } as State;
  if (!Array.isArray(merged.members)) merged.members = [];
  if (!Array.isArray(merged.drillRuns)) merged.drillRuns = [];
  const m = merged.maintenance as unknown;
  merged.maintenance = isObj(m)
    ? { done: isObj(m.done) ? (m.done as Record<string, string>) : {}, custom: Array.isArray(m.custom) ? (m.custom as State["maintenance"]["custom"]) : [] }
    : { done: {}, custom: [] };
  return merged;
}
