import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Flame, Eye, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Silhouette } from '@/components/atmospheric/silhouette'
import { formatTimeAgo } from '@/lib/utils'
import type { RevealLevel } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ChatsListPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: matches } = await supabase
    .from('matches')
    .select('id, user_a, user_b, reveal_level, message_count, last_message_at, created_at')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  const peerIds = (matches ?? []).map((m) =>
    m.user_a === user.id ? m.user_b : m.user_a,
  )
  const { data: peers } = peerIds.length
    ? await supabase
        .from('profiles')
        .select('id, vibe_title, display_name, bio_short')
        .in('id', peerIds)
    : { data: [] as any[] }

  const peerMap = new Map((peers ?? []).map((p) => [p.id, p]))

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-serif text-4xl text-gradient-candle">Your tables</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Conversations you&apos;ve started, ordered by recency.
      </p>

      <ul className="mt-8 space-y-3">
        {(matches ?? []).map((m) => {
          const peerId = m.user_a === user.id ? m.user_b : m.user_a
          const peer = peerMap.get(peerId)
          const level = m.reveal_level as RevealLevel
          return (
            <li key={m.id}>
              <Link
                href={`/chat/${m.id}`}
                className="surface-card rounded-2xl p-4 flex items-center gap-4 hover:border-[var(--candle)]/40 transition"
              >
                <Silhouette level={level} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-serif text-lg truncate">
                      {level === 'revealed' && peer?.display_name
                        ? peer.display_name
                        : peer?.vibe_title ?? 'Unknown soul'}
                    </p>
                    <RevealBadge level={level} />
                  </div>
                  {peer?.bio_short && (
                    <p className="text-xs text-[var(--muted-foreground)] italic truncate mt-0.5">
                      {peer.bio_short}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--muted)]">
                    {m.last_message_at
                      ? formatTimeAgo(m.last_message_at)
                      : 'Not yet whispered'}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--candle)] mt-1">
                    {m.message_count} {m.message_count === 1 ? 'msg' : 'msgs'}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
        {!matches?.length && (
          <li className="surface-card rounded-2xl p-10 text-center">
            <MessageCircle className="mx-auto h-5 w-5 text-[var(--candle)]" />
            <p className="mt-3 text-[var(--muted-foreground)]">
              No tables yet. Walk into the lounge and pick a silhouette.
            </p>
          </li>
        )}
      </ul>
    </div>
  )
}

function RevealBadge({ level }: { level: RevealLevel }) {
  if (level === 'revealed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--candle)]/10 border border-[var(--candle)]/30 text-[var(--candle)] text-[10px] px-2 py-0.5">
        <Flame className="h-3 w-3" /> Revealed
      </span>
    )
  }
  if (level === 'outline') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 text-[var(--muted-foreground)] text-[10px] px-2 py-0.5">
        <Eye className="h-3 w-3" /> Outline
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 text-[var(--muted-foreground)] text-[10px] px-2 py-0.5">
      Whisper
    </span>
  )
}
