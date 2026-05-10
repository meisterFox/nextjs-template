'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import type { WizardState } from '../wizard'

const GENDERS = ['Woman', 'Man', 'Non-binary', 'Other']
const SEEKING = [
  { value: 'Woman', label: 'Women' },
  { value: 'Man', label: 'Men' },
  { value: 'Non-binary', label: 'Non-binary' },
  { value: 'any', label: 'Anyone' },
]

export function StepBasics({
  state,
  update,
}: {
  state: WizardState
  update: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void
}) {
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="display_name">Name shown after the reveal</Label>
          <Input
            id="display_name"
            value={state.display_name}
            onChange={(e) => update('display_name', e.target.value)}
            placeholder="Sera"
            maxLength={32}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            min={18}
            max={120}
            value={state.age}
            onChange={(e) => update('age', parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>You are</Label>
        <RadioGroup
          className="grid grid-cols-2 sm:grid-cols-4 gap-2"
          value={state.gender}
          onValueChange={(v) => update('gender', v)}
        >
          {GENDERS.map((g) => (
            <label
              key={g}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                state.gender === g
                  ? 'border-[var(--candle)] bg-[var(--candle)]/5 text-[var(--candle)]'
                  : 'border-white/10 text-[var(--muted-foreground)]'
              }`}
            >
              <RadioGroupItem value={g} /> {g}
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>You&apos;re looking to meet</Label>
        <RadioGroup
          className="grid grid-cols-2 sm:grid-cols-4 gap-2"
          value={state.seeking}
          onValueChange={(v) => update('seeking', v)}
        >
          {SEEKING.map((s) => (
            <label
              key={s.value}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                state.seeking === s.value
                  ? 'border-[var(--candle)] bg-[var(--candle)]/5 text-[var(--candle)]'
                  : 'border-white/10 text-[var(--muted-foreground)]'
              }`}
            >
              <RadioGroupItem value={s.value} /> {s.label}
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          value={state.city}
          onChange={(e) => update('city', e.target.value)}
          placeholder="Istanbul"
          maxLength={64}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">A line about who you are tonight</Label>
        <Textarea
          id="bio"
          value={state.bio_short}
          onChange={(e) => update('bio_short', e.target.value)}
          placeholder="Halfway through a Murakami, drinking too much black coffee."
          maxLength={280}
        />
        <p className="text-[11px] text-[var(--muted)]">
          Stays visible from the very first whisper. {state.bio_short.length}/280
        </p>
      </div>
    </div>
  )
}
