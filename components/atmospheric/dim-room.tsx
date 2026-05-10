'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// A "lounge floor" backdrop — a slow drifting radial gradient that mimics
// candles flickering across a darkened room.
export function DimRoom({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn('relative isolate overflow-hidden', className)}>
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10"
        animate={{
          background: [
            'radial-gradient(ellipse 40% 30% at 18% 28%, rgba(255,191,0,0.16), transparent 60%), radial-gradient(ellipse 35% 25% at 78% 22%, rgba(255,106,61,0.10), transparent 60%), radial-gradient(ellipse 50% 40% at 50% 80%, rgba(255,191,0,0.08), transparent 60%)',
            'radial-gradient(ellipse 40% 30% at 22% 32%, rgba(255,191,0,0.20), transparent 60%), radial-gradient(ellipse 35% 25% at 74% 26%, rgba(255,106,61,0.12), transparent 60%), radial-gradient(ellipse 50% 40% at 52% 78%, rgba(255,191,0,0.10), transparent 60%)',
            'radial-gradient(ellipse 40% 30% at 18% 28%, rgba(255,191,0,0.16), transparent 60%), radial-gradient(ellipse 35% 25% at 78% 22%, rgba(255,106,61,0.10), transparent 60%), radial-gradient(ellipse 50% 40% at 50% 80%, rgba(255,191,0,0.08), transparent 60%)',
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      {children}
    </div>
  )
}
