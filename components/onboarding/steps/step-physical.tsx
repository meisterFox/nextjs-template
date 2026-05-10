'use client'

import { Lock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import type { WizardState } from '../wizard'

const HAIR = ['Black', 'Brown', 'Blonde', 'Red', 'Grey', 'Other']
const EYE = ['Brown', 'Hazel', 'Green', 'Blue', 'Grey', 'Other']
const BODY = ['Slim', 'Athletic', 'Average', 'Curvy', 'Plus', 'Prefer not to say']

function Choice({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              value === o
                ? 'border-[var(--candle)] bg-[var(--candle)]/10 text-[var(--candle)]'
                : 'border-white/10 text-[var(--muted-foreground)] hover:border-white/20'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

export function StepPhysical({
  state,
  update,
}: {
  state: WizardState
  update: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void
}) {
  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-[var(--candle)]/30 bg-[var(--candle)]/5 px-4 py-3 text-xs text-[var(--candle)] flex items-center gap-2">
        <Lock className="h-3.5 w-3.5" /> Hidden until both candles are lit. Used by no one but the
        matchmaker.
      </div>

      <Choice label="Hair color" options={HAIR} value={state.hair_color} onChange={(v) => update('hair_color', v)} />
      <Choice label="Eye color" options={EYE} value={state.eye_color} onChange={(v) => update('eye_color', v)} />
      <Choice label="Body type" options={BODY} value={state.body_type} onChange={(v) => update('body_type', v)} />

      <div className="space-y-3">
        <div className="flex justify-between">
          <Label>Height</Label>
          <span className="text-xs text-[var(--candle)]">{state.height_cm} cm</span>
        </div>
        <Slider
          value={[state.height_cm]}
          min={120}
          max={220}
          step={1}
          onValueChange={(v) => update('height_cm', v[0])}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ethnicity">Ethnicity (optional)</Label>
        <Input
          id="ethnicity"
          value={state.ethnicity}
          onChange={(e) => update('ethnicity', e.target.value)}
          placeholder="Leave blank if you'd rather not say"
        />
      </div>
    </div>
  )
}
