'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, Flame, MessageCircle, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Silhouette } from '@/components/atmospheric/silhouette'
import { createClient } from '@/lib/supabase/client'

export interface Candidate {
  id: string
  vibe_title: string
  bio_short: string | null
  shared_values: string[]
  shared_interests: string[]
  score: number
  existing_match_id: string | null
}

export function DimTable({ candidates }: { candidates: Candidate[] }) {
  const [active, setActive] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  async function approach(c: Candidate) {
    setLoading(c.id)
    const supabase = createClient()

    let matchId = c.existing_match_id
    if (!matchId) {
      const { data, error } = await supabase.rpc('create_match', {
        target: c.id,
        score: c.score,
      })
      if (error) {
        console.error(error)
        setLoading(null)
        return
      }
      matchId = (data as { id: string }).id
    }
    router.push(`/chat/${matchId}`)
  }

  if (!candidates.length) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <Sparkles className="mx-auto h-6 w-6 text-[var(--candle)]" />
        <h2 className="mt-6 font-serif text-3xl text-gradient-candle">
          The room is quiet tonight.
        </h2>
        <p className="mt-3 text-[var(--muted-foreground)]">
          As more people sit down, silhouettes will appear at the table. Come back in a little
          while.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-serif text-4xl text-gradient-candle">The Lounge</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Twelve silhouettes, ranked by what you have in common — never by what they look like.
          </p>
        </div>
      </div>

      <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {candidates.map((c, i) => (
          <motion.button
            key={c.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.6, ease: 'easeOut' }}
            onClick={() => setActive(active === c.id ? null : c.id)}
            className={`group surface-card rounded-2xl p-5 text-left transition-all ${
              active === c.id ? 'glow-candle-soft border-[var(--candle)]/40' : ''
            }`}
          >
            <div className="flex items-center justify-center pt-2 pb-4">
              <Silhouette level="whisper" size="md" className="animate-drift" />
            </div>
            <div className="text-center">
              <p className="font-serif text-lg text-[var(--foreground)]">{c.vibe_title}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--candle)] mt-1">
                {Math.round(c.score * 100)}% resonance
              </p>
              {c.bio_short && (
                <p className="text-xs text-[var(--muted-foreground)] mt-3 line-clamp-2 italic">
                  &ldquo;{c.bio_short}&rdquo;
                </p>
              )}
            </div>

            {active === c.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 space-y-3"
              >
                {c.shared_values.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] mb-1">
                      Shared values
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {c.shared_values.map((v) => (
                        <Badge key={v} variant="candle">
                          {v}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {c.shared_interests.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] mb-1">
                      Shared interests
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {c.shared_interests.map((v) => (
                        <Badge key={v} variant="muted">
                          {v}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <Button
                  size="sm"
                  className="w-full mt-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    approach(c)
                  }}
                  disabled={loading === c.id}
                >
                  {loading === c.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : c.existing_match_id ? (
                    <MessageCircle className="h-3.5 w-3.5" />
                  ) : (
                    <Flame className="h-3.5 w-3.5" />
                  )}
                  {c.existing_match_id ? 'Return to the table' : 'Sit down together'}
                </Button>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
