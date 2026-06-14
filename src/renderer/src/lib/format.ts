const decimal = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const integer = new Intl.NumberFormat('en-US')

const BYTE_UNITS = ['KB', 'MB', 'GB', 'TB', 'PB'] as const

/** Human-readable binary size, e.g. 412 GB. */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`

  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${decimal.format(value)} ${BYTE_UNITS[unit]}`
}

export function formatCount(value: number): string {
  return integer.format(value)
}

/** Fraction (0..1) as a rounded percentage, with small values clamped to <1%. */
export function formatPercent(fraction: number): string {
  if (!Number.isFinite(fraction) || fraction <= 0) return '0%'
  if (fraction < 0.01) return '<1%'
  return `${Math.round(fraction * 100)}%`
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}
