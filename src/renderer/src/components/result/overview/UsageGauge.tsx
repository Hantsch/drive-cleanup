interface UsageGaugeProps {
  /** 0..1 — how much of the ring is filled. */
  fraction: number
  /** Ring colour. */
  tone: string
  /** Big centred label, e.g. "93%" or "412 GB". */
  label: string
  /** Small caption under the label. */
  sub: string
}

export function UsageGauge({ fraction, tone, label, sub }: UsageGaugeProps) {
  const pct = Math.round(Math.min(1, Math.max(0, fraction)) * 100)

  return (
    <div
      className="relative grid h-28 w-28 flex-none place-items-center rounded-full"
      style={{ background: `conic-gradient(${tone} ${pct}%, #232b3b 0)` }}
    >
      <div className="absolute h-[88px] w-[88px] rounded-full bg-[#11151f]" />
      <div className="relative text-center leading-tight">
        <div className="text-lg font-semibold tabular-nums">{label}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted">{sub}</div>
      </div>
    </div>
  )
}
