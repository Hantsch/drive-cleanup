import type { CategoryId } from '@shared/categories'
import type { CategorySummary, ScanNode } from '@shared/types'
import type { ScanStats } from './walk'

/** Keep the tree small enough to transport and render comfortably. */
const MAX_DEPTH = 4
const MAX_CHILDREN_PER_NODE = 100

/**
 * Returns a copy of the tree limited in depth and breadth: only the largest
 * children of each directory survive, and deep levels are dropped (their size
 * is already aggregated into the parent).
 */
export function pruneTree(node: ScanNode, depth = 0): ScanNode {
  if (!node.children || node.children.length === 0) return node

  if (depth >= MAX_DEPTH) {
    return { ...node, children: undefined }
  }

  const children = [...node.children]
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .slice(0, MAX_CHILDREN_PER_NODE)
    .map((child) => (child.type === 'dir' ? pruneTree(child, depth + 1) : child))

  return { ...node, children }
}

/** Turns the per-category accumulators into a list sorted by size, descending. */
export function toCategorySummaries(
  categories: ScanStats['categories']
): CategorySummary[] {
  return [...categories.entries()]
    .map(([id, acc]): CategorySummary => ({
      id: id as CategoryId,
      sizeBytes: acc.sizeBytes,
      fileCount: acc.fileCount
    }))
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
}
