import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm',
          'placeholder:text-[var(--muted)] text-[var(--foreground)]',
          'focus-visible:border-[var(--candle)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--candle)]/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'
