import type { CategoryId } from '@shared/categories'
import type { ScanNode } from '@shared/types'

/** Largest first — the default ordering everywhere in the UI. */
export function bySizeDesc(a: ScanNode, b: ScanNode): number {
  return b.sizeBytes - a.sizeBytes
}

/** Depth-first collection of every descendant matching `predicate`. */
export function collectDescendants(
  root: ScanNode,
  predicate: (node: ScanNode) => boolean
): ScanNode[] {
  const result: ScanNode[] = []
  const visit = (node: ScanNode): void => {
    for (const child of node.children ?? []) {
      if (predicate(child)) result.push(child)
      visit(child)
    }
  }
  visit(root)
  return result
}

export function filesOfCategory(root: ScanNode, category: CategoryId): ScanNode[] {
  return collectDescendants(root, (node) => node.type === 'file' && node.category === category)
}

export function searchNodes(root: ScanNode, query: string): ScanNode[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return []
  return collectDescendants(root, (node) => node.path.toLowerCase().includes(needle))
}

/** Parent directory of a Windows-style path, used to show a file's location. */
export function parentPath(path: string): string {
  const trimmed = path.replace(/[\\/]+$/, '')
  const cut = Math.max(trimmed.lastIndexOf('\\'), trimmed.lastIndexOf('/'))
  return cut > 0 ? trimmed.slice(0, cut) : trimmed
}
