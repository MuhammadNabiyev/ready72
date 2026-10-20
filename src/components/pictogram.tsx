import type { Category } from "@/lib/types";

/**
 * Solid safety-sign pictograms on a 48 x 48 grid. Each one is a silhouette with negative-space
 * details (even-odd cut-outs), softened with a 2px round join so they read as drawn, not generated.
 */
const PATHS: Record<string, React.ReactNode> = {
  water: <path fillRule="evenodd" d="M24 4C24 4 10 20 10 30a14 14 0 0 0 28 0C38 20 24 4 24 4ZM17 29.5a3 3 0 1 0 0.01 0Z" />,
  food: <path fillRule="evenodd" d="M9 6h30v7H9ZM11 15h26v27H11ZM15 22h18v4H15ZM15 30h18v4H15Z" />,
  power: <path d="M28 3 10 27h11l-3 18 20-26H27Z" />,
  health: <path d="M18 5h12v13h13v12H30v13H18V30H5V18h13Z" />,
  meds: (
    <g transform="rotate(-45 24 24)">
      <path fillRule="evenodd" d="M15 14h18a10 10 0 0 1 0 20H15a10 10 0 0 1 0-20ZM23 14h2v20h-2Z" />
    </g>
  ),
  hygiene: <path fillRule="evenodd" d="M24 5a19 19 0 1 0 0.01 0ZM24 18a6 6 0 1 1-0.01 0Z M42 30h4v12H33Z" />,
  tools: <path fillRule="evenodd" d="M5 19h38v23H5ZM5 29h38v2.5H5ZM16 19v-7h16v7h-3.5v-3.5h-9V19Z" />,
  warmth: <path fillRule="evenodd" d="M24 3c2 9 14 14 14 27a14 14 0 0 1-28 0c0-7 3-10 7-14 0 5 2 7 4 8-2-8-1-14 3-21ZM24 33a4.5 4.5 0 0 0-4.5 4.5c0 2.5 2 4 4.5 4s4.5-1.5 4.5-4A4.5 4.5 0 0 0 24 33Z" />,
  docs: <path fillRule="evenodd" d="M11 3h19l9 9v33H11ZM17 25h14v3.5H17ZM17 32h14v3.5H17Z" />,
  pets: (
    <>
      <circle cx="12" cy="20" r="5" />
      <circle cx="21" cy="11.5" r="5" />
      <circle cx="31" cy="11.5" r="5" />
      <circle cx="40" cy="20" r="5" />
      <path d="M26 21c-7.5 0-13 6.5-13 12 0 4.2 3 6.5 6.5 6.5 2.7 0 4.4-1.3 6.5-1.3s3.8 1.3 6.5 1.3c3.5 0 6.5-2.3 6.5-6.5 0-5.500-5.500-12-13.500-12Z" transform="translate(-2 0)" />
    </>
  ),
  plan: <path fillRule="evenodd" d="M24 3a15 15 0 0 0-15 15c0 11 15 27 15 27s15-16 15-27A15 15 0 0 0 24 3ZM24 12.500a5.500 5.500 0 1 1-0.01 0Z" />,
  time: (
    <>
      <path fillRule="evenodd" d="M24 4a20 20 0 1 0 0.01 0ZM24 9a15 15 0 1 1-0.01 0Z" />
      <path d="M22 13h4v11l8 5-2 3.500-10-6.500Z" />
    </>
  ),
  warning: <path fillRule="evenodd" d="M24 4 46 42H2ZM22 17h4v13h-4ZM22 33h4v4.500h-4Z" />,
  bag: <path fillRule="evenodd" d="M12 21a12 12 0 0 1 24 0v22a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3ZM17 22h14v3.500H17ZM17 31h14v11H17Z" />,
  shield: <path fillRule="evenodd" d="M24 3 41 9.500V22c0 10.500-7.500 18.500-17 23C14.500 40.500 7 32.500 7 22V9.500ZM15.500 23l6 6 11-12.500-3.200-2.800-8 9.200-2.800-2.800Z" />,
  check: <path d="M6 25l6.500-6.500 7.500 7.500L36 9l6.500 6.500L20 40Z" />,
  cross: <path d="M10 15l5-5 9 9 9-9 5 5-9 9 9 9-5 5-9-9-9 9-5-5 9-9Z" />,
  info: <path fillRule="evenodd" d="M21 6h6v6h-6ZM17 18h10v18h4v6H17v-6h4V24h-4Z" />,
};

export type PictogramName = keyof typeof PATHS;

export function Pictogram({ name, className = "size-6" }: { name: PictogramName; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden focusable="false">
      {PATHS[name]}
    </svg>
  );
}

export const CATEGORY_PICTOGRAM: Record<Category | "plan", PictogramName> = {
  water: "water",
  food: "food",
  power: "power",
  health: "health",
  meds: "meds",
  hygiene: "hygiene",
  tools: "tools",
  warmth: "warmth",
  docs: "docs",
  pets: "pets",
  plan: "plan",
};

/** A black station-style tile with a white pictogram. */
export function PictoTile({ name, className = "" }: { name: PictogramName; className?: string }) {
  return (
    <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-ink text-canvas ${className}`}>
      <Pictogram name={name} className="size-6" />
    </span>
  );
}

/** ISO-style status shapes: green square = safe, yellow triangle = caution, red circle = stop, blue circle = info. */
export function StatusShape({ kind, className = "size-7", label }: { kind: "ok" | "warn" | "bad" | "info"; className?: string; label?: string }) {
  const common = { role: label ? "img" : undefined, "aria-label": label, "aria-hidden": label ? undefined : true } as const;
  if (kind === "ok")
    return (
      <span {...common} className={`grid shrink-0 place-items-center rounded-lg bg-green text-on-signal ${className}`}>
        <Pictogram name="check" className="size-[62%]" />
      </span>
    );
  if (kind === "warn")
    return (
      <span {...common} className={`grid shrink-0 place-items-center text-yellow ${className}`}>
        <svg viewBox="0 0 48 48" className="size-full" strokeLinejoin="round" aria-hidden>
          <path d="M24 5 45 41H3Z" fill="currentColor" stroke="oklch(0.25 0.03 170)" strokeWidth="4" />
          <path d="M22.200 17h3.600l-.7 13h-2.200ZM22 33h4v4h-4Z" fill="oklch(0.25 0.03 170)" />
        </svg>
      </span>
    );
  if (kind === "bad")
    return (
      <span {...common} className={`grid shrink-0 place-items-center rounded-full bg-red text-on-signal ${className}`}>
        <Pictogram name="cross" className="size-[58%]" />
      </span>
    );
  return (
    <span {...common} className={`grid shrink-0 place-items-center rounded-full bg-blue text-on-signal ${className}`}>
      <Pictogram name="info" className="size-[58%]" />
    </span>
  );
}
