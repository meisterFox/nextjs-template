import * as React from 'react'
import { cn } from '@/lib/utils'

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'candle' | 'muted' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide',
        variant === 'candle' && 'bg-[var(--candle)]/10 text-[var(--candle)] border border-[var(--candle)]/30',
        variant === 'muted' && 'bg-white/5 text-[var(--muted-foreground)] border border-white/10',
        variant === 'default' && 'bg-white/5 text-[var(--foreground)] border border-white/10',
        className,
      )}
      {...props}
    />
  )
}
