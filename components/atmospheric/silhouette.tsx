'use client'

import { motion } from 'framer-motion'
import type { RevealLevel } from '@/lib/types'
import { cn } from '@/lib/utils'

export function Silhouette({
  level = 'whisper',
  className,
  size = 'md',
  photoUrl,
  alt,
}: {
  level?: RevealLevel
  className?: string
  size?: 'sm' | 'md' | 'lg'
  photoUrl?: string | null
  alt?: string
}) {
  const dim = size === 'sm' ? 64 : size === 'md' ? 120 : 200
  const blur = level === 'whisper' ? 28 : level === 'outline' ? 14 : 0
  const brightness = level === 'whisper' ? 0.45 : level === 'outline' ? 0.7 : 1

  return (
    <motion.div
      className={cn('relative overflow-hidden rounded-full silhouette', className)}
      style={{ width: dim, height: dim }}
      animate={{ filter: `blur(${blur}px) brightness(${brightness})` }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={alt ?? 'silhouette'} className="h-full w-full object-cover" />
      ) : (
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <defs>
            <radialGradient id="head-glow" cx="50%" cy="35%" r="55%">
              <stop offset="0%" stopColor="#ffbf00" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#3a2c10" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0a0908" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="38" r="22" fill="#0a0908" stroke="rgba(255,191,0,0.15)" strokeWidth="0.6" />
          <path
            d="M14 100 C 14 70, 30 58, 50 58 C 70 58, 86 70, 86 100 Z"
            fill="#0a0908"
            stroke="rgba(255,191,0,0.15)"
            strokeWidth="0.6"
          />
          <rect width="100" height="100" fill="url(#head-glow)" />
        </svg>
      )}
      <div className="absolute inset-0 fog-overlay pointer-events-none" />
    </motion.div>
  )
}
