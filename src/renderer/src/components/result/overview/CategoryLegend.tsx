import { CATEGORY_BY_ID } from '@shared/categories'
import type { CategorySummary } from '@shared/types'
import { formatBytes } from '@renderer/lib/format'

interface CategoryLegendProps {
  categories: CategorySummary[]
}

export function CategoryLegend({ categories }: CategoryLegendProps) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
      {categories.map((category) => {
        const def = CATEGORY_BY_ID[category.id]
        return (
          <span key={category.id} className="flex items-center gap-2 text-xs text-muted">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: def.color }} />
            {def.label}
            <span className="font-medium text-ink">{formatBytes(category.sizeBytes)}</span>
          </span>
        )
      })}
    </div>
  )
}
