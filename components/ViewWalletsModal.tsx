'use client'

import { useState } from 'react'
import { useAccount, useBalance, useChains, useSwitchChain } from 'wagmi'
import { formatEther } from 'viem'

interface ViewWalletsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ViewWalletsModal({ isOpen, onClose }: ViewWalletsModalProps) {
  const { address, isConnected, chain } = useAccount()
  const { data: balanceData } = useBalance({
    address: address,
  })
  const chains = useChains()
  const { switchChain } = useSwitchChain()
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false)

  if (!isOpen) return null

  const balance = balanceData ? parseFloat(formatEther(balanceData.value)).toFixed(4) : '0.0000'
  const symbol = balanceData?.symbol || 'ETH'
  const currentChain = chain || chains[0]

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700/50 animate-fade-in max-h-screen overflow-y-auto p-6">
        
        {/* Header with Close */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyan-400">
            Wallet
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Wallet Info */}
        {isConnected && address ? (
          <div className="space-y-6">
            {/* Wallet & Chain Selector Row */}
            <div className="flex items-center gap-3">
              {/* Connected Wallet */}
              <div className="flex-1 flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {address[2]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 mb-0.5">Connected Wallet</p>
                  <p className="font-mono text-white text-xs truncate">{address.slice(0, 6)}...{address.slice(-4)}</p>
                </div>
              </div>

              {/* Chain Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-3 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg transition-all"
                >
                  {currentChain?.name && (
                    <>
                      <span className="text-sm text-white font-semibold">{currentChain.name}</span>
                      <svg className={`w-4 h-4 text-white transition-transform ${isChainDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </>
                  )}
                </button>

                {/* Chain Dropdown Menu */}
                {isChainDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700/50 rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto">
                    {chains.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          switchChain({ chainId: c.id })
                          setIsChainDropdownOpen(false)
                        }}
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-800/50 transition-colors text-left border-b border-slate-700/30 last:border-b-0 ${
                          chain?.id === c.id ? 'bg-slate-800/50' : ''
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {c.name[0]}
                        </div>
                        <span className="text-white text-sm font-medium">{c.name}</span>
                        {chain?.id === c.id && (
                          <span className="ml-auto text-orange-400">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Balance Card */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
              <p className="text-sm text-slate-400 mb-2">Total balance</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-white">{balance}</p>
                <p className="text-xl text-slate-400">{symbol}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => alert('Deposit functionality coming soon')} className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/30 transition-colors">
                <span className="text-xl">📥</span>
                <span className="text-white font-semibold">Deposit</span>
              </button>
              <button onClick={() => alert('Send functionality coming soon')} className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/30 transition-colors">
                <span className="text-xl">📤</span>
                <span className="text-white font-semibold">Send</span>
              </button>
            </div>

            {/* My other wallets section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-400">My other wallets</p>
                <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <span>+ Connect new</span>
                </button>
              </div>
              
              <div className="flex items-center justify-center p-8 bg-slate-800/30 rounded-lg border border-slate-700/20">
                <div className="text-center">
                  <div className="text-4xl mb-2">👛</div>
                  <p className="text-sm text-slate-500">Connect additional wallets</p>
                  <p className="text-xs text-slate-600">to see them here.</p>
                </div>
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="flex gap-2 pt-4 border-t border-slate-700/30">
              <button className="flex-1 flex flex-col items-center justify-center py-3 hover:bg-slate-800/50 rounded-lg transition-colors">
                <span className="text-2xl mb-1">👛</span>
                <span className="text-xs text-slate-400">Wallets</span>
              </button>
              <button 
                onClick={onClose}
                className="flex-1 flex flex-col items-center justify-center py-3 hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                <span className="text-2xl mb-1">⚙️</span>
                <span className="text-xs text-slate-400">Settings</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">🔌</div>
            <p className="text-slate-400">No wallet connected</p>
          </div>
        )}
      </div>
    </>
  )
}