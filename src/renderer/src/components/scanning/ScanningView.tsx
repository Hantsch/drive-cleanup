import { useScanStore } from '@renderer/store/scanStore'
import { Button } from '@renderer/components/common/Button'
import { formatBytes, formatCount } from '@renderer/lib/format'

function LiveStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11.5px] uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  )
}

export function ScanningView() {
  const root = useScanStore((state) => state.root)
  const progress = useScanStore((state) => state.progress)
  const cancelScan = useScanStore((state) => state.cancelScan)

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center px-8 py-20 text-center">
      <div className="scan-orb" />

      <p className="mt-10 font-mono text-xs uppercase tracking-[0.3em] text-accent">Scanning</p>
      <h2 className="mt-3 max-w-full truncate font-mono text-2xl font-semibold">{root}</h2>

      <div className="mt-10 grid grid-cols-3 gap-10">
        <LiveStat label="Files" value={formatCount(progress?.filesScanned ?? 0)} />
        <LiveStat label="Folders" value={formatCount(progress?.dirsScanned ?? 0)} />
        <LiveStat label="Size" value={formatBytes(progress?.bytesScanned ?? 0)} />
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
