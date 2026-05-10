import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { rankCandidates } from '@/lib/matchmaker'
import { DimTable } from '@/components/lounge/dim-table'
import type { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function LoungePage({
  searchParams,
}: {
  searchParams: Promise<{ skip?: string }>
}) {
  const { skip } = await searchParams
  const skipIds = skip
    ? skip
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : []
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

  // Bidirectional block list — both who I blocked and who blocked me are hidden.
  const { data: blockRows } = await supabase
    .from('blocks')
    .select('blocker, blocked')
    .or(`blocker.eq.${user.id},blocked.eq.${user.id}`)

  const blockedIds = new Set<string>()
  ;(blockRows ?? []).forEach((b) => {
    blockedIds.add(b.blocker === user.id ? b.blocked : b.blocker)
  })

  const { data: pool } = await supabase
    .from('profiles')
    .select(
      'id, display_name, vibe_title, age, gender, seeking, city, bio_short, values, interests, personality, love_language, hair_color, eye_color, height_cm, body_type, ethnicity, photos, onboarding_complete, created_at, updated_at',
    )
    .eq('onboarding_complete', true)
    .neq('id', user.id)
    .limit(96)

  // Already-engaged matches (any reveal level) so we can flag who is at the table.
  const { data: existingMatches } = await supabase
    .from('matches')
    .select('id, user_a, user_b')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)

  const matchByPeer = new Map<string, string>()
  ;(existingMatches ?? []).forEach((m) => {
    const peer = m.user_a === user.id ? m.user_b : m.user_a
    matchByPeer.set(peer, m.id)
  })

  const skipSet = new Set(skipIds)
  const filteredPool = ((pool ?? []) as Profile[]).filter(
    (p) => !blockedIds.has(p.id) && !skipSet.has(p.id),
  )
  const ranked = rankCandidates(self as Profile, filteredPool).slice(0, 12)

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
