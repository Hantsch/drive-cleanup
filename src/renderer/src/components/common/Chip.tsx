import type { ReactNode } from 'react'
import { cn } from '@renderer/lib/cn'

interface ChipProps {
  active?: boolean
  onClick?: () => void
  children: ReactNode
}

export function Chip({ active = false, onClick, children }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'cursor-default rounded-full border px-3.5 py-1.5 text-[12.5px] transition',
        active
          ? 'border-[#39425a] bg-panel-2 text-ink'
          : 'border-line bg-panel text-muted hover:text-ink'
      )}
    >
      {children}
    </button>
  )
}
