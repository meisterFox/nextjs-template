import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { rankCandidates } from '@/lib/matchmaker'
import { DimTable } from '@/components/lounge/dim-table'
import type { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function LoungePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: self } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!self) redirect('/onboarding')

  const { data: pool } = await supabase
    .from('profiles')
    .select(
      'id, display_name, vibe_title, age, gender, seeking, city, bio_short, values, interests, personality, love_language, hair_color, eye_color, height_cm, body_type, ethnicity, photos, onboarding_complete, created_at, updated_at',
    )
    .eq('onboarding_complete', true)
    .neq('id', user.id)
    .limit(48)

  // Already-engaged matches (any reveal level) so we can flag who is at the table.
  const { data: existingMatches } = await supabase
    .from('matches')
    .select('id, user_a, user_b')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)

  const knownIds = new Set<string>()
  const matchByPeer = new Map<string, string>()
  ;(existingMatches ?? []).forEach((m) => {
    const peer = m.user_a === user.id ? m.user_b : m.user_a
    knownIds.add(peer)
    matchByPeer.set(peer, m.id)
  })

  const ranked = rankCandidates(self as Profile, (pool ?? []) as Profile[]).slice(0, 12)

  return (
    <DimTable
      candidates={ranked.map((c) => ({
        id: c.profile.id,
        vibe_title: c.profile.vibe_title || 'A Quiet Presence',
        bio_short: c.profile.bio_short,
        shared_values: c.shared_values,
        shared_interests: c.shared_interests,
        score: c.score,
        existing_match_id: matchByPeer.get(c.profile.id) ?? null,
      }))}
    />
  )
}
