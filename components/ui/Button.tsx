'use client'

import { useSound } from '@/lib/useSound'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'gradient'
    | 'glass'
    | 'neon'
    | 'neon-cyan'
    | 'neon-pink'
    | 'outline'
    | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  glow?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  glow = false,
  className = '',
  children,
  onClick,
  ...props
}) => {
  const { playClickSound } = useSound()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playClickSound()
    onClick?.(e)
  }

  const baseStyles =
    'relative overflow-hidden rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 inline-flex items-center justify-center gap-2'

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40',
    secondary:
      'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white border border-slate-600/50',
    gradient:
      'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-400 hover:via-purple-400 hover:to-cyan-400 text-white shadow-lg shadow-purple-500/25',
    glass: 'glass-card hover:bg-white/15 text-white',
    neon: 'bg-violet-600/20 border-2 border-violet-500 text-violet-300 hover:bg-violet-600/40 hover:text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:shadow-[0_0_25px_rgba(139,92,246,0.8)]',
    'neon-cyan':
      'bg-cyan-600/20 border-2 border-cyan-500 text-cyan-300 hover:bg-cyan-600/40 hover:text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_25px_rgba(6,182,212,0.8)]',
    'neon-pink':
      'bg-fuchsia-600/20 border-2 border-fuchsia-500 text-fuchsia-300 hover:bg-fuchsia-600/40 hover:text-white shadow-[0_0_15px_rgba(217,70,239,0.5)] hover:shadow-[0_0_25px_rgba(217,70,239,0.8)]',
    outline:
      'border-2 border-violet-500/50 text-violet-300 hover:bg-violet-500/20 hover:border-violet-400',
    ghost: 'text-slate-300 hover:bg-white/10 hover:text-white',
  }

  const glowClass = glow ? 'animate-pulse-glow' : ''

  return (
    <button
      className={`cursor-pointer ${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${glowClass} ${className} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none`}
      onClick={handleClick}
      {...props}
    >
      {/* Shimmer effect for gradient buttons */}
      {(variant === 'gradient' || variant === 'primary') && (
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  )
}
