'use client'

import SignIn from '@/components/SignIn'
import { routes } from '@/lib/routes'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const Navigation = () => {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-black/30 border-b border-white/10 shadow-2xl">
      <div className="h-20 flex gap-6 flex-wrap items-center justify-start px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="flex flex-row gap-4 w-full items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative">
              <Image src="/logo.svg" alt="Logo" width={140} height={50} className="brightness-0 invert group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
            </div>
          </Link>
          
          <nav className="flex flex-row gap-2 items-center justify-end">
            {routes.map((r) => {
              const isActive = pathname === r.path
              return (
                <Link
                  key={r.path}
                  className={`relative px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                  href={r.path}
                >
                  {r.name}
                  {isActive && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  )}
                </Link>
              )
            })}
            <SignIn />
          </nav>
        </div>
      </div>
    </header>
  )
}
