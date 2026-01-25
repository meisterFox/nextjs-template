'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  address: string
  chainName?: string
}

export default function DepositModal({ isOpen, onClose, address, chainName }: DepositModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Simple QR code using external API (no library needed)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(address)}`

  const modal = (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] animate-fadeIn" onClick={onClose} />
      <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
        <div className="glass rounded-3xl shadow-2xl max-w-sm w-full border border-white/10 animate-scaleIn">
          
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/30">
                📥
              </div>
              <h2 className="text-xl font-bold text-white">Deposit</h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              ✕
            </button>
          </div>

          <div className="p-6">
            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-2xl shadow-xl">
                <img 
                  src={qrCodeUrl} 
                  alt="Wallet QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>

            {/* Chain Info */}
            {chainName && (
              <div className="text-center mb-4">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/20 text-violet-400 rounded-xl text-sm font-medium neon-purple">
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse"></span>
                  {chainName}
                </span>
              </div>
            )}

            {/* Address */}
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Your wallet address</p>
              <p className="font-mono text-white text-sm break-all">{address}</p>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`w-full mt-4 py-3 rounded-xl text-white font-semibold transition-all shadow-lg ${
                copied 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-500/25' 
                  : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-violet-500/25'
              }`}
            >
              {copied ? '✓ Copied!' : '📋 Copy Address'}
            </button>

            {/* Warning */}
            <p className="text-xs text-slate-500 text-center mt-4">
              Only send {chainName || 'compatible'} assets to this address
            </p>
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(modal, document.body)
}
