'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useConnect } from 'wagmi'

interface ConnectWalletModalProps {
  isOpen: boolean
  onClose: () => void
  onCloseAll?: () => void // Close parent modals too (for WalletConnect/Coinbase)
}

export default function ConnectWalletModal({
  isOpen,
  onClose,
  onCloseAll,
}: ConnectWalletModalProps) {
  const { connectors, connectAsync, isPending } = useConnect()
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleConnect = async (connector: (typeof connectors)[0]) => {
    setConnectingId(connector.id)
    setError(null)

    // For WalletConnect/Coinbase, close ALL modals so their modal is visible on top
    const isExternalModal =
      connector.id.toLowerCase().includes('walletconnect') ||
      connector.id.toLowerCase().includes('coinbase')
    if (isExternalModal) {
      onClose()
      onCloseAll?.() // Close parent ViewWalletsModal too
    }

    try {
      await connectAsync({ connector })
      // Persist connector for auto-reconnect
      try {
        localStorage.setItem('lastConnector', connector.id)
      } catch {}
      if (!isExternalModal) {
        onClose()
      }
    } catch (e: any) {
      // Ignore user rejection errors - these are expected when user cancels
      const msg = e?.message?.toLowerCase() || ''
      const isUserRejection =
        msg.includes('rejected') ||
        msg.includes('denied') ||
        msg.includes('cancelled') ||
        msg.includes('canceled') ||
        msg.includes('user refused') ||
        msg.includes('user closed')

      if (!isUserRejection && !isExternalModal) {
        setError(e?.message || 'Connection failed')
      }
      // Silently ignore rejection errors
    } finally {
      setConnectingId(null)
    }
  }

  // Connector icons and names
  const getConnectorInfo = (connector: (typeof connectors)[0]) => {
    const id = connector.id.toLowerCase()
    const name = connector.name

    if (id.includes('metamask') || name.toLowerCase().includes('metamask')) {
      return {
        icon: '🦊',
        displayName: 'MetaMask',
        color: 'from-orange-500 to-amber-500',
      }
    }
    if (
      id.includes('walletconnect') ||
      name.toLowerCase().includes('walletconnect')
    ) {
      return {
        icon: '🔗',
        displayName: 'WalletConnect',
        color: 'from-blue-500 to-cyan-500',
      }
    }
    if (id.includes('coinbase') || name.toLowerCase().includes('coinbase')) {
      return {
        icon: '🔵',
        displayName: 'Coinbase Wallet',
        color: 'from-blue-600 to-blue-700',
      }
    }
    if (id.includes('injected')) {
      return {
        icon: '💉',
        displayName: 'Browser Wallet',
        color: 'from-purple-500 to-pink-500',
      }
    }
    return {
      icon: '👛',
      displayName: name,
      color: 'from-slate-500 to-slate-600',
    }
  }

  const modal = (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] animate-fadeIn"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
        <div className="glass rounded-3xl shadow-2xl max-w-sm w-full border border-white/10 animate-scaleIn">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-xl shadow-lg shadow-violet-500/30">
                🔗
              </div>
              <h2 className="text-xl font-bold text-white">Connect Wallet</h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              ✕
            </button>
          </div>

          <div className="p-6">
            {/* Connector List */}
            <div className="space-y-3">
              {connectors.map((connector, index) => {
                const info = getConnectorInfo(connector)
                const isConnecting = connectingId === connector.id

                return (
                  <button
                    key={connector.id}
                    onClick={() => handleConnect(connector)}
                    disabled={isPending}
                    className={`w-full flex items-center gap-4 p-4 glass card-hover rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed animate-fadeIn stagger-${Math.min(index + 1, 5)}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center text-2xl shadow-lg`}
                    >
                      {isConnecting ? (
                        <span className="animate-spin">⟳</span>
                      ) : (
                        info.icon
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-white font-semibold">
                        {info.displayName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {isConnecting ? 'Connecting...' : 'Click to connect'}
                      </p>
                    </div>
                    <span className="text-slate-500 group-hover:text-white transition-colors">
                      →
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 p-3 glass rounded-xl border border-red-500/30 neon-pink">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Info */}
            <p className="text-xs text-slate-500 text-center mt-6">
              By connecting, you agree to our Terms of Service
            </p>
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(modal, document.body)
}
