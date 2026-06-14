import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@renderer/lib/cn'

type Variant = 'primary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-bg font-semibold hover:brightness-110',
  ghost: 'bg-panel text-ink border border-line hover:border-[#39425a]'
}

export function Button({ variant = 'ghost', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex cursor-default select-none items-center gap-2 rounded-[10px] px-4 py-2 text-[13px] transition',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  )
}
