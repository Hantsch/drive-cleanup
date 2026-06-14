import { useScanStore } from '@renderer/store/scanStore'
import { TopBar } from './TopBar'
import { OverviewPanel } from './overview/OverviewPanel'
import { CategoryList } from './categories/CategoryList'
import { DrillDownPanel } from './drilldown/DrillDownPanel'

export function ResultView() {
  const result = useScanStore((state) => state.result)
  if (!result) return null

  return (
    <div className="mx-auto max-w-[1340px] px-6 py-5">
      <TopBar />

      <div className="animate-rise mt-4">
        <OverviewPanel result={result} />
      </div>

      <div
        className="animate-rise mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]"
        style={{ animationDelay: '80ms' }}
      >
        <CategoryList result={result} />
        <DrillDownPanel result={result} />
      </div>
    </div>
  )
}
