import type { DriveInfo } from '@shared/types'
import { formatBytes, formatPercent } from '@renderer/lib/format'
import { usageTone } from '@renderer/lib/usage'

interface DriveCardProps {
  drive: DriveInfo
  index: number
  onScan: () => void
}

export function DriveCard({ drive, index, onScan }: DriveCardProps) {
  const usedBytes = Math.max(0, drive.totalBytes - drive.freeBytes)
  const usedFraction = drive.totalBytes > 0 ? usedBytes / drive.totalBytes : 0
  const tone = usageTone(usedFraction)

  return (
    <button
      onClick={onScan}
      style={{ animationDelay: `${index * 60}ms` }}
      className="animate-rise group rounded-2xl border border-line bg-panel/80 p-5 text-left backdrop-blur-sm transition hover:border-[#39425a] hover:bg-panel-2"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-lg font-semibold">{drive.letter}\</span>
        <span className="text-xs text-muted">{formatPercent(usedFraction)} full</span>
      </div>
      <p className="mt-1 truncate text-sm text-muted">{drive.label}</p>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#0d1119] ring-1 ring-inset ring-white/5">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${usedFraction * 100}%`, background: tone }}
        />
      </div>

      <p className="mt-3 text-xs text-muted">
        <span className="font-medium text-ink">{formatBytes(usedBytes)}</span> used ·{' '}
        {formatBytes(drive.freeBytes)} free
      </p>

      <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition group-hover:opacity-100">
        Scan now →
      </span>
    </button>
  )
}
