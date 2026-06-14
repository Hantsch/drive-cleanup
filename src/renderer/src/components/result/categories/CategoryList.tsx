import { CATEGORY_BY_ID } from '@shared/categories'
import type { ScanResult } from '@shared/types'
import { useScanStore } from '@renderer/store/scanStore'
import { Panel } from '@renderer/components/common/Panel'
import { CategoryRow } from './CategoryRow'

interface CategoryListProps {
  result: ScanResult
}

export function CategoryList({ result }: CategoryListProps) {
  const selectedCategory = useScanStore((state) => state.selectedCategory)
  const toggleCategory = useScanStore((state) => state.toggleCategory)

  const total = result.totalSizeBytes || 1
  const largest = result.categories[0]?.sizeBytes || 1

  return (
    <Panel className="self-start">
      <h2 className="text-sm font-semibold">📊 Categories</h2>
      <p className="mb-3 mt-0.5 text-[11.5px] text-muted">Click to filter the folder list</p>

      <div className="space-y-0.5">
        {result.categories.map((category) => (
          <CategoryRow
            key={category.id}
            def={CATEGORY_BY_ID[category.id]}
            summary={category}
            shareOfTotal={category.sizeBytes / total}
            barFraction={category.sizeBytes / largest}
            active={selectedCategory === category.id}
            onClick={() => toggleCategory(category.id)}
          />
        ))}
      </div>
    </Panel>
  )
}
