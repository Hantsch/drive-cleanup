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

/**
 * Files of a category grouped by their immediate parent folder. Each folder is
 * a synthetic directory node aggregating the size and count of its matching
 * files — more useful for cleanup than thousands of individual small files.
 */
export function categoryFolders(root: ScanNode, category: CategoryId): ScanNode[] {
  const byParent = new Map<string, ScanNode>()
  for (const file of filesOfCategory(root, category)) {
    const dir = parentPath(file.path)
    const existing = byParent.get(dir)
    if (existing) {
      existing.sizeBytes += file.sizeBytes
      existing.fileCount += 1
    } else {
      byParent.set(dir, {
        name: baseName(dir),
        path: dir,
        type: 'dir',
        sizeBytes: file.sizeBytes,
        fileCount: 1,
        category
      })
    }
  }
  return [...byParent.values()]
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

/** Leaf folder/file name of a Windows-style path. */
export function baseName(path: string): string {
  const trimmed = path.replace(/[\\/]+$/, '')
  const cut = Math.max(trimmed.lastIndexOf('\\'), trimmed.lastIndexOf('/'))
  return cut >= 0 ? trimmed.slice(cut + 1) : trimmed
}