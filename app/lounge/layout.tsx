import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LogOut, Users, User } from 'lucide-react'
import { Candle } from '@/components/atmospheric/candle'
import { DimRoom } from '@/components/atmospheric/dim-room'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from '@/components/lounge/sign-out-button'

export const dynamic = 'force-dynamic'

export default async function LoungeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, vibe_title, onboarding_complete')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.onboarding_complete) redirect('/onboarding')

  return (
    <DimRoom className="flex-1 flex flex-col">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-6">
          <Link href="/lounge" className="flex items-center gap-2">
            <Candle size="sm" />
            <span className="font-serif text-lg tracking-wide">Luminescence</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
            <Link
              href="/lounge"
              className="px-3 py-1.5 rounded-full hover:text-[var(--candle)] hover:bg-white/5 inline-flex items-center gap-1.5"
            >
              <Users className="h-3.5 w-3.5" /> Lounge
            </Link>
            <Link
              href="/lounge/chats"
              className="px-3 py-1.5 rounded-full hover:text-[var(--candle)] hover:bg-white/5"
            >
              Chats
            </Link>
            <Link
              href="/lounge/profile"
              className="px-3 py-1.5 rounded-full hover:text-[var(--candle)] hover:bg-white/5 inline-flex items-center gap-1.5"
            >
              <User className="h-3.5 w-3.5" /> {profile.vibe_title ?? 'You'}
            </Link>
            <SignOutButton>
              <LogOut className="h-3.5 w-3.5" />
            </SignOutButton>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </DimRoom>
  )
}
