'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2, Lock } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Candle } from '@/components/atmospheric/candle'
import { DimRoom } from '@/components/atmospheric/dim-room'
import { createClient } from '@/lib/supabase/client'
import {
  INTEREST_TAGS,
  PERSONALITY_AXES,
  VALUE_TAGS,
  type Profile,
} from '@/lib/types'
import { vibeFromInterests } from '@/lib/utils'
import { StepBasics } from './steps/step-basics'
import { StepValues } from './steps/step-values'
import { StepInterests } from './steps/step-interests'
import { StepPersonality } from './steps/step-personality'
import { StepPhysical } from './steps/step-physical'
import { StepPhotos } from './steps/step-photos'

export interface WizardState {
  display_name: string
  age: number
  gender: string
  seeking: string
  city: string
  bio_short: string
  values: string[]
  interests: string[]
  personality: Record<string, number>
  love_language: string
  hair_color: string
  eye_color: string
  height_cm: number
  body_type: string
  ethnicity: string
  photos: string[]
}

const baseSchema = z.object({
  display_name: z.string().min(2).max(32),
  age: z.number().min(18).max(120),
  gender: z.string().min(1),
  seeking: z.string().min(1),
  city: z.string().min(1).max(64),
  bio_short: z.string().max(280),
  values: z.array(z.string()).min(3, 'Pick at least 3 values'),
  interests: z.array(z.string()).min(3, 'Pick at least 3 interests'),
  personality: z.record(z.string(), z.number().min(0).max(100)),
  love_language: z.string().min(1),
  hair_color: z.string().min(1),
  eye_color: z.string().min(1),
  height_cm: z.number().min(120).max(230),
  body_type: z.string().min(1),
  ethnicity: z.string(),
  photos: z.array(z.string()),
})

const STEP_TITLES = [
  'The basics',
  'Your values',
  'Your interests',
  'Your inner weather',
  'The locked details',
  'Your locked photos',
] as const

export function OnboardingWizard({
  initial,
  userId,
}: {
  initial: Profile | null
  userId: string
}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [state, setState] = useState<WizardState>(() => ({
    display_name: initial?.display_name ?? '',
    age: initial?.age ?? 28,
    gender: initial?.gender ?? '',
    seeking: initial?.seeking ?? 'any',
    city: initial?.city ?? '',
    bio_short: initial?.bio_short ?? '',
    values: initial?.values ?? [],
    interests: initial?.interests ?? [],
    personality:
      initial?.personality ??
      Object.fromEntries(PERSONALITY_AXES.map((a) => [a.key, 50])),
    love_language: initial?.love_language ?? '',
    hair_color: initial?.hair_color ?? '',
    eye_color: initial?.eye_color ?? '',
    height_cm: initial?.height_cm ?? 170,
    body_type: initial?.body_type ?? '',
    ethnicity: initial?.ethnicity ?? '',
    photos: initial?.photos ?? [],
  }))

  const update = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setState((s) => ({ ...s, [key]: value }))

  const progress = useMemo(() => ((step + 1) / STEP_TITLES.length) * 100, [step])

  function next() {
    setError(null)
    if (step < STEP_TITLES.length - 1) setStep((s) => s + 1)
  }
  function prev() {
    setError(null)
    if (step > 0) setStep((s) => s - 1)
  }

  async function finish() {
    setError(null)
    const parsed = baseSchema.safeParse(state)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please complete every required field.')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const vibe = vibeFromInterests(state.interests)
    const payload = {
      ...state,
      vibe_title: vibe,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    }
    const { error: upErr } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...payload })
    setSaving(false)
    if (upErr) {
      setError(upErr.message)
      return
    }
    router.push('/lounge')
    router.refresh()
  }

  const stepValid = (() => {
    switch (step) {
      case 0:
        return (
          state.display_name.trim().length >= 2 &&
          state.age >= 18 &&
          state.gender &&
          state.seeking &&
          state.city.trim()
        )
      case 1:
        return state.values.length >= 3
      case 2:
        return state.interests.length >= 3
      case 3:
        return state.love_language.length > 0
      case 4:
        return (
          state.hair_color &&
          state.eye_color &&
          state.body_type &&
          state.height_cm >= 120
        )
      case 5:
        return true
      default:
        return false
    }
  })()

  return (
    <DimRoom className="flex-1">
      <header className="px-6 py-6 max-w-3xl mx-auto w-full flex items-center gap-3">
        <Candle size="sm" />
        <span className="font-serif text-xl tracking-wide">Soul-Sync</span>
        <span className="ml-auto text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          Step {step + 1} / {STEP_TITLES.length}
        </span>
      </header>

      <div className="max-w-3xl mx-auto w-full px-6">
        <Progress value={progress} />
      </div>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <h1 className="font-serif text-4xl text-gradient-candle">{STEP_TITLES[step]}</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)] flex items-center gap-2">
          {step >= 4 && <Lock className="h-3.5 w-3.5 text-[var(--candle)]" />}
          {step === 0 && 'A handful of basics so we can place you at the right table.'}
          {step === 1 && 'Choose at least three. We weight matches by these the most.'}
          {step === 2 && 'What lights you up? Pick at least three.'}
          {step === 3 && 'Slide each axis to where you actually live.'}
          {step >= 4 &&
            'These will be hidden from your matches until both of you light the candle.'}
        </p>

        <div className="mt-10 surface-card rounded-2xl p-6 sm:p-8 min-h-[360px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {step === 0 && <StepBasics state={state} update={update} />}
              {step === 1 && <StepValues values={state.values} onChange={(v) => update('values', v)} />}
              {step === 2 && (
                <StepInterests
                  interests={state.interests}
                  onChange={(v) => update('interests', v)}
                />
              )}
              {step === 3 && (
                <StepPersonality
                  personality={state.personality}
                  loveLanguage={state.love_language}
                  onPersonalityChange={(p) => update('personality', p)}
                  onLoveLanguageChange={(v) => update('love_language', v)}
                />
              )}
              {step === 4 && <StepPhysical state={state} update={update} />}
              {step === 5 && (
                <StepPhotos
                  userId={userId}
                  photos={state.photos}
                  onChange={(v) => update('photos', v)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-300/90 border border-red-900/50 bg-red-950/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={prev} disabled={step === 0 || saving}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {step < STEP_TITLES.length - 1 ? (
            <Button onClick={next} disabled={!stepValid}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finish} disabled={!stepValid || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'Setting the table…' : 'Enter the lounge'}
            </Button>
          )}
        </div>
      </main>
    </DimRoom>
  )
}
