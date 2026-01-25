'use client'

import SignIn from '@/components/SignIn'
import { routes } from '@/lib/routes'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const Navigation = () => {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="h-20 flex gap-6 flex-wrap items-center justify-start px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="flex flex-row gap-4 w-full items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-violet-600 via-cyan-500 to-fuchsia-500 rounded-xl blur-lg opacity-0 group-hover:opacity-40 transition-all duration-500"></div>
              <Image
                src="/logo.svg"
                alt="Logo"
                width={140}
                height={50}
                className="relative brightness-0 invert group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex flex-row gap-1 items-center justify-end">
            {routes.map((r) => {
              const isActive = pathname === r.path
              return (
                <Link
                  key={r.path}
                  className={`relative px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 overflow-hidden group ${
                    isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                  }`}
                  href={r.path}
                >
                  {/* Active background */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 rounded-xl"></div>
                  )}
                  {/* Hover background */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-xl transition-all duration-300"></div>
                  {/* Text */}
                  <span className="relative z-10">{r.name}</span>
                  {/* Active glow */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl blur-xl opacity-50 -z-10"></div>
                  )}
                </Link>
              )
            })}
            <div className="ml-2 pl-2 border-l border-white/10">
              <SignIn />
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
