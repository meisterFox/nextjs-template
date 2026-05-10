import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rankCandidates } from '@/lib/matchmaker'
import type { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET /api/matchmake?limit=12
// Returns the calling user's ranked candidate list — same heuristic as the lounge
// page, exposed as JSON so it can be used by a mobile client or a Vercel Cron.
export async function GET(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '12', 10) || 12, 48)

  const { data: self } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (!self) return NextResponse.json({ error: 'No profile' }, { status: 400 })

  const { data: pool } = await supabase
    .from('profiles')
    .select('*')
    .eq('onboarding_complete', true)
    .neq('id', user.id)
    .limit(200)

  const ranked = rankCandidates(self as Profile, (pool ?? []) as Profile[])
    .slice(0, limit)
    .map((c) => ({
      id: c.profile.id,
      vibe_title: c.profile.vibe_title,
      bio_short: c.profile.bio_short,
      score: c.score,
      shared_values: c.shared_values,
      shared_interests: c.shared_interests,
    }))

  return NextResponse.json({ ranked })
}
