"use client";

import { useSyncExternalStore } from "react";
import { sampleState } from "./sample";
import { EMPTY_STATE, type State } from "./types";

const KEY = "ready72.state.v1";
const EVENT = "ready72:change";

let cacheRaw: string | null = null;
let cacheValue: State = EMPTY_STATE;

function read(): State {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === null) return cacheRaw === null ? cacheValue : EMPTY_STATE;
    if (raw !== cacheRaw) {
      cacheRaw = raw;
      cacheValue = { ...EMPTY_STATE, ...(JSON.parse(raw) as Partial<State>) };
    }
    return cacheValue;
  } catch {
    return cacheValue; // storage blocked or corrupt: keep working in memory
  }
}

export function getState(): State {
  return read();
}

export function setState(next: State) {
  cacheValue = next;
  try {
    cacheRaw = JSON.stringify(next);
    window.localStorage.setItem(KEY, cacheRaw);
  } catch {
    cacheRaw = null;
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Apply a pure transition to the saved state. */
export function commit(fn: (s: State) => State) {
  setState(fn(read()));
}

export const loadSample = () => setState(sampleState(new Date()));
export const resetAll = () => setState(EMPTY_STATE);

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** The saved state, always an object on the client. Render it only inside <ClientOnly>. */
export function useApp(): State {
  return useSyncExternalStore(subscribe, read, () => EMPTY_STATE);
}
