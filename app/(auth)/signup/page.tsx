'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo:
          typeof window !== 'undefined' ? `${window.location.origin}/onboarding` : undefined,
      },
    })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    if (data.session) {
      router.push('/onboarding')
      router.refresh()
    } else {
      setInfo('Check your email for the confirmation link to enter the lounge.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reserve a table</CardTitle>
        <CardDescription>You will not need a photo to enter.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display">A name you go by</Label>
            <Input
              id="display"
              required
              minLength={2}
              maxLength={32}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Sera"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@somewhere.lounge"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          {error && (
            <p className="text-xs text-red-300/90 border border-red-900/50 bg-red-950/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          {info && (
            <p className="text-xs text-[var(--candle)] border border-[var(--candle)]/30 bg-[var(--candle)]/5 rounded-md px-3 py-2">
              {info}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? 'Reserving…' : 'Reserve & begin Soul-Sync'}
          </Button>
          <p className="text-center text-xs text-[var(--muted-foreground)]">
            Already have a seat?{' '}
            <Link href="/login" className="text-[var(--candle)] hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
