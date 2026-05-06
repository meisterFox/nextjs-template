'use client'

import { useEffect, useRef, useState } from 'react'
import { Music2, Volume2, VolumeX, CloudRain, Coffee } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

type Track = 'jazz' | 'rain'

// Web-Audio synthesized ambience: zero asset weight, plays anywhere with no
// 404s on Vercel. The "jazz" preset is a slow major-7 piano-bell loop, the
// "rain" preset is brown-noise with a rolling low-pass.
function createJazz(ctx: AudioContext, out: GainNode) {
  const osc = ctx.createOscillator()
  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  const mainGain = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  const reverbGain = ctx.createGain()
  const bell = ctx.createOscillator()
  const bellGain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.value = 110
  filter.type = 'lowpass'
  filter.frequency.value = 700
  filter.Q.value = 4
  mainGain.gain.value = 0.06
  reverbGain.gain.value = 0.04

  lfo.frequency.value = 0.18
  lfoGain.gain.value = 22
  lfo.connect(lfoGain).connect(osc.frequency)

  bell.type = 'triangle'
  bell.frequency.value = 660
  bellGain.gain.value = 0.0

  osc.connect(filter).connect(mainGain).connect(out)
  bell.connect(bellGain).connect(out)

  osc.start()
  lfo.start()
  bell.start()

  // Slow chord arpeggio: I — vi — IV — V over 16s
  const chord: number[] = [220, 262, 196, 247]
  let i = 0
  const tick = setInterval(() => {
    osc.frequency.setTargetAtTime(chord[i % chord.length] / 2, ctx.currentTime, 1.4)
    bell.frequency.setTargetAtTime(chord[i % chord.length] * 2, ctx.currentTime, 0.6)
    bellGain.gain.cancelScheduledValues(ctx.currentTime)
    bellGain.gain.setValueAtTime(0.0, ctx.currentTime)
    bellGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.4)
    bellGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.5)
    i++
  }, 4000)

  return () => {
    clearInterval(tick)
    try {
      osc.stop()
      lfo.stop()
      bell.stop()
    } catch {}
    osc.disconnect()
    lfo.disconnect()
    bell.disconnect()
    filter.disconnect()
    mainGain.disconnect()
    reverbGain.disconnect()
    bellGain.disconnect()
  }
}

function createRain(ctx: AudioContext, out: GainNode) {
  const bufferSize = 2 * ctx.sampleRate
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  let lastOut = 0
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    lastOut = (lastOut + 0.02 * white) / 1.02
    data[i] = lastOut * 2.8
  }
  const noise = ctx.createBufferSource()
  noise.buffer = noiseBuffer
  noise.loop = true

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1200
  filter.Q.value = 0.4
  const gain = ctx.createGain()
  gain.gain.value = 0.18

  noise.connect(filter).connect(gain).connect(out)
  noise.start()

  // Slow LFO on filter for rolling rain feel
  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  lfo.frequency.value = 0.08
  lfoGain.gain.value = 350
  lfo.connect(lfoGain).connect(filter.frequency)
  lfo.start()

  return () => {
    try {
      noise.stop()
      lfo.stop()
    } catch {}
    noise.disconnect()
    lfo.disconnect()
    lfoGain.disconnect()
    gain.disconnect()
    filter.disconnect()
  }
}

export function AmbientSound() {
  const [open, setOpen] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [track, setTrack] = useState<Track>('jazz')
  const [volume, setVolume] = useState(0.5)
  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const stopRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!enabled) {
      stopRef.current?.()
      stopRef.current = null
      ctxRef.current?.suspend().catch(() => {})
      return
    }
    if (!ctxRef.current) {
      const Ctor =
        typeof window !== 'undefined'
          ? (window.AudioContext || (window as any).webkitAudioContext)
          : null
      if (!Ctor) return
      ctxRef.current = new Ctor()
      masterRef.current = ctxRef.current.createGain()
      masterRef.current.gain.value = volume
      masterRef.current.connect(ctxRef.current.destination)
    }
    const ctx = ctxRef.current!
    const master = masterRef.current!
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    stopRef.current?.()
    stopRef.current = track === 'jazz' ? createJazz(ctx, master) : createRain(ctx, master)
    return () => {
      stopRef.current?.()
      stopRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, track])

  useEffect(() => {
    if (masterRef.current) masterRef.current.gain.value = volume
  }, [volume])

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div
        className={cn(
          'transition-all surface-card rounded-2xl backdrop-blur-xl',
          open ? 'p-4 w-72' : 'p-2 w-12 h-12 flex items-center justify-center',
        )}
      >
        {open ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Ambient
              </span>
              <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Toggle ambient sound" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTrack('jazz')}
                className={cn(
                  'flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs',
                  track === 'jazz'
                    ? 'border-[var(--candle)] text-[var(--candle)] glow-candle-soft'
                    : 'border-white/10 text-[var(--muted-foreground)]',
                )}
              >
                <Coffee className="h-3.5 w-3.5" /> Jazz Café
              </button>
              <button
                onClick={() => setTrack('rain')}
                className={cn(
                  'flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs',
                  track === 'rain'
                    ? 'border-[var(--candle)] text-[var(--candle)] glow-candle-soft'
                    : 'border-white/10 text-[var(--muted-foreground)]',
                )}
              >
                <CloudRain className="h-3.5 w-3.5" /> Soft Rain
              </button>
            </div>
            <div className="flex items-center gap-2">
              {volume === 0 ? (
                <VolumeX className="h-3.5 w-3.5 text-[var(--muted)]" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 text-[var(--muted)]" />
              )}
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 accent-[var(--candle)]"
              />
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-full text-[10px] uppercase tracking-widest text-[var(--muted)] hover:text-[var(--candle)]"
            >
              Hide
            </button>
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="text-[var(--candle)] hover:text-[var(--candle-soft)]"
            aria-label="Open ambient sound controls"
          >
            <Music2 className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}
