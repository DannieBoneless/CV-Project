/** 3D-styled CrestVest logo — shield merged with a rising bar chart. */
export function Logo({ size = 36, withWord = true }: { size?: number; withWord?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="cv-shield" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.55 0.2 260)" />
            <stop offset="55%" stopColor="oklch(0.62 0.18 220)" />
            <stop offset="100%" stopColor="oklch(0.72 0.17 165)" />
          </linearGradient>
          <linearGradient id="cv-metal" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
          </linearGradient>
          <filter id="cv-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.3" />
          </filter>
        </defs>
        <g filter="url(#cv-shadow)">
          <path
            d="M32 4 L58 14 V32 C58 46 46 56 32 60 C18 56 6 46 6 32 V14 Z"
            fill="url(#cv-shield)"
          />
          <path
            d="M32 4 L58 14 V32 C58 40 54 46 48 50 L32 4 Z"
            fill="url(#cv-metal)"
            opacity="0.35"
          />
          <rect x="18" y="34" width="6" height="14" rx="1.5" fill="white" opacity="0.95" />
          <rect x="28" y="26" width="6" height="22" rx="1.5" fill="white" opacity="0.95" />
          <rect x="38" y="18" width="6" height="30" rx="1.5" fill="white" opacity="0.95" />
          <path d="M17 32 L28 22 L36 28 L48 14" stroke="white" strokeWidth="2" fill="none" opacity="0.9" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="48" cy="14" r="2" fill="white" />
        </g>
      </svg>
      {withWord && (
        <span className="font-bold tracking-tight text-lg">
          Crest<span className="text-primary">Vest</span>
        </span>
      )}
    </div>
  );
}