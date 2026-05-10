import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeAgo(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function vibeFromInterests(interests: string[]): string {
  const palette = [
    'The Jazz Enthusiast',
    'The Quiet Reader',
    'The Mountain Wanderer',
    'The Midnight Painter',
    'The Slow Cook',
    'The Stargazer',
    'The Lyric Collector',
    'The Late-Night Philosopher',
    'The Vinyl Hunter',
    'The Garden Keeper',
    'The Storm Watcher',
    'The Map Drawer',
  ]
  if (!interests.length) return palette[0]
  let hash = 0
  for (const i of interests) for (const c of i) hash = (hash * 31 + c.charCodeAt(0)) | 0
  return palette[Math.abs(hash) % palette.length]
}
