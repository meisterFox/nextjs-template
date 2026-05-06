'use client'

import { INTEREST_TAGS } from '@/lib/types'
import { cn } from '@/lib/utils'

export function StepInterests({
  interests,
  onChange,
}: {
  interests: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(tag: string) {
    onChange(interests.includes(tag) ? interests.filter((v) => v !== tag) : [...interests, tag])
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {INTEREST_TAGS.map((tag) => {
          const active = interests.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm transition',
                active
                  ? 'border-[var(--candle)] text-[var(--candle)] bg-[var(--candle)]/10 glow-candle-soft'
                  : 'border-white/10 text-[var(--muted-foreground)] hover:border-white/20',
              )}
            >
              {tag}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-[var(--muted)]">
        We&apos;ll generate your &ldquo;vibe title&rdquo; from these — your only public marker before the
        whisper begins.
      </p>
    </div>
  )
}
