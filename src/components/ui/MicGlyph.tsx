/** A real microphone, not an abstract disc. */
export function MicGlyph({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className} aria-hidden>
      <rect x="14" y="5" width="12" height="20" rx="6" fill="currentColor" />
      <path d="M9 19c0 6.075 4.925 11 11 11s11-4.925 11-11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M20 30v5M14 35h12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
