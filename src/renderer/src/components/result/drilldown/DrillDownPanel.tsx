import { CATEGORY_BY_ID, GAMING_CATEGORY_IDS } from '@shared/categories'
import type { InstalledGame, ScanNode, ScanResult } from '@shared/types'
import { useScanStore } from '@renderer/store/scanStore'
import { Panel } from '@renderer/components/common/Panel'
import { bySizeDesc, categoryFolders, searchNodes } from '@renderer/lib/tree'
import { FolderTree } from './FolderTree'
import { NodeRow } from './NodeRow'

const MAX_FLAT_ROWS = 200

type Mode = 'tree' | 'games' | 'search' | 'category'

/** Presents an installed game as a directory row. */
function gameToNode(game: InstalledGame): ScanNode {
  return {
    name: game.name,
    path: game.path,
    type: 'dir',
    sizeBytes: game.sizeBytes,
    fileCount: game.fileCount,
    category: game.category
  }
}

export function DrillDownPanel({ result }: { result: ScanResult }) {
  const filter = useScanStore((state) => state.filter)
  const selectedCategory = useScanStore((state) => state.selectedCategory)
  const toggleCategory = useScanStore((state) => state.toggleCategory)

  const total = result.totalSizeBytes || 1
  const query = filter.trim().toLowerCase()

  // Installed games for the selected gaming platform (folder-level view).
  const games =
    selectedCategory && GAMING_CATEGORY_IDS.has(selectedCategory)
      ? result.installations.filter(
          (game) =>
            game.category === selectedCategory &&
            (query === '' || game.path.toLowerCase().includes(query))
        )
      : []

  let mode: Mode = 'tree'
  let flat: ScanNode[] = []

  if (games.length > 0) {
    mode = 'games'
  } else if (selectedCategory) {
    mode = 'category'
    flat = categoryFolders(result.tree, selectedCategory)
      .filter((node) => query === '' || node.path.toLowerCase().includes(query))
      .sort(bySizeDesc)
  } else if (query !== '') {
    mode = 'search'
    flat = searchNodes(result.tree, filter).sort(bySizeDesc)
  }

  // Games share against the platform total; other items against the whole scan.
  const categoryTotal = selectedCategory
    ? result.categories.find((category) => category.id === selectedCategory)?.sizeBytes || total
    : total

  const shown = flat.slice(0, MAX_FLAT_ROWS)
  const truncated = flat.length > shown.length

  let subtitle: string
  if (mode === 'tree') subtitle = 'Click a folder to expand it'
  else if (mode === 'games')
    subtitle = `${games.length} installed game${games.length === 1 ? '' : 's'} · largest first`
  else if (mode === 'category')
    subtitle = `${shown.length} folder${shown.length === 1 ? '' : 's'}${
      truncated ? ` (showing top ${MAX_FLAT_ROWS})` : ''
    } · largest first`
  else
    subtitle = `${shown.length} match${shown.length === 1 ? '' : 'es'}${
      truncated ? ` (showing top ${MAX_FLAT_ROWS})` : ''
    }`

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
        {mode === 'tree' && <FolderTree root={result.tree} totalBytes={total} />}

        {mode === 'games' &&
          games.map((game) => (
            <NodeRow key={game.path} node={gameToNode(game)} totalBytes={categoryTotal} showDir />
          ))}

        {(mode === 'category' || mode === 'search') &&
          shown.map((node) => <NodeRow key={node.path} node={node} totalBytes={total} showDir />)}

        {(mode === 'category' || mode === 'search') && shown.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">Nothing matches this filter.</p>
        )}
      </div>
    </Panel>
  )
}
