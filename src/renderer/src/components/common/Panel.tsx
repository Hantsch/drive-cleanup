import type { ReactNode } from 'react'
import { cn } from '@renderer/lib/cn'

interface PanelProps {
  className?: string
  children: ReactNode
}

/** Frosted surface used for every card on the result screen. */
export function Panel({ className, children }: PanelProps) {
  return (
    <section
      className={cn('rounded-2xl border border-line bg-panel/80 p-5 backdrop-blur-sm', className)}
    >
      {children}
    </section>
  )
}
