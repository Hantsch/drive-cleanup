import type { MouseEvent } from 'react'
import { CATEGORY_BY_ID } from '@shared/categories'
import type { ScanNode } from '@shared/types'
import { cn } from '@renderer/lib/cn'
import { formatBytes, formatPercent } from '@renderer/lib/format'
import { parentPath } from '@renderer/lib/tree'

interface NodeRowProps {
  node: ScanNode
  totalBytes: number
  depth?: number
  expandable?: boolean
  expanded?: boolean
  onToggle?: () => void
  /** Show the containing folder under the name (used in flat search results). */
  showDir?: boolean
}

export function NodeRow({
  node,
  totalBytes,
  depth = 0,
  expandable = false,
  expanded = false,
  onToggle,
  showDir = false
}: NodeRowProps) {
  const def = node.category ? CATEGORY_BY_ID[node.category] : null
  const fraction = totalBytes > 0 ? node.sizeBytes / totalBytes : 0
  const color = def?.color ?? '#64748b'
  const icon = node.type === 'dir' ? (expanded ? '📂' : '📁') : '📄'

  // Reveal the folder — never the file itself, to avoid launching executables.
  const reveal = (event: MouseEvent) => {
    event.stopPropagation()
    window.api.openPath(node.type === 'dir' ? node.path : parentPath(node.path))
  }

  return (
    <div
      role={expandable ? 'button' : undefined}
      onClick={expandable ? onToggle : undefined}
      style={{ paddingLeft: 10 + depth * 16 }}
      className="group grid grid-cols-[1fr_120px_96px] items-center gap-3 rounded-lg py-2 pr-2.5 transition hover:bg-panel-2"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            'w-3 flex-none text-[10px] text-muted transition',
            expandable ? 'opacity-100' : 'opacity-0',
            expanded && 'rotate-90'
          )}
        >
          ▸
        </span>
        <span className="flex-none">{icon}</span>
        <div className="min-w-0">
          <span className="block truncate font-mono text-[12.5px]">{node.name}</span>
          {showDir && (
            <span className="block truncate font-mono text-[11px] text-muted">
              {parentPath(node.path)}
            </span>
          )}
        </div>
        {def && node.type === 'file' && (
          <span className="ml-1 hidden items-center gap-1.5 rounded-full bg-panel-3 px-2 py-0.5 text-[10.5px] font-semibold sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-[2px]" style={{ background: def.color }} />
            {def.label}
          </span>
        )}
        <button
          onClick={reveal}
          title="Open containing folder"
          className="ml-1 hidden cursor-default rounded px-1.5 py-0.5 text-[11px] text-muted opacity-0 transition hover:text-ink group-hover:opacity-100 md:inline-block"
        >
          ⤤
        </button>
      </div>

      <div className="flex items-center justify-end gap-2">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#0d1119]">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, fraction * 100)}%`, background: color }}
          />
        </div>
        <span className="w-9 text-right font-mono text-[11px] tabular-nums text-muted">
          {formatPercent(fraction)}
        </span>
      </div>

      <span className="text-right font-mono text-[12.5px] font-bold tabular-nums">
        {formatBytes(node.sizeBytes)}
      </span>
    </div>
  )
}
