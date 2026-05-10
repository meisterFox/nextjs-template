import type { Metadata } from 'next'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import { AmbientSound } from '@/components/atmospheric/ambient-sound'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans-loaded' })
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-serif-loaded',
})

export const metadata: Metadata = {
  title: 'Luminescence — meet souls before faces',
  description:
    'A blind dating app for people who are tired of swipes. Match by values, talk in the dark, and choose when — if ever — to light the candle.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Luminescence',
    description:
      'A blind dating app where minds meet before faces. Reveal yourself only when both candles are lit.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="antialiased">
        <div className="relative z-10 min-h-screen flex flex-col">{children}</div>
        <AmbientSound />
      </body>
    </html>
  )
}
