'use client'

import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 animate-fadeIn">
        {/* 404 Number */}
        <div className="text-[150px] font-black text-gradient-purple leading-none mb-4 animate-float">
          404
        </div>

        {/* Emoji */}
        <div className="text-6xl mb-6">🔍</div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-2">Page Not Found</h1>
        
        {/* Subtitle */}
        <p className="text-slate-400 mb-8 max-w-md">
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Button */}
        <Button
          variant="gradient"
          size="lg"
          glow
          onClick={() => router.push('/')}
        >
          ← Back to Home
        </Button>
      </div>
    </div>
  )
}
