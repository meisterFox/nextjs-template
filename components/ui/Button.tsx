'use client'

import { useSound } from '@/lib/useSound'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gradient' | 'glass'
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
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

  const baseStyles = 'px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
  const variantStyles = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white',
    secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white',
    gradient: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white',
    glass: 'backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white',
  }

  return (
    <button
      className={`cursor-pointer ${baseStyles} ${variantStyles[variant]} ${className} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}
