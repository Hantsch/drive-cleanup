import { CATEGORIES, type CategoryId } from './categories'

/** Extension (lowercase) -> category, built once from the catalogue. */
const EXTENSION_INDEX: ReadonlyMap<string, CategoryId> = (() => {
  const map = new Map<string, CategoryId>()
  for (const category of CATEGORIES) {
    for (const ext of category.extensions) map.set(ext, category.id)
  }
  return map
})()

/** Path hints (lowercase) -> category. Hints win over the extension. */
const PATH_HINTS: ReadonlyArray<readonly [string, CategoryId]> = CATEGORIES.flatMap((c) =>
  (c.pathHints ?? []).map((hint) => [hint, c.id] as const)
)

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  if (dot <= 0 || dot === fileName.length - 1) return ''
  return fileName.slice(dot + 1).toLowerCase()
}

/**
 * Classify a file by location first (temp/cache/system folders), then by
 * extension. Unknown files fall back to `other`.
 */
export function categorize(filePath: string): CategoryId {
  const lower = filePath.toLowerCase()
  for (const [hint, id] of PATH_HINTS) {
    if (lower.includes(hint)) return id
  }
  return EXTENSION_INDEX.get(extensionOf(filePath)) ?? 'other'
}
