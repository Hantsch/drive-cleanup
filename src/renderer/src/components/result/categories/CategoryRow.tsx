import type { CategoryDef } from '@shared/categories'
import type { CategorySummary } from '@shared/types'
import { cn } from '@renderer/lib/cn'
import { formatBytes, formatCount, formatPercent } from '@renderer/lib/format'

interface CategoryRowProps {
  def: CategoryDef
  summary: CategorySummary
  /** Share of the whole scan (for the percentage label). */
  shareOfTotal: number
  /** Width relative to the largest category (for the bar). */
  barFraction: number
  active: boolean
  onClick: () => void
}

export function CategoryRow({
  def,
  summary,
  shareOfTotal,
  barFraction,
  active,
  onClick
}: CategoryRowProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'grid w-full cursor-default grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 rounded-xl px-2 py-2.5 text-left transition',
        active ? 'bg-panel-2 ring-1 ring-inset ring-[#39425a]' : 'hover:bg-panel-2'
      )}
    >
      <span className="flex items-center gap-2.5 text-[13px] font-semibold">
        <span className="h-2.5 w-2.5 flex-none rounded-[3px]" style={{ background: def.color }} />
        <span>{def.icon}</span>
        {def.label}
      </span>
      <span className="font-mono text-[13px] font-bold tabular-nums">
        {formatBytes(summary.sizeBytes)}
      </span>

      <div className="col-span-2 h-2 overflow-hidden rounded-full bg-[#0d1119] ring-1 ring-inset ring-white/5">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(2, barFraction * 100)}%`,
            background: def.color,
            boxShadow: `0 0 12px -2px ${def.color}`
          }}
        />
      </div>

      <div className="col-span-2 flex justify-between font-mono text-[11px] tabular-nums text-muted">
        <span>{formatPercent(shareOfTotal)}</span>
        <span>{formatCount(summary.fileCount)} files</span>
      </div>
    </button>
  )
}
