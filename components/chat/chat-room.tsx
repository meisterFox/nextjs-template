'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Flame, Send, Eye, Lock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Silhouette } from '@/components/atmospheric/silhouette'
import { Candle } from '@/components/atmospheric/candle'
import { DimRoom } from '@/components/atmospheric/dim-room'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { OUTLINE_THRESHOLD, deriveRevealLevel, nextRevealCheckpoint } from '@/lib/reveal'
import type { Match, Message, PublicProfile, RevealLevel } from '@/lib/types'
import { formatTimeAgo } from '@/lib/utils'

export function ChatRoom({
  match: initialMatch,
  meId,
  peer,
  peerHasLockedPhotos,
  myCandle: initialMyCandle,
  peerCandle: initialPeerCandle,
  initialMessages,
}: {
  match: Match
  meId: string
  peer: PublicProfile
  peerHasLockedPhotos: boolean
  myCandle: boolean
  peerCandle: boolean
  initialMessages: Message[]
}) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [match, setMatch] = useState<Match>(initialMatch)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [myCandle, setMyCandle] = useState(initialMyCandle)
  const [peerCandle, setPeerCandle] = useState(initialPeerCandle)
  const [revealOpen, setRevealOpen] = useState(false)
  const [showJustRevealed, setShowJustRevealed] = useState(false)
  const lastLevel = useRef<RevealLevel>(deriveRevealLevel(initialMatch))

  const level: RevealLevel = useMemo(() => {
    return deriveRevealLevel({
      message_count: match.message_count,
      candle_lit_by_a: myFirst(match, meId) ? myCandle : peerCandle,
      candle_lit_by_b: myFirst(match, meId) ? peerCandle : myCandle,
    })
  }, [match.message_count, myCandle, peerCandle, match, meId])

  const checkpoint = useMemo(
    () =>
      nextRevealCheckpoint({
        message_count: match.message_count,
        candle_lit_by_a: myFirst(match, meId) ? myCandle : peerCandle,
        candle_lit_by_b: myFirst(match, meId) ? peerCandle : myCandle,
      }),
    [match.message_count, myCandle, peerCandle, match, meId],
  )

  // Subscribe to new messages + match updates.
  useEffect(() => {
    const channel = supabase
      .channel(`match-${match.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${match.id}` },
        (payload) => {
          const m = payload.new as Message
          setMessages((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]))
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${match.id}` },
        (payload) => {
          const updated = payload.new as Match
          setMatch(updated)
          setMyCandle(myFirst(updated, meId) ? updated.candle_lit_by_a : updated.candle_lit_by_b)
          setPeerCandle(myFirst(updated, meId) ? updated.candle_lit_by_b : updated.candle_lit_by_a)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [match.id, meId, supabase])

  // Show the reveal celebration when we transition.
  useEffect(() => {
    if (level !== lastLevel.current) {
      if (level === 'revealed') {
        setShowJustRevealed(true)
        // refresh server to pick up newly visible peer photos
        setTimeout(() => router.refresh(), 1500)
      }
      lastLevel.current = level
    }
  }, [level, router])

  async function send() {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    const { error } = await supabase
      .from('messages')
      .insert({ match_id: match.id, sender: meId, body })
    setSending(false)
    if (error) {
      alert(error.message)
      return
    }
    setDraft('')
  }

  async function lightCandle() {
    const { error } = await supabase.rpc('light_candle', { match_id: match.id })
    if (error) {
      alert(error.message)
      return
    }
    setMyCandle(true)
    setRevealOpen(false)
  }

  const progressPct = Math.min(100, (match.message_count / OUTLINE_THRESHOLD) * 100)

  return (
    <DimRoom className="flex-1 flex flex-col">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/lounge/chats" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Silhouette
            level={level}
            size="sm"
            photoUrl={level === 'revealed' && peer.photos?.[0] ? peer.photos[0] : undefined}
            alt={peer.display_name ?? peer.vibe_title}
          />
          <div className="flex-1 min-w-0">
            <p className="font-serif text-lg leading-tight truncate">
              {level === 'revealed' && peer.display_name ? peer.display_name : peer.vibe_title}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-2 truncate">
              {level === 'whisper' && (
                <>
                  <span className="opacity-70">Whisper phase</span>
                </>
              )}
              {level === 'outline' && (
                <>
                  <Eye className="h-3 w-3 text-[var(--candle)]" />
                  Outline visible
                </>
              )}
              {level === 'revealed' && (
                <>
                  <Flame className="h-3 w-3 text-[var(--candle)]" />
                  Both candles lit
                </>
              )}
              {peer.age && level !== 'whisper' && <span>· {peer.age}</span>}
              {peer.city && level !== 'whisper' && <span>· {peer.city}</span>}
            </p>
          </div>

          <RevealButton
            level={level}
            myCandle={myCandle}
            peerCandle={peerCandle}
            messageCount={match.message_count}
            peerHasLockedPhotos={peerHasLockedPhotos}
            open={revealOpen}
            onOpenChange={setRevealOpen}
            onLight={lightCandle}
          />
        </div>
        <div className="max-w-4xl mx-auto px-6 pb-3">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] mb-1.5">
            <span>{checkpoint.label}</span>
            <span>
              {checkpoint.remaining} {checkpoint.unit}
            </span>
          </div>
          <Progress
            value={
              level === 'revealed'
                ? 100
                : level === 'outline'
                  ? 100
                  : progressPct
            }
          />
        </div>
      </header>

      <SharedContext peer={peer} level={level} />

      <MessageStream messages={messages} meId={meId} level={level} />

      <AnimatePresence>
        {showJustRevealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={() => setShowJustRevealed(false)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 30 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="surface-card rounded-3xl px-10 py-12 text-center glow-candle"
            >
              <Candle size="lg" />
              <h2 className="font-serif text-3xl text-gradient-candle mt-6">The candle is lit.</h2>
              <p className="text-[var(--muted-foreground)] mt-2 max-w-sm">
                You can now see each other clearly — and only each other.
              </p>
              <Button className="mt-6" onClick={() => setShowJustRevealed(false)}>
                Continue
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="border-t border-[var(--border)] bg-black/30 backdrop-blur">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
          className="max-w-4xl mx-auto px-6 py-4 flex gap-3 items-end"
        >
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder={
              level === 'whisper' ? 'Speak softly. They can only hear your words…' : 'Write…'
            }
            className="flex-1 min-h-[44px] max-h-40"
          />
          <Button type="submit" disabled={sending || !draft.trim()}>
            <Send className="h-4 w-4" /> Send
          </Button>
        </form>
      </footer>
    </DimRoom>
  )
}

function myFirst(m: Match, meId: string) {
  return m.user_a === meId
}

function MessageStream({
  messages,
  meId,
  level,
}: {
  messages: Message[]
  meId: string
  level: RevealLevel
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])
  return (
    <div ref={ref} className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-16 text-sm text-[var(--muted-foreground)] italic">
            The candle is on the table. Whoever speaks first sets the room.
          </div>
        )}
        {messages.map((m) => {
          const mine = m.sender === meId
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  mine
                    ? 'bg-[var(--candle)]/15 border border-[var(--candle)]/25 text-[var(--foreground)]'
                    : 'bg-white/5 border border-white/10 text-[var(--foreground)]'
                } ${level === 'whisper' && !mine ? 'whisper-text' : ''}`}
              >
                {m.body}
                <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--muted)]/70 text-right">
                  {formatTimeAgo(m.created_at)}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function RevealButton({
  level,
  myCandle,
  peerCandle,
  messageCount,
  peerHasLockedPhotos,
  open,
  onOpenChange,
  onLight,
}: {
  level: RevealLevel
  myCandle: boolean
  peerCandle: boolean
  messageCount: number
  peerHasLockedPhotos: boolean
  open: boolean
  onOpenChange: (v: boolean) => void
  onLight: () => void
}) {
  const canLight = messageCount >= OUTLINE_THRESHOLD && !myCandle
  const label = myCandle && peerCandle ? 'Revealed' : myCandle ? 'Waiting on them' : 'Light the candle'
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={canLight ? 'candle' : 'whisper'}
          size="sm"
          disabled={!canLight && !myCandle}
        >
          {level === 'revealed' ? <Flame className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{label}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="flex justify-center mb-3">
            <Candle size="lg" />
          </div>
          <DialogTitle className="text-center">Light the candle?</DialogTitle>
          <DialogDescription className="text-center">
            If you light yours, your locked photos and identity will be revealed to them — but only
            once they light theirs back.
          </DialogDescription>
        </DialogHeader>

        <ul className="text-sm text-[var(--muted-foreground)] space-y-2 mt-4">
          <li className="flex justify-between">
            <span>You</span>
            <span className={myCandle ? 'text-[var(--candle)]' : ''}>
              {myCandle ? '🕯️ Lit' : 'Unlit'}
            </span>
          </li>
          <li className="flex justify-between">
            <span>Them</span>
            <span className={peerCandle ? 'text-[var(--candle)]' : ''}>
              {peerCandle ? '🕯️ Lit' : 'Unlit'}
            </span>
          </li>
          <li className="flex justify-between text-xs">
            <span>Their photos on file</span>
            <span>{peerHasLockedPhotos ? 'Yes (locked)' : 'None'}</span>
          </li>
        </ul>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Not yet
          </Button>
          <Button onClick={onLight} disabled={myCandle}>
            <Flame className="h-4 w-4" /> Light it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SharedContext({ peer, level }: { peer: PublicProfile; level: RevealLevel }) {
  const hasShared = peer.values.length > 0 || peer.interests.length > 0
  if (!hasShared) return null
  return (
    <div className="border-b border-[var(--border)] bg-black/20">
      <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-3 overflow-x-auto">
        {peer.bio_short && (
          <span className="text-xs italic text-[var(--muted-foreground)] whitespace-nowrap">
            &ldquo;{peer.bio_short}&rdquo;
          </span>
        )}
        {peer.values.slice(0, 3).map((v) => (
          <Badge key={v} variant="candle">
            {v}
          </Badge>
        ))}
        {peer.interests.slice(0, 4).map((v) => (
          <Badge key={v} variant="muted">
            {v}
          </Badge>
        ))}
        {level !== 'whisper' && peer.height_cm && (
          <Badge variant="muted">{peer.height_cm} cm</Badge>
        )}
      </div>
    </div>
  )
}
