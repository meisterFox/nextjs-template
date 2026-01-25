'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'

interface SendModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SendModal({ isOpen, onClose }: SendModalProps) {
  const { address, chain, isConnected } = useAccount()
  const { data: balanceData } = useBalance({
    address,
    query: { enabled: isConnected },
  })
  
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<'form' | 'preview' | 'pending' | 'success' | 'error'>('form')
  
  const { 
    sendTransaction, 
    data: txHash,
    isPending,
    isError,
    error,
    reset
  } = useSendTransaction()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  useEffect(() => {
    if (isPending) setStep('pending')
    if (isConfirmed) setStep('success')
    if (isError) setStep('error')
  }, [isPending, isConfirmed, isError])

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setRecipient('')
      setAmount('')
      setStep('form')
      reset()
    }
  }, [isOpen, reset])

  if (!isOpen) return null

  const balance = balanceData ? parseFloat(formatEther(balanceData.value)) : 0
  const symbol = balanceData?.symbol || 'ETH'
  const amountNum = parseFloat(amount) || 0
  const isValidAmount = amountNum > 0 && amountNum <= balance
  const isValidRecipient = recipient.startsWith('0x') && recipient.length === 42

  const handlePreview = () => {
    if (isValidAmount && isValidRecipient) {
      setStep('preview')
    }
  }

  const handleSend = () => {
    sendTransaction({
      to: recipient as `0x${string}`,
      value: parseEther(amount),
    })
  }

  const handleSetMax = () => {
    // Leave a bit for gas
    const maxAmount = Math.max(0, balance - 0.001)
    setAmount(maxAmount.toFixed(6))
  }

  const modal = (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] animate-fadeIn" onClick={onClose} />
      <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
        <div className="glass rounded-3xl shadow-2xl max-w-md w-full border border-white/10 animate-scaleIn">
          
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xl shadow-lg shadow-cyan-500/30">
                📤
              </div>
              <h2 className="text-xl font-bold text-white">
                {step === 'form' && 'Send'}
                {step === 'preview' && 'Preview'}
                {step === 'pending' && 'Sending...'}
                {step === 'success' && 'Sent!'}
                {step === 'error' && 'Failed'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              ✕
            </button>
          </div>

          <div className="p-6">
            {/* Form Step */}
            {step === 'form' && (
              <div className="space-y-4">
                {/* Recipient */}
                <div>
                  <label className="text-sm text-slate-400 mb-2 block uppercase tracking-wider">Recipient Address</label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x..."
                    className="w-full glass border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50 focus:neon-cyan transition-all"
                  />
                  {recipient && !isValidRecipient && (
                    <p className="text-red-400 text-xs mt-1">Invalid address format</p>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="text-sm text-slate-400 mb-2 block uppercase tracking-wider">Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      step="0.0001"
                      className="w-full glass border border-white/10 rounded-xl px-4 py-3 pr-24 text-white text-lg focus:outline-none focus:border-cyan-500/50 transition-all"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button
                        onClick={handleSetMax}
                        className="text-xs text-cyan-400 hover:text-cyan-300 px-2 py-1 bg-cyan-500/20 rounded-lg hover:bg-cyan-500/30 transition-colors"
                      >
                        MAX
                      </button>
                      <span className="text-slate-400">{symbol}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Balance: {balance.toFixed(4)} {symbol}
                  </p>
                  {amount && !isValidAmount && (
                    <p className="text-red-400 text-xs mt-1">
                      {amountNum > balance ? 'Insufficient balance' : 'Enter a valid amount'}
                    </p>
                  )}
                </div>

                {/* Network Info */}
                <div className="glass rounded-xl p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Network</span>
                    <span className="text-white font-medium">{chain?.name || 'Unknown'}</span>
                  </div>
                </div>

                {/* Preview Button */}
                <button
                  onClick={handlePreview}
                  disabled={!isValidAmount || !isValidRecipient}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-all shadow-lg shadow-cyan-500/25 disabled:shadow-none"
                >
                  Preview Transaction
                </button>
              </div>
            )}

            {/* Preview Step */}
            {step === 'preview' && (
              <div className="space-y-4">
                <div className="glass-card rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">From</span>
                    <span className="text-white font-mono text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">To</span>
                    <span className="text-white font-mono text-sm">{recipient.slice(0, 6)}...{recipient.slice(-4)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Amount</span>
                    <span className="text-gradient-cyan font-bold">{amount} {symbol}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Network</span>
                    <span className="text-white">{chain?.name}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('form')}
                    className="flex-1 py-3 glass hover:bg-white/10 rounded-xl text-white font-semibold transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSend}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 rounded-xl text-white font-semibold transition-all shadow-lg shadow-emerald-500/25"
                  >
                    Confirm & Send
                  </button>
                </div>
              </div>
            )}

            {/* Pending Step */}
            {step === 'pending' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 animate-float flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg shadow-cyan-500/30">
                  ⏳
                </div>
                <p className="text-white text-lg mb-2 font-semibold">
                  {isConfirming ? 'Confirming transaction...' : 'Please confirm in your wallet'}
                </p>
                <p className="text-slate-400 text-sm">
                  Sending {amount} {symbol} to {recipient.slice(0, 6)}...{recipient.slice(-4)}
                </p>
              </div>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg shadow-emerald-500/30 animate-scaleIn">
                  ✅
                </div>
                <p className="text-white text-xl mb-2 font-bold">Transaction Sent!</p>
                <p className="text-slate-400 text-sm mb-4">
                  {amount} {symbol} sent to {recipient.slice(0, 6)}...{recipient.slice(-4)}
                </p>
                {txHash && (
                  <a
                    href={`${chain?.blockExplorers?.default?.url}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 text-sm inline-flex items-center gap-1"
                  >
                    View on Explorer →
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl text-white font-semibold shadow-lg shadow-violet-500/25"
                >
                  Done
                </button>
              </div>
            )}

            {/* Error Step */}
            {step === 'error' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg shadow-red-500/30 animate-scaleIn">
                  ❌
                </div>
                <p className="text-white text-xl mb-2 font-bold">Transaction Failed</p>
                <p className="text-red-400 text-sm mb-4">
                  {error?.message || 'Something went wrong'}
                </p>
                <button
                  onClick={() => { reset(); setStep('form') }}
                  className="w-full py-3 glass hover:bg-white/10 rounded-xl text-white font-semibold transition-all"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(modal, document.body)
}
