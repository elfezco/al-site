export function GoldSpinner({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      className="animate-spin"
      role="status"
      aria-label="Carregando"
    >
      <defs>
        <linearGradient id="goldSpin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FADB5F" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
      </defs>
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="url(#goldSpin)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="90 40"
      />
    </svg>
  );
}

export function LoadingBlock({ label = "Carregando dados…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <GoldSpinner size={40} />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
