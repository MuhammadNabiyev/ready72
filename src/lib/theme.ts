"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "night";

const KEY = "ready72.theme";
const EVENT = "ready72:theme";

export function getTheme(): Theme {
  try {
    return window.localStorage.getItem(KEY) === "night" ? "night" : "light";
  } catch {
    return "light";
  }
}

export function setTheme(t: Theme) {
  try {
    window.localStorage.setItem(KEY, t);
  } catch {
    /* private mode: the choice just lasts until reload */
  }
  if (t === "night") document.documentElement.dataset.theme = "night";
  else document.documentElement.removeAttribute("data-theme");
  window.dispatchEvent(new Event(EVENT));
}

export const toggleTheme = () => setTheme(getTheme() === "night" ? "light" : "night");

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
};

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => "light" as Theme);
}

/** Runs before first paint so night mode does not flash white. */
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("${KEY}")==="night")document.documentElement.dataset.theme="night"}catch(e){}`;
