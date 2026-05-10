import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatRoom } from '@/components/chat/chat-room'
import { project, deriveRevealLevel } from '@/lib/reveal'
import { signedUrls } from '@/lib/storage'
import type { Match, Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>
}) {
  const { matchId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/chat/${matchId}`)

  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .maybeSingle()
  if (!match) notFound()
  if (match.user_a !== user.id && match.user_b !== user.id) notFound()

  const peerId = match.user_a === user.id ? match.user_b : match.user_a
  const { data: peer } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', peerId)
    .single()
  if (!peer) notFound()

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })
    .limit(500)

  const level = deriveRevealLevel(match as Match)
  const peerView = project(peer as Profile, level)

  // Only resolve signed URLs after mutual reveal — Storage RLS will refuse
  // earlier anyway, but we belt-and-suspenders it here too.
  if (level === 'revealed' && peer.photos?.length) {
    peerView.photos = await signedUrls(supabase, peer.photos as string[])
  } else {
    peerView.photos = []
  }

  const myCandle =
    match.user_a === user.id ? match.candle_lit_by_a : match.candle_lit_by_b
  const peerCandle =
    match.user_a === user.id ? match.candle_lit_by_b : match.candle_lit_by_a

  return (
    <ChatRoom
      match={match as Match}
      meId={user.id}
      peer={peerView}
      peerHasLockedPhotos={!!peer.photos?.length}
      myCandle={myCandle}
      peerCandle={peerCandle}
      initialMessages={messages ?? []}
    />
  )
}
