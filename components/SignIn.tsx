'use client'

import { Button } from '@/components/ui/Button'
import { truncateAddress } from '@/lib/truncateAddress'
import { useAuthAccount } from '@/lib/useAuthAccount'
import ViewWalletsModal from './ViewWalletsModal'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignInWithEthereum() {
  const { connect, disconnect, isAuthenticated, walletAddress } = useAuthAccount()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isWalletsModalOpen, setIsWalletsModalOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const handleEditProfile = () => {
    router.push('/profile')
    setIsDropdownOpen(false)
  }

  const handleViewWallets = () => {
    setIsWalletsModalOpen(true)
    setIsDropdownOpen(false)
  }

  const handleDisconnect = () => {
    disconnect()
    setIsDropdownOpen(false)
  }

  return (
    <>
      <div className="flex items-stretch justify-stretch relative" ref={dropdownRef}>
        {isAuthenticated && walletAddress ? (
          <>
            <Button onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              {truncateAddress(walletAddress)}
            </Button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {walletAddress[2]}
                    </div>
                    <span className="text-white font-mono text-sm">{truncateAddress(walletAddress)}</span>
                  </div>
                  <div className="text-xs text-slate-400">YOUR BALANCE</div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={handleEditProfile}
                    className="w-full px-4 py-3 text-left text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-3"
                  >
                    <span className="text-lg">✏️</span>
                    <span>Edit Profile</span>
                    <span className="ml-auto text-slate-500">→</span>
                  </button>

                  <button
                    onClick={handleViewWallets}
                    className="w-full px-4 py-3 text-left text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-3"
                  >
                    <span className="text-lg">👛</span>
                    <span>View Wallets</span>
                    <span className="ml-auto text-slate-500">→</span>
                  </button>

                  <button
                    onClick={handleDisconnect}
                    className="w-full px-4 py-3 text-left text-red-400 hover:bg-slate-800 transition-colors flex items-center gap-3 border-t border-slate-700"
                  >
                    <span className="text-lg">🚪</span>
                    <span>Disconnect</span>
                    <span className="ml-auto text-slate-500">→</span>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <Button onClick={connect}>Sign In</Button>
        )}
      </div>

      {/* View Wallets Modal */}
      <ViewWalletsModal 
        isOpen={isWalletsModalOpen} 
        onClose={() => setIsWalletsModalOpen(false)} 
      />
    </>
  )
}
