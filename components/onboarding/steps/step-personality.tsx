'use client'

import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { PERSONALITY_AXES } from '@/lib/types'

const LOVE_LANGUAGES = [
  'Words of affirmation',
  'Quality time',
  'Acts of service',
  'Physical touch',
  'Receiving gifts',
]

export function StepPersonality({
  personality,
  loveLanguage,
  onPersonalityChange,
  onLoveLanguageChange,
}: {
  personality: Record<string, number>
  loveLanguage: string
  onPersonalityChange: (p: Record<string, number>) => void
  onLoveLanguageChange: (v: string) => void
}) {
  return (
    <div className="space-y-8">
      {PERSONALITY_AXES.map((axis) => {
        const v = personality[axis.key] ?? 50
        return (
          <div key={axis.key} className="space-y-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              <span>{axis.left}</span>
              <span>{axis.right}</span>
            </div>
            <Slider
              value={[v]}
              min={0}
              max={100}
              step={1}
              onValueChange={(val) =>
                onPersonalityChange({ ...personality, [axis.key]: val[0] })
              }
            />
          </div>
        )
      })}

      <div className="space-y-2">
        <Label>Love language</Label>
        <RadioGroup
          value={loveLanguage}
          onValueChange={onLoveLanguageChange}
          className="grid sm:grid-cols-2 gap-2"
        >
          {LOVE_LANGUAGES.map((l) => (
            <label
              key={l}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                loveLanguage === l
                  ? 'border-[var(--candle)] bg-[var(--candle)]/5 text-[var(--candle)]'
                  : 'border-white/10 text-[var(--muted-foreground)]'
              }`}
            >
              <RadioGroupItem value={l} /> {l}
            </label>
          ))}
        </RadioGroup>
      </div>
    </div>
  )
}
