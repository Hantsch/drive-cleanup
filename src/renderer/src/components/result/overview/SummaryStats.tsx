import { CATEGORY_BY_ID } from '@shared/categories'
import type { DriveInfo, ScanResult } from '@shared/types'
import { formatBytes, formatCount, formatDuration } from '@renderer/lib/format'

interface SummaryStatsProps {
  result: ScanResult
  drive?: DriveInfo
}

interface Stat {
  label: string
  value: string
  sub?: string
  tone?: string
}

function buildStats(result: ScanResult, drive?: DriveInfo): Stat[] {
  const stats: Stat[] = []

  if (drive) {
    stats.push({ label: 'Used', value: formatBytes(drive.totalBytes - drive.freeBytes) })
    stats.push({ label: 'Free', value: formatBytes(drive.freeBytes) })
  } else {
    stats.push({ label: 'Scanned', value: formatBytes(result.totalSizeBytes) })
  }

  stats.push({ label: 'Files', value: formatCount(result.totalFiles) })
  stats.push({ label: 'Folders', value: formatCount(result.totalDirs) })

  const top = result.categories[0]
  if (top) {
    const def = CATEGORY_BY_ID[top.id]
    stats.push({ label: 'Largest', value: def.label, sub: formatBytes(top.sizeBytes), tone: def.color })
  }

  stats.push({ label: 'Scan time', value: formatDuration(result.finishedAt - result.startedAt) })
  return stats
}

export function SummaryStats({ result, drive }: SummaryStatsProps) {
  return (
    <div className="flex flex-1 flex-wrap gap-x-9 gap-y-4">
      {buildStats(result, drive).map((stat) => (
        <div key={stat.label}>
          <div className="text-[11.5px] text-muted">{stat.label}</div>
          <div
            className="mt-1 text-xl font-semibold tabular-nums"
            style={stat.tone ? { color: stat.tone } : undefined}
          >
            {stat.value}
          </div>
          {stat.sub && <div className="text-[11px] text-muted">{stat.sub}</div>}
        </div>
      ))}
    </div>
  )
}
