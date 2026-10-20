/** Radar ring with a sweeping hand: "72" hours, always watching. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-2xl font-semibold tracking-tight ${className}`}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <circle cx="16" cy="16" r="13.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="16" cy="16" r="7" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.45" />
        <g style={{ transformOrigin: "16px 16px", animation: "sweep 6s linear infinite" }}>
          <path d="M16 16 L16 3.5 A12.5 12.5 0 0 1 26.8 9.8 Z" fill="var(--signal-deep)" opacity="0.9" />
          <line x1="16" y1="16" x2="16" y2="2.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <circle cx="16" cy="16" r="2.4" fill="currentColor" />
      </svg>
      <span>
        Ready<span className="italic text-signal-deep">72</span>
      </span>
    </span>
  );
}
