'use client'

import { VALUE_TAGS } from '@/lib/types'
import { cn } from '@/lib/utils'

export function StepValues({
  values,
  onChange,
}: {
  values: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(tag: string) {
    onChange(values.includes(tag) ? values.filter((v) => v !== tag) : [...values, tag])
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {VALUE_TAGS.map((tag) => {
          const active = values.includes(tag)
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
        Selected {values.length} value{values.length === 1 ? '' : 's'}. Three is the floor; pick as
        many as you mean.
      </p>
    </div>
  )
}
