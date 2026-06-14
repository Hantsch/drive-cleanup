import type { ScanResult } from '@shared/types'
import { useScanStore } from '@renderer/store/scanStore'
import { Panel } from '@renderer/components/common/Panel'
import { formatBytes, formatPercent } from '@renderer/lib/format'
import { usageTone } from '@renderer/lib/usage'
import { UsageGauge } from './UsageGauge'
import { SummaryStats } from './SummaryStats'
import { CompositionBar } from './CompositionBar'

interface OverviewPanelProps {
  result: ScanResult
}

export function OverviewPanel({ result }: OverviewPanelProps) {
  const drives = useScanStore((state) => state.drives)
  const drive = drives.find(
    (candidate) => `${candidate.letter}\\`.toLowerCase() === result.root.toLowerCase()
  )

  const usedFraction =
    drive && drive.totalBytes > 0
      ? (drive.totalBytes - drive.freeBytes) / drive.totalBytes
      : null

  return (
    <Panel>
      <div className="flex flex-wrap items-center gap-7">
        {usedFraction !== null ? (
          <UsageGauge
            fraction={usedFraction}
            tone={usageTone(usedFraction)}
            label={formatPercent(usedFraction)}
            sub="full"
          />
        ) : (
          <UsageGauge
            fraction={1}
            tone="#bef264"
            label={formatBytes(result.totalSizeBytes)}
            sub="scanned"
          />
        )}
        <SummaryStats result={result} drive={drive} />
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <CompositionBar result={result} />
      </div>
    </Panel>
  )
}
