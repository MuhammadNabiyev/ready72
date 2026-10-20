import { Pictogram } from "./pictogram";

/** A green sign tile with a shield: you are covered. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-2xl font-black tracking-[-0.03em] ${className}`}>
      <span className="grid size-8 place-items-center rounded-lg bg-green text-on-signal shadow-[inset_0_-3px_0_oklch(0_0_0/0.2)]">
        <Pictogram name="shield" className="size-5" />
      </span>
      <span>
        Ready<span className="text-yellow">72</span>
      </span>
    </span>
  );
}
