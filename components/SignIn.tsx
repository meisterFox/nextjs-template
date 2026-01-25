'use client'

import { Button } from '@/components/ui/Button'
import { truncateAddress } from '@/lib/truncateAddress'
import { useAuthAccount } from '@/lib/useAuthAccount'
import ViewWalletsModal from './ViewWalletsModal'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useConnect, useAccount } from 'wagmi'

export default function SignInWithEthereum() {
  const { connect, disconnect, isAuthenticated, walletAddress } =
    useAuthAccount()
  const { isConnected, address: connectedAddress } = useAccount()
  const { connectors, connectAsync } = useConnect()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isWalletsModalOpen, setIsWalletsModalOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Use connected wallet address (Wagmi) as primary, fallback to session address
  const displayAddress = connectedAddress || walletAddress

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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

  const handleViewWallets = async () => {
    // Ensure wallet address is cached before opening modal
    if (walletAddress) {
      // Store in sessionStorage for modal to use
      sessionStorage.setItem('connectedWalletAddress', walletAddress)
    }
    // Reconnect on user click before opening modal (outside modal)
    if (!isConnected && connectors && connectors.length > 0) {
      try {
        const last = localStorage.getItem('lastConnector')
        const preferred = connectors.find((c) => c.id === last) || connectors[0]
        console.log('🔌 Reconnecting with connector:', preferred.id)
        await connectAsync({ connector: preferred })
        console.log('✅ Reconnected')
      } catch (e) {
        console.log('⚠️ Reconnect failed:', e)
      }
    }
    setIsWalletsModalOpen(true)
    setIsDropdownOpen(false)
  }

  const handleDisconnect = () => {
    disconnect()
    setIsDropdownOpen(false)
  }

  return (
    <>
      <div
        className="flex items-stretch justify-stretch relative"
        ref={dropdownRef}
      >
        {isAuthenticated && displayAddress ? (
          <>
            <Button
              variant="glass"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="group"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono">
                {truncateAddress(displayAddress)}
              </span>
            </Button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 glass rounded-2xl shadow-2xl overflow-hidden z-50 animate-scaleIn border border-white/10">
                {/* User Info Header */}
                <div className="p-4 border-b border-white/10 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/30">
                      {displayAddress[2]?.toUpperCase()}
                    </div>
                    <div>
                      <span className="text-white font-mono text-sm block">
                        {truncateAddress(displayAddress)}
                      </span>
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Connected
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <button
                    onClick={handleEditProfile}
                    className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-all rounded-xl flex items-center gap-3 group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                      ✏️
                    </span>
                    <span className="flex-1">Edit Profile</span>
                    <span className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all">
                      →
                    </span>
                  </button>

                  <button
                    onClick={handleViewWallets}
                    className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-all rounded-xl flex items-center gap-3 group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                      👛
                    </span>
                    <span className="flex-1">View Wallets</span>
                    <span className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all">
                      →
                    </span>
                  </button>

                  <div className="h-px bg-white/10 my-2"></div>

                  <button
                    onClick={handleDisconnect}
                    className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition-all rounded-xl flex items-center gap-3 group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      🚪
                    </span>
                    <span className="flex-1">Disconnect</span>
                    <span className="text-slate-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all">
                      →
                    </span>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <Button variant="primary" onClick={connect} glow>
            ✨ Sign In
          </Button>
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
