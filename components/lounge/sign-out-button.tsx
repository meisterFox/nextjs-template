'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  return (
    <button
      onClick={async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
      }}
      className="ml-1 px-3 py-1.5 rounded-full hover:text-[var(--candle)] hover:bg-white/5 inline-flex items-center gap-1.5"
      aria-label="Sign out"
    >
      {children}
    </button>
  )
}
