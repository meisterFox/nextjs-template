import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Lock, Pencil, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Silhouette } from '@/components/atmospheric/silhouette'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/onboarding')

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center gap-6">
        <Silhouette level="revealed" size="lg" />
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            Your vibe
          </p>
          <h1 className="font-serif text-4xl text-gradient-candle">{profile.vibe_title}</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            {profile.display_name} · {profile.age} · {profile.city}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/lounge/profile/edit">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Link>
        </Button>
      </div>

      <Section title="Public — what others see right away">
        {profile.bio_short ? (
          <p className="italic text-[var(--muted-foreground)]">&ldquo;{profile.bio_short}&rdquo;</p>
        ) : (
          <p className="text-sm text-[var(--muted)]">No bio set.</p>
        )}
      </Section>

      <Section title="Values" icon={<Sparkles className="h-3.5 w-3.5" />}>
        <div className="flex flex-wrap gap-2">
          {(profile.values as string[]).map((v: string) => (
            <Badge key={v} variant="candle">
              {v}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Interests" icon={<Sparkles className="h-3.5 w-3.5" />}>
        <div className="flex flex-wrap gap-2">
          {(profile.interests as string[]).map((v: string) => (
            <Badge key={v} variant="muted">
              {v}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Locked details (only revealed mutually)" icon={<Lock className="h-3.5 w-3.5" />}>
        <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <Row k="Hair" v={profile.hair_color} />
          <Row k="Eyes" v={profile.eye_color} />
          <Row k="Height" v={profile.height_cm ? `${profile.height_cm} cm` : null} />
          <Row k="Body" v={profile.body_type} />
          <Row k="Love language" v={profile.love_language} />
          <Row k="Photos" v={profile.photos.length ? `${profile.photos.length} locked` : null} />
        </dl>
      </Section>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-10 surface-card rounded-2xl p-6">
      <h2 className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)] flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Row({ k, v }: { k: string; v: string | null }) {
  return (
    <>
      <dt className="text-[var(--muted)]">{k}</dt>
      <dd className="text-[var(--foreground)]">{v ?? '—'}</dd>
    </>
  )
}
