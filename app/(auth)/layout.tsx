import Link from 'next/link'
import { Candle } from '@/components/atmospheric/candle'
import { DimRoom } from '@/components/atmospheric/dim-room'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <DimRoom className="flex-1 flex flex-col">
      <header className="px-6 py-6 max-w-6xl mx-auto w-full">
        <Link href="/" className="inline-flex items-center gap-2">
          <Candle size="sm" />
          <span className="font-serif text-xl tracking-wide">Luminescence</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </DimRoom>
  )
}
