'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function Candle({
  className,
  lit = true,
  size = 'md',
}: {
  className?: string
  lit?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const dim = size === 'sm' ? 16 : size === 'md' ? 22 : 32
  return (
    <div className={cn('relative inline-flex flex-col items-center', className)} aria-hidden>
      {lit && (
        <motion.div
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: dim * 0.6,
            height: dim * 0.9,
            background:
              'radial-gradient(ellipse at 50% 70%, rgba(255,191,0,0.95) 0%, rgba(255,106,61,0.7) 35%, rgba(255,191,0,0.0) 75%)',
            filter: 'blur(0.4px)',
          }}
          animate={{
            scaleY: [1, 1.08, 0.96, 1.04, 1],
            opacity: [1, 0.95, 0.88, 0.97, 1],
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <div
        className="rounded-sm bg-gradient-to-b from-[#f3e7c5] to-[#bca77a]"
        style={{ width: dim * 0.35, height: dim * 1.6 }}
      />
    </div>
  )
}
