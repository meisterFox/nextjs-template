import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Candle } from '@/components/atmospheric/candle'

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <Candle size="lg" />
      <h1 className="mt-8 font-serif text-5xl text-gradient-candle">The candle is out.</h1>
      <p className="mt-4 max-w-md text-[var(--muted-foreground)]">
        We couldn&apos;t find that table. Perhaps it was never reserved, or the night ended early.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Return to the lounge</Link>
      </Button>
    </div>
  )
}
