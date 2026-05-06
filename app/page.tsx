import Link from 'next/link'
import { Flame, Eye, MessagesSquare, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Candle } from '@/components/atmospheric/candle'
import { DimRoom } from '@/components/atmospheric/dim-room'
import { Silhouette } from '@/components/atmospheric/silhouette'

export default function LandingPage() {
  return (
    <DimRoom className="flex-1">
      <header className="px-6 py-6 flex items-center justify-between max-w-6xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <Candle size="sm" />
          <span className="font-serif text-xl tracking-wide text-[var(--foreground)]">
            Luminescence
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-[var(--muted-foreground)] hover:text-[var(--candle)] transition"
          >
            Sign in
          </Link>
          <Button asChild size="sm">
            <Link href="/signup">Reserve a table</Link>
          </Button>
        </nav>
      </header>

      <section className="px-6 pt-16 pb-24 max-w-5xl mx-auto text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--candle)]/20 bg-[var(--candle)]/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[var(--candle)]">
          <Sparkles className="h-3 w-3" /> A new kind of dating
        </span>
        <h1 className="mt-6 font-serif text-5xl sm:text-7xl leading-[1.05] text-gradient-candle">
          Meet the soul,
          <br />
          before the face.
        </h1>
        <p className="mt-6 text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto leading-relaxed">
          Every other dating app is built on the first swipe. Luminescence is built on the first
          conversation. No photos. No height filters. Just two voices at a dimly lit table — and a
          candle you can choose to light, together.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/signup">
              <Flame className="h-4 w-4" /> Begin in the dark
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="#how">How it works</Link>
          </Button>
        </div>

        <div className="mt-20 flex items-end justify-center gap-10 opacity-90">
          <Silhouette level="whisper" size="md" />
          <div className="pb-6">
            <Candle size="lg" />
          </div>
          <Silhouette level="outline" size="md" />
        </div>
      </section>

      <section id="how" className="px-6 pb-24 max-w-5xl mx-auto">
        <h2 className="font-serif text-3xl text-center text-[var(--foreground)]">
          Three phases. One quiet door.
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: MessagesSquare,
              title: 'The Whisper',
              body:
                'Pure text. No name, no age, no city. Only a vibe — "The Jazz Enthusiast" — and what they choose to say.',
            },
            {
              icon: Eye,
              title: 'The Outline',
              body:
                'After fifty messages a soft silhouette appears. You see the shape of someone, not the surface.',
            },
            {
              icon: Flame,
              title: 'The Reveal',
              body:
                'Both must light the candle. Only then do photos and full identity unfold — and only between the two of you.',
            },
          ].map((s, i) => (
            <div key={i} className="surface-card rounded-2xl p-6">
              <s.icon className="h-5 w-5 text-[var(--candle)]" />
              <h3 className="mt-4 font-serif text-xl text-[var(--foreground)]">{s.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-32 max-w-3xl mx-auto text-center">
        <p className="font-serif text-2xl text-[var(--muted-foreground)] italic leading-relaxed">
          &ldquo;Loş ışıktaki bir masada iki taraf da kendini görmeyecek şekilde. Karşısındaki ile ilgili
          hiçbir fiziksel özelliği — kendi reveal etmedikçe — göremeyecek.&rdquo;
        </p>
        <p className="mt-4 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
          The Luminescence philosophy
        </p>
      </section>

      <footer className="border-t border-[var(--border)] px-6 py-6 text-center text-xs text-[var(--muted)]">
        © {new Date().getFullYear()} Luminescence — built quietly, by candlelight.
      </footer>
    </DimRoom>
  )
}
