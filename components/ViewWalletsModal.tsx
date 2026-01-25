'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  useAccount,
  useBalance,
  useChains,
  useSwitchChain,
  useConnections,
  useDisconnect,
} from 'wagmi'
import { formatEther } from 'viem'
import { mainnet, base, arbitrum, optimism, polygon } from 'viem/chains'
import SendModal from './wallet/SendModal'
import DepositModal from './wallet/DepositModal'
import ConnectWalletModal from './wallet/ConnectWalletModal'

// Truncate address helper
const truncateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

interface ViewWalletsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ViewWalletsModal({
  isOpen,
  onClose,
}: ViewWalletsModalProps) {
  const { address, isConnected, chain, status, isConnecting, connector } =
    useAccount()
  const connections = useConnections()
  const { disconnect } = useDisconnect()

  const { data: balanceData } = useBalance({
    address: address,
    query: { enabled: isConnected },
  })
  const chains = useChains()
  const { switchChain } = useSwitchChain()
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false)
  const [forceRefresh, setForceRefresh] = useState(0)
  const [cachedAddress, setCachedAddress] = useState<string | null>(null)
  const [cachedChainId, setCachedChainId] = useState<number | null>(null)
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)

  // Fallback chains when Wagmi chains are empty (when disconnected)
  const availableChains =
    chains && chains.length > 0
      ? chains
      : [mainnet, base, arbitrum, optimism, polygon]

  // No session fallbacks; Wagmi is source of truth

  // Cache chain ID when it changes
  useEffect(() => {
    if (chain?.id) {
      setCachedChainId(chain.id)
      sessionStorage.setItem('selectedChainId', chain.id.toString())
    }
  }, [chain])

  // Remove sessionStorage restore for address; rely on Wagmi connection

  // Do not reconnect inside modal

  const isLoading = isConnecting || status === 'reconnecting'
  const isReady = isConnected
  const hasAddress = !!address

  // Force refresh when modal opens
  useEffect(() => {
    if (isOpen) {
      setForceRefresh((prev) => prev + 1)
    }
  }, [isOpen])

  // Debug logging minimal
  useEffect(() => {
    if (isOpen) {
      console.log('WalletsModal:', {
        isConnected,
        status,
        address,
        chain: chain?.name,
      })
    }
  }, [isOpen, isConnected, status, address, chain])

  if (!isOpen) return null

  const balance = balanceData
    ? parseFloat(formatEther(balanceData.value)).toFixed(4)
    : '0.0000'
  const symbol = balanceData?.symbol || 'ETH'
  const currentChain = chain || availableChains[0]

  const modal = (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998] animate-fadeIn"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="glass rounded-3xl shadow-2xl max-w-md w-full border border-white/10 animate-scaleIn max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-xl shadow-lg shadow-violet-500/30">
                👛
              </div>
              <h2 className="text-2xl font-bold text-white">Wallet</h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 animate-float flex items-center justify-center text-3xl mx-auto mb-4">
                  ⟳
                </div>
                <p className="text-slate-400">Connecting wallet...</p>
              </div>
            ) : isReady && hasAddress ? (
              <div className="space-y-6">
                {/* Wallet & Chain Row */}
                <div className="flex items-center gap-3">
                  {/* Connected Wallet */}
                  <div className="flex-1 glass rounded-xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/30">
                      {address?.[2]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400 mb-0.5 uppercase tracking-wider">
                        Connected
                      </p>
                      <p className="font-mono text-white text-sm truncate">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </p>
                    </div>
                  </div>

                  {/* Chain Selector */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setIsChainDropdownOpen(!isChainDropdownOpen)
                      }
                      className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl transition-all shadow-lg shadow-violet-500/25"
                    >
                      <span className="text-sm text-white font-semibold">
                        {currentChain?.name}
                      </span>
                      <svg
                        className={`w-4 h-4 text-white transition-transform ${isChainDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Chain Dropdown */}
                    {isChainDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 glass rounded-xl shadow-xl z-50 overflow-hidden border border-white/10">
                        {availableChains.map((c) => (
                          <button
                            key={c.id}
                            onClick={async () => {
                              setIsChainDropdownOpen(false)
                              try {
                                if (isConnected)
                                  await switchChain({ chainId: c.id })
                              } catch (e) {
                                console.log('Chain switch failed:', e)
                              }
                            }}
                            className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors text-left border-b border-white/5 last:border-b-0 ${
                              chain?.id === c.id ? 'bg-violet-500/20' : ''
                            }`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold">
                              {c.name[0]}
                            </div>
                            <span className="text-white text-sm font-medium flex-1">
                              {c.name}
                            </span>
                            {chain?.id === c.id && (
                              <span className="text-emerald-400">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Balance Card */}
                <div className="glass-card rounded-2xl p-6 neon-purple">
                  <p className="text-sm text-slate-400 mb-2 uppercase tracking-wider">
                    Total Balance
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black text-gradient-purple">
                      {balance}
                    </p>
                    <p className="text-xl text-slate-400">{symbol}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsDepositModalOpen(true)}
                    className="glass card-hover rounded-xl p-4 flex flex-col items-center gap-2 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      📥
                    </div>
                    <span className="text-white font-semibold">Deposit</span>
                  </button>
                  <button
                    onClick={() => setIsSendModalOpen(true)}
                    className="glass card-hover rounded-xl p-4 flex flex-col items-center gap-2 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      📤
                    </div>
                    <span className="text-white font-semibold">Send</span>
                  </button>
                </div>

                {/* Other Wallets */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-slate-400 uppercase tracking-wider">
                      Other Wallets
                    </p>
                    <button
                      onClick={() => setIsConnectModalOpen(true)}
                      className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                    >
                      + Connect new
                    </button>
                  </div>

                  {connections.length > 0 ? (
                    <div className="space-y-2">
                      {(() => {
                        const seenAddresses = new Set<string>()
                        const uniqueWallets: Array<{
                          address: string
                          connectorName: string
                          connector: (typeof connections)[0]['connector']
                        }> = []

                        connections.forEach((conn) => {
                          const accounts = conn.accounts || []
                          const connectorName = conn.connector?.name || 'Wallet'

                          accounts.forEach((acc) => {
                            const lowerAddr = acc.toLowerCase()
                            if (!seenAddresses.has(lowerAddr)) {
                              seenAddresses.add(lowerAddr)
                              uniqueWallets.push({
                                address: acc,
                                connectorName,
                                connector: conn.connector,
                              })
                            }
                          })
                        })

                        return uniqueWallets.map((wallet, index) => {
                          const isActive =
                            wallet.address.toLowerCase() ===
                            address?.toLowerCase()
                          const connectorName = wallet.connectorName

                          return (
                            <div
                              key={`${wallet.address}-${index}`}
                              className={`glass rounded-xl p-3 flex items-center gap-3 transition-all ${
                                isActive ? 'neon-purple' : 'hover:bg-white/5'
                              }`}
                            >
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                                  connectorName
                                    .toLowerCase()
                                    .includes('metamask')
                                    ? 'bg-orange-500/20'
                                    : connectorName
                                          .toLowerCase()
                                          .includes('walletconnect')
                                      ? 'bg-blue-500/20'
                                      : connectorName
                                            .toLowerCase()
                                            .includes('coinbase')
                                        ? 'bg-blue-600/20'
                                        : 'bg-violet-500/20'
                                }`}
                              >
                                {connectorName
                                  .toLowerCase()
                                  .includes('metamask')
                                  ? '🦊'
                                  : connectorName
                                        .toLowerCase()
                                        .includes('walletconnect')
                                    ? '🔗'
                                    : connectorName
                                          .toLowerCase()
                                          .includes('coinbase')
                                      ? '🔵'
                                      : '👛'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium">
                                  {truncateAddress(wallet.address)}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {connectorName}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {isActive && (
                                  <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-lg">
                                    Active
                                  </span>
                                )}
                                <button
                                  onClick={() => {
                                    if (wallet.connector) {
                                      disconnect({
                                        connector: wallet.connector,
                                      })
                                    }
                                  }}
                                  className="w-8 h-8 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                                  title="Disconnect"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  ) : (
                    <div className="glass rounded-xl p-8 text-center">
                      <div className="text-4xl mb-2">👛</div>
                      <p className="text-sm text-slate-400">
                        Connect additional wallets
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="text-5xl mb-4">🔌</div>
                <p className="text-slate-400">No wallet connected</p>
                <p className="text-xs text-slate-500 mt-2">
                  Close and reopen after connecting
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      <SendModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
      />
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        address={address ?? ''}
        chainName={chain?.name}
      />
      <ConnectWalletModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onCloseAll={onClose}
      />
    </>
  )

  return createPortal(modal, document.body)
}
