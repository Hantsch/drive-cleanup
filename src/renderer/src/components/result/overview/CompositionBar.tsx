import { CATEGORY_BY_ID } from '@shared/categories'
import type { ScanResult } from '@shared/types'
import { useScanStore } from '@renderer/store/scanStore'
import { cn } from '@renderer/lib/cn'
import { formatBytes } from '@renderer/lib/format'
import { CategoryLegend } from './CategoryLegend'

interface CompositionBarProps {
  result: ScanResult
}

export function CompositionBar({ result }: CompositionBarProps) {
  const selectedCategory = useScanStore((state) => state.selectedCategory)
  const toggleCategory = useScanStore((state) => state.toggleCategory)
  const total = result.totalSizeBytes || 1

  return (
    <div>
      <div className="mb-2 text-[11px] uppercase tracking-wider text-muted">Storage composition</div>

      <div className="flex h-4 overflow-hidden rounded-md ring-1 ring-inset ring-white/5">
        {result.categories.map((category) => {
          const def = CATEGORY_BY_ID[category.id]
          const width = (category.sizeBytes / total) * 100
          const dimmed = selectedCategory !== null && selectedCategory !== category.id
          return (
            <button
              key={category.id}
              title={`${def.label} · ${formatBytes(category.sizeBytes)}`}
              onClick={() => toggleCategory(category.id)}
              className={cn(
                'h-full cursor-default transition hover:brightness-110',
                dimmed && 'opacity-30 grayscale'
              )}
              style={{ width: `${width}%`, background: def.color }}
            />
          )
        })}
      </div>

      <CategoryLegend categories={result.categories.slice(0, 7)} />
    </div>
  )
}
