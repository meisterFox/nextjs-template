'use client'

import { useState } from 'react'
import { Lock, Upload, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function StepPhotos({
  userId,
  photos,
  onChange,
}: {
  userId: string
  photos: string[]
  onChange: (v: string[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('locked-photos')
      .upload(path, file, { upsert: false, cacheControl: '3600' })
    setUploading(false)
    if (upErr) {
      // Storage bucket may not exist yet — give a friendly hint.
      if (upErr.message.toLowerCase().includes('bucket')) {
        setError(
          'Create a Supabase storage bucket called "locked-photos" (private) to enable uploads.',
        )
      } else {
        setError(upErr.message)
      }
      return
    }
    onChange([...photos, path])
    e.target.value = ''
  }

  function removeAt(i: number) {
    onChange(photos.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[var(--candle)]/30 bg-[var(--candle)]/5 px-4 py-3 text-xs text-[var(--candle)] flex items-center gap-2">
        <Lock className="h-3.5 w-3.5" /> Locked Assets. No one sees these — not even silhouettes —
        until both of you light the candle.
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((p, i) => (
          <div
            key={p}
            className="relative aspect-square rounded-xl border border-white/10 surface-card flex items-center justify-center overflow-hidden"
          >
            <span className="text-[10px] text-[var(--muted-foreground)] px-3 text-center break-all">
              {p.split('/').pop()}
            </span>
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-[var(--muted-foreground)] hover:text-red-300"
              aria-label="Remove photo"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        <label className="aspect-square cursor-pointer rounded-xl border border-dashed border-[var(--candle)]/40 bg-black/20 flex flex-col items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--candle)] transition">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Upload className="h-5 w-5" />
              <span className="mt-2 text-xs">Add photo</span>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
        </label>
      </div>

      {error && (
        <p className="text-xs text-amber-300/90 border border-amber-900/40 bg-amber-950/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      <p className="text-[11px] text-[var(--muted)]">
        You can skip this step entirely and add photos later from your profile.
      </p>
    </div>
  )
}
