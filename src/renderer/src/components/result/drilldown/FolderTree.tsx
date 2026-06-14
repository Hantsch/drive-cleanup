import { useState, type ReactElement } from 'react'
import type { ScanNode } from '@shared/types'
import { bySizeDesc } from '@renderer/lib/tree'
import { NodeRow } from './NodeRow'

interface FolderTreeProps {
  root: ScanNode
  totalBytes: number
}

/** Hierarchical view of the root's children with lazy expand/collapse. */
export function FolderTree({ root, totalBytes }: FolderTreeProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())

  const toggle = (path: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })

  const renderNodes = (nodes: ScanNode[], depth: number): ReactElement[] =>
    [...nodes].sort(bySizeDesc).flatMap((node) => {
      const hasChildren = node.type === 'dir' && (node.children?.length ?? 0) > 0
      const isOpen = expanded.has(node.path)

      const rows: ReactElement[] = [
        <NodeRow
          key={node.path}
          node={node}
          totalBytes={totalBytes}
          depth={depth}
          expandable={hasChildren}
          expanded={isOpen}
          onToggle={() => toggle(node.path)}
        />
      ]

      if (hasChildren && isOpen) {
        rows.push(...renderNodes(node.children ?? [], depth + 1))
      }
      return rows
    })

  return <div>{renderNodes(root.children ?? [], 0)}</div>
}
