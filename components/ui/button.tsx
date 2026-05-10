'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium tracking-wide transition-all disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        candle:
          'bg-[var(--candle)] text-black hover:bg-[var(--candle-soft)] glow-candle-soft hover:glow-candle',
        outline:
          'border border-[var(--candle)]/30 text-[var(--candle)] hover:border-[var(--candle)] hover:bg-[var(--candle)]/5',
        ghost: 'text-[var(--foreground)] hover:bg-white/5',
        whisper:
          'bg-white/5 text-[var(--foreground)] hover:bg-white/10 border border-white/10',
        danger: 'bg-red-900/40 text-red-200 hover:bg-red-900/60 border border-red-800/40',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-5',
        lg: 'h-12 px-7 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'candle', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
    )
  },
)
Button.displayName = 'Button'

export { buttonVariants }
