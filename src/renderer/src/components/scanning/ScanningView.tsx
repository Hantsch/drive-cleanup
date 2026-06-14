import { useScanStore } from '@renderer/store/scanStore'
import { Button } from '@renderer/components/common/Button'
import { formatBytes, formatCount, formatDuration, formatPercent } from '@renderer/lib/format'

function LiveStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11.5px] uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  )
}

/** Estimates remaining time from elapsed time and how far along we are. */
function estimateRemaining(fraction: number, startedAt: number | null): string | null {
  if (!startedAt || fraction < 0.02) return null
  const elapsed = Date.now() - startedAt
  const remaining = (elapsed * (1 - fraction)) / fraction
  return formatDuration(remaining)
}

export function ScanningView() {
  const root = useScanStore((state) => state.root)
  const progress = useScanStore((state) => state.progress)
  const total = useScanStore((state) => state.scanTotalBytes)
  const startedAt = useScanStore((state) => state.scanStartedAt)
  const cancelScan = useScanStore((state) => state.cancelScan)

  const bytes = progress?.bytesScanned ?? 0
  const fraction = total && total > 0 ? Math.min(0.999, bytes / total) : null
  const eta = fraction !== null ? estimateRemaining(fraction, startedAt) : null

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center px-8 py-20 text-center">
      <div className="scan-orb" />

      <p className="mt-10 font-mono text-xs uppercase tracking-[0.3em] text-accent">Scanning</p>
      <h2 className="mt-3 max-w-full truncate font-mono text-2xl font-semibold">{root}</h2>

      {fraction !== null ? (
        <div className="mt-8 w-full">
          <div className="mb-2 flex items-baseline justify-between font-mono text-sm tabular-nums">
            <span className="text-lg font-semibold text-accent">{formatPercent(fraction)}</span>
            <span className="text-muted">
              {formatBytes(bytes)} of {formatBytes(total as number)}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-panel ring-1 ring-inset ring-white/5">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
              style={{ width: `${fraction * 100}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-muted">
            {eta ? `about ${eta} remaining` : 'estimating time…'}
          </div>
        </div>
      ) : (
        <p className="mt-8 font-mono text-sm text-muted">{formatBytes(bytes)} scanned so far</p>
      )}

      <div className="mt-10 grid grid-cols-3 gap-10">
        <LiveStat label="Files" value={formatCount(progress?.filesScanned ?? 0)} />
        <LiveStat label="Folders" value={formatCount(progress?.dirsScanned ?? 0)} />
        <LiveStat label="Size" value={formatBytes(bytes)} />
      </div>

      <p className="mt-8 w-full truncate font-mono text-xs text-faint">
        {progress?.currentPath ?? 'Starting…'}
      </p>

      <Button onClick={cancelScan} className="mt-10">
        Cancel
      </Button>
    </div>
  )
}
