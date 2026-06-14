import { opendir, lstat } from 'node:fs/promises'
import { join } from 'node:path'
import { categorize } from '@shared/categorize'
import type { CategoryId } from '@shared/categories'
import type { ScanNode, ScanProgress } from '@shared/types'

const PROGRESS_INTERVAL_MS = 150

interface CategoryAccumulator {
  sizeBytes: number
  fileCount: number
}

export interface ScanStats {
  files: number
  dirs: number
  bytes: number
  categories: Map<CategoryId, CategoryAccumulator>
  skipped: string[]
}

export interface ScanContext {
  emitProgress: (progress: ScanProgress) => void
  isCancelled: () => boolean
}

/**
 * Recursively walks a directory, building an aggregated tree while collecting
 * per-category totals. Symlinks and junctions are skipped to avoid loops and
 * double counting; unreadable directories are recorded and skipped.
 */
export class Scanner {
  private readonly stats: ScanStats = {
    files: 0,
    dirs: 0,
    bytes: 0,
    categories: new Map(),
    skipped: []
  }

  private lastEmit = 0

  constructor(private readonly ctx: ScanContext) {}

  async scan(root: string): Promise<{ tree: ScanNode; stats: ScanStats }> {
    const tree = await this.walkDir(root, rootName(root))
    return { tree, stats: this.stats }
  }

  private async walkDir(dirPath: string, name: string): Promise<ScanNode> {
    this.stats.dirs += 1
    const node: ScanNode = {
      name,
      path: dirPath,
      type: 'dir',
      sizeBytes: 0,
      fileCount: 0,
      children: []
    }

    let dir
    try {
      dir = await opendir(dirPath)
    } catch {
      node.accessError = true
      this.stats.skipped.push(dirPath)
      return node
    }

    try {
      for await (const entry of dir) {
        if (this.ctx.isCancelled()) break
        if (entry.isSymbolicLink()) continue

        const childPath = join(dirPath, entry.name)
        if (entry.isDirectory()) {
          const child = await this.walkDir(childPath, entry.name)
          node.children!.push(child)
          node.sizeBytes += child.sizeBytes
          node.fileCount += child.fileCount
        } else if (entry.isFile()) {
          const child = await this.statFile(childPath, entry.name)
          if (child) {
            node.children!.push(child)
            node.sizeBytes += child.sizeBytes
            node.fileCount += 1
          }
        }
      }
    } catch {
      node.accessError = true
    }

    this.maybeEmit(dirPath)
    return node
  }

  private async statFile(filePath: string, name: string): Promise<ScanNode | null> {
    let info
    try {
      info = await lstat(filePath)
    } catch {
      this.stats.skipped.push(filePath)
      return null
    }
    if (info.isSymbolicLink()) return null

    const category = categorize(filePath)
    this.stats.files += 1
    this.stats.bytes += info.size

    const acc = this.stats.categories.get(category) ?? { sizeBytes: 0, fileCount: 0 }
    acc.sizeBytes += info.size
    acc.fileCount += 1
    this.stats.categories.set(category, acc)

    this.maybeEmit(filePath)
    return {
      name,
      path: filePath,
      type: 'file',
      sizeBytes: info.size,
      fileCount: 1,
      category,
      mtimeMs: info.mtimeMs
    }
  }

  private maybeEmit(currentPath: string): void {
    const now = Date.now()
    if (now - this.lastEmit < PROGRESS_INTERVAL_MS) return
    this.lastEmit = now
    this.ctx.emitProgress({
      filesScanned: this.stats.files,
      dirsScanned: this.stats.dirs,
      bytesScanned: this.stats.bytes,
      currentPath
    })
  }
}

/** Display name for the scanned root, e.g. "C:\" or the leaf folder name. */
function rootName(target: string): string {
  const trimmed = target.replace(/[\\/]+$/, '')
  if (trimmed.endsWith(':')) return `${trimmed}\\`
  const leaf = trimmed.split(/[\\/]/).pop()
  return leaf && leaf.length > 0 ? leaf : target
}
