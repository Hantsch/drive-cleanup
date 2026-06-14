import { CATEGORY_BY_ID } from '@shared/categories'
import type { ScanNode, ScanResult } from '@shared/types'
import { useScanStore } from '@renderer/store/scanStore'
import { Panel } from '@renderer/components/common/Panel'
import { bySizeDesc, filesOfCategory, searchNodes } from '@renderer/lib/tree'
import { FolderTree } from './FolderTree'
import { NodeRow } from './NodeRow'

const MAX_FLAT_ROWS = 200

type Mode = 'tree' | 'search' | 'category'

export function DrillDownPanel({ result }: { result: ScanResult }) {
  const filter = useScanStore((state) => state.filter)
  const selectedCategory = useScanStore((state) => state.selectedCategory)
  const toggleCategory = useScanStore((state) => state.toggleCategory)

  const total = result.totalSizeBytes || 1
  const query = filter.trim().toLowerCase()

  let mode: Mode = 'tree'
  let flat: ScanNode[] = []

  if (selectedCategory) {
    mode = 'category'
    flat = filesOfCategory(result.tree, selectedCategory)
      .filter((node) => query === '' || node.path.toLowerCase().includes(query))
      .sort(bySizeDesc)
  } else if (query !== '') {
    mode = 'search'
    flat = searchNodes(result.tree, filter).sort(bySizeDesc)
  }

  const shown = flat.slice(0, MAX_FLAT_ROWS)
  const truncated = flat.length > shown.length

  const subtitle =
    mode === 'tree'
      ? 'Click a folder to expand it'
      : `${shown.length} match${shown.length === 1 ? '' : 'es'}${truncated ? ` (showing top ${MAX_FLAT_ROWS})` : ''}`

  return (
    <Panel>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">🗂️ Drill-down · Largest items</h2>
          <p className="mt-0.5 text-[11.5px] text-muted">{subtitle}</p>
        </div>
        {selectedCategory && (
          <button
            onClick={() => toggleCategory(selectedCategory)}
            className="inline-flex cursor-default items-center gap-2 rounded-full border border-line bg-panel-2 py-1 pl-3 pr-1.5 text-[11.5px]"
          >
            {CATEGORY_BY_ID[selectedCategory].label}
            <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-panel-3 text-[11px]">
              ✕
            </span>
          </button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-[1fr_120px_96px] gap-3 border-b border-line px-2.5 pb-2 text-[10.5px] uppercase tracking-wider text-muted">
        <span>Name / Path</span>
        <span className="text-right">Share</span>
        <span className="text-right">Size</span>
      </div>

      <div className="mt-1.5">
        {mode === 'tree' ? (
          <FolderTree root={result.tree} totalBytes={total} />
        ) : (
          shown.map((node) => (
            <NodeRow key={node.path} node={node} totalBytes={total} showDir />
          ))
        )}

        {mode !== 'tree' && shown.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">Nothing matches this filter.</p>
        )}
      </div>
    </Panel>
  )
}
