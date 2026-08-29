export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`display font-extrabold tracking-tight ${className}`}>
      U<span className="text-signal">,</span>ME<span className="text-signal">,</span>NOW
    </span>
  )
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-warm-mute">
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-ink-line border-t-signal" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}

export function PulseMark({ size = 120 }: { size?: number }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <span className="absolute inline-block h-10 w-10 rounded-full border border-signal/60 animate-pulsering" />
      <span
        className="absolute inline-block h-10 w-10 rounded-full border border-signal/40 animate-pulsering"
        style={{ animationDelay: '0.8s' }}
      />
      <span
        className="absolute inline-block h-10 w-10 rounded-full border border-signal/30 animate-pulsering"
        style={{ animationDelay: '1.6s' }}
      />
      <span className="relative z-10 h-3.5 w-3.5 rounded-full bg-signal shadow-[0_0_20px_4px_rgba(255,92,56,0.6)]" />
    </div>
  )
}
