'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { INTEREST_TAGS } from '@/lib/types'
import { cn, vibeFromInterests } from '@/lib/utils'

export function StepInterests({
  interests,
  vibeTitle,
  onChange,
  onVibeChange,
}: {
  interests: string[]
  vibeTitle: string
  onChange: (v: string[]) => void
  onVibeChange: (v: string) => void
}) {
  function toggle(tag: string) {
    onChange(interests.includes(tag) ? interests.filter((v) => v !== tag) : [...interests, tag])
  }

  const suggested = vibeFromInterests(interests)

  return (
    <div className="space-y-6">
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
      <div className="space-y-2 pt-2 border-t border-white/5">
        <Label htmlFor="vibe">Your vibe title (the only thing strangers see)</Label>
        <Input
          id="vibe"
          value={vibeTitle}
          onChange={(e) => onVibeChange(e.target.value)}
          placeholder={suggested}
          maxLength={48}
        />
        <p className="text-[11px] text-[var(--muted)]">
          Leave it blank and we&apos;ll suggest <span className="text-[var(--candle)]">{suggested}</span>{' '}
          based on your interests.
        </p>
      </div>
    </div>
  )
}
