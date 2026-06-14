import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { categorize } from '@shared/categorize'
import type { CategoryId } from '@shared/categories'
import type { ScanNode, ScanProgress } from '@shared/types'

const PROGRESS_INTERVAL_MS = 150

/** How many directories are read in parallel. */
const DIR_CONCURRENCY = 16
/** How many files are stat()'d in parallel within a single directory. */
const FILE_CONCURRENCY = 8
/** Files are only retained as tree nodes near the top; deeper ones are still
 *  counted but not kept (they can never be displayed and would waste memory). */
const RETAIN_FILES_MAX_DEPTH = 4
/** Largest files kept per directory for the drill-down. */
const MAX_FILE_CHILDREN = 100

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

interface WorkItem {
  node: ScanNode
  depth: number
}

/**
 * Walks a directory tree with a bounded worker pool. Files are stat()'d in
 * parallel and aggregated into per-category totals; symlinks/junctions are
 * skipped to avoid loops and double counting. Directory sizes are summed in a
 * single post-order pass once the walk finishes.
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
    const tree: ScanNode = {
      name: rootName(root),
      path: root,
      type: 'dir',
      sizeBytes: 0,
      fileCount: 0,
      children: []
    }

    await this.drain([{ node: tree, depth: 0 }])
    aggregateSizes(tree)
    return { tree, stats: this.stats }
  }

  /** Runs a fixed pool of workers over a growing queue of directories. */
  private drain(queue: WorkItem[]): Promise<void> {
    return new Promise((resolve) => {
      let inFlight = 0

      const pump = (): void => {
        if (this.ctx.isCancelled()) {
          if (inFlight === 0) resolve()
          return
        }
        while (inFlight < DIR_CONCURRENCY && queue.length > 0) {
          // pop() (LIFO) is O(1); ordering does not matter since sizes are
          // aggregated at the end. shift() would be O(n) and quadratic overall.
          const item = queue.pop() as WorkItem
          inFlight += 1
          this.processDir(item, queue).finally(() => {
            inFlight -= 1
            if (queue.length === 0 && inFlight === 0) resolve()
            else pump()
          })
        }
        if (queue.length === 0 && inFlight === 0) resolve()
      }

      pump()
    })
  }

  private async processDir({ node, depth }: WorkItem, queue: WorkItem[]): Promise<void> {
    if (this.ctx.isCancelled()) return
    this.stats.dirs += 1

    let entries
    try {
      entries = await readdir(node.path, { withFileTypes: true })
    } catch {
      node.accessError = true
      this.stats.skipped.push(node.path)
      return
    }

    const fileNames: string[] = []
    const childDirs: ScanNode[] = []

    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue
      if (entry.isDirectory()) {
        const childNode: ScanNode = {
          name: entry.name,
          path: join(node.path, entry.name),
          type: 'dir',
          sizeBytes: 0,
          fileCount: 0,
          children: []
        }
        childDirs.push(childNode)
        queue.push({ node: childNode, depth: depth + 1 })
      } else if (entry.isFile()) {
        fileNames.push(entry.name)
      }
    }

    const fileNodes = await mapLimit(fileNames, FILE_CONCURRENCY, (name) =>
      this.statFile(join(node.path, name), name)
    )

    let ownSize = 0
    let ownCount = 0
    const retained: ScanNode[] = []
    for (const file of fileNodes) {
      if (!file) continue
      ownSize += file.sizeBytes
      ownCount += 1
      if (depth <= RETAIN_FILES_MAX_DEPTH) retained.push(file)
    }

    // Own files contribute now; child directories are added in aggregateSizes.
    node.sizeBytes = ownSize
    node.fileCount = ownCount

    if (retained.length > MAX_FILE_CHILDREN) {
      retained.sort((a, b) => b.sizeBytes - a.sizeBytes)
      retained.length = MAX_FILE_CHILDREN
    }
    node.children = [...retained, ...childDirs]

    this.maybeEmit(node.path)
  }

  private async statFile(filePath: string, name: string): Promise<ScanNode | null> {
    let info
    try {
      info = await stat(filePath)
    } catch {
      this.stats.skipped.push(filePath)
      return null
    }

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

/** Post-order pass: fold child directory sizes into their parents. */
function aggregateSizes(node: ScanNode): void {
  for (const child of node.children ?? []) {
    if (child.type !== 'dir') continue
    aggregateSizes(child)
    node.sizeBytes += child.sizeBytes
    node.fileCount += child.fileCount
  }
}

/** Runs `fn` over `items` with at most `limit` promises in flight. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0

  const worker = async (): Promise<void> => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await fn(items[index])
    }
  }

  const size = Math.min(limit, items.length)
  await Promise.all(Array.from({ length: size }, worker))
  return results
}

/** Display name for the scanned root, e.g. "C:\" or the leaf folder name. */
function rootName(target: string): string {
  const trimmed = target.replace(/[\\/]+$/, '')
  if (trimmed.endsWith(':')) return `${trimmed}\\`
  const leaf = trimmed.split(/[\\/]/).pop()
  return leaf && leaf.length > 0 ? leaf : target
}
