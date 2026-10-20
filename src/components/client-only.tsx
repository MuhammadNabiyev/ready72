"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Renders children only in the browser: everything here depends on localStorage and "today". */
export function ClientOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return mounted ? children : fallback;
}
