import * as React from 'react'
import { cn } from '@/lib/utils'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[88px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm',
        'placeholder:text-[var(--muted)] text-[var(--foreground)]',
        'focus-visible:border-[var(--candle)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--candle)]/20',
        'resize-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'
