'use client'

import Link from 'next/link'
import { useWebsiteContext } from '@/components/providers/WebsiteProvider'
import { getPastMintingAssets } from '@/lib/actions/getPastMintingAssets'
import { useState, useEffect } from 'react'

export const Home = () => {
  const { website, isLoading } = useWebsiteContext()
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [pastRewards, setPastRewards] = useState<any[]>([])
  const [isPastLoading, setIsPastLoading] = useState(false)
  const [selectedReward, setSelectedReward] = useState<any | null>(null)

  useEffect(() => {
    if (isLoading) {
      setLoadingProgress(0)
      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 15
        })
      }, 200)
      
      return () => clearInterval(progressInterval)
    } else {
      setLoadingProgress(100)
    }
  }, [isLoading])

  useEffect(() => {
    const loadPastRewards = async () => {
      if (!website?.id) return
      setIsPastLoading(true)
      try {
        const data = await getPastMintingAssets({ websiteId: website.id })
        setPastRewards(data || [])
      } catch (error) {
        setPastRewards([])
      } finally {
        setIsPastLoading(false)
      }
    }

    loadPastRewards()
  }, [website?.id])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[60vh] gap-8">
        {/* Animated Logo */}
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 animate-float flex items-center justify-center">
            <span className="text-4xl font-black text-white">S</span>
          </div>
          <div className="absolute -inset-4 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-3xl blur-2xl animate-pulse-glow"></div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-72 glass-card rounded-full p-1 overflow-hidden">
          <div 
            className="h-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 rounded-full transition-all duration-300"
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>
        <p className="text-slate-400 text-sm animate-pulse">Loading amazing things...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-16 w-full items-start justify-start max-w-7xl mx-auto p-4 sm:p-8">
      {/* Hero Section */}
      <div className="w-full text-center space-y-8 py-16 relative">
        {/* Background Glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-full blur-[128px]"></div>
        </div>
        
        <div className="inline-block animate-fadeIn">
          <span className="px-4 py-2 glass-card rounded-full text-sm text-violet-300 mb-6 inline-block">
            ✨ Welcome to the future of loyalty
          </span>
          <h1 className="text-6xl sm:text-8xl font-black text-gradient-purple leading-tight mt-6">
            {website?.name || 'Welcome'}
          </h1>
          <div className="h-1.5 w-48 mx-auto bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 rounded-full mt-6 animate-pulse-glow"></div>
        </div>
        
        <p className="text-xl sm:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed animate-fadeIn stagger-1">
          Your gateway to an amazing web3 experience
        </p>
        
        {website?.id && (
          <div className="inline-flex items-center gap-3 px-6 py-4 glass-card rounded-2xl animate-fadeIn stagger-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm text-slate-400">Connected: </span>
            <span className="font-mono text-white">{website.id.slice(0, 8)}...{website.id.slice(-6)}</span>
          </div>
        )}
      </div>

      {/* Collections Section */}
      {website?.collections && website.collections.length > 0 && (
        <div className="w-full animate-fadeIn stagger-2">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-2xl shadow-lg shadow-violet-500/30">
              💎
            </div>
            <div>
              <h2 className="text-4xl font-bold text-white">Collections</h2>
              <p className="text-slate-400">Explore our exclusive NFT collections</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {website.collections.map((collection, idx) => (
              <div
                key={collection.id}
                className={`group glass-card card-hover rounded-2xl p-6 stagger-${(idx % 5) + 1}`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    💎
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">{collection.name}</h3>
                    <p className="text-sm text-slate-500">NFT Collection</p>
                  </div>
                </div>
                {collection.id && (
                  <div className="px-3 py-2 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400 font-mono truncate">
                      {collection.id}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Rewards Section */}
      <div className="w-full animate-fadeIn stagger-3">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30">
              🏅
            </div>
            <div>
              <h2 className="text-4xl font-bold text-white">Past Rewards</h2>
              <p className="text-slate-400">Recently ended drops, still viewable</p>
            </div>
          </div>
        </div>

        {isPastLoading ? (
          <div className="flex items-center justify-center w-full min-h-[240px]">
            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 animate-float"></div>
              <div className="absolute -inset-4 bg-amber-500/20 rounded-2xl blur-xl animate-pulse-glow"></div>
            </div>
          </div>
        ) : pastRewards.length === 0 ? (
          <div className="w-full text-center py-16 glass-card rounded-2xl">
            <div className="text-5xl mb-4">🎁</div>
            <p className="text-slate-400">No past rewards found yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pastRewards.map((reward, idx) => {
              const rawImageUrl =
                reward?.imageUrl ||
                reward?.image ||
                reward?.previewImage ||
                reward?.animationUrl
              const imageUrl = rawImageUrl?.startsWith('ipfs://')
                ? rawImageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')
                : rawImageUrl
              const isVideo = imageUrl && (imageUrl.endsWith('.mp4') || imageUrl.endsWith('.webm') || imageUrl.includes('.mp4') || imageUrl.includes('.webm'))
              const statusLabel = reward?.status === 'past' ? 'Ended' : reward?.status || 'Ended'

              return (
                <div
                  key={reward?.id}
                  className={`group glass-card card-hover rounded-2xl overflow-hidden cursor-pointer stagger-${(idx % 5) + 1}`}
                  onClick={() => setSelectedReward(reward)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {imageUrl ? (
                      isVideo ? (
                        <video
                          src={imageUrl}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={imageUrl}
                          alt={reward?.name || 'Past reward'}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      )
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-4xl">
                        🎁
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 backdrop-blur-sm text-amber-200 border border-amber-500/30">
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">
                      {reward?.name || 'Untitled drop'}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400 font-mono">
                        {reward?.assetNr ? `#${reward.assetNr}` : 'View details'}
                      </span>
                      <span className="text-amber-400 group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedReward && (() => {
        const detailHref = selectedReward?.mintingContractId || selectedReward?.contractId
          ? `/minting/contracts/${selectedReward.mintingContractId || selectedReward.contractId}/assets/${selectedReward.id}`
          : null
        const rawModalImage =
          selectedReward?.imageUrl ||
          selectedReward?.image ||
          selectedReward?.previewImage ||
          selectedReward?.animationUrl
        const modalImage = rawModalImage?.startsWith('ipfs://')
          ? rawModalImage.replace('ipfs://', 'https://ipfs.io/ipfs/')
          : rawModalImage
        const isModalVideo = modalImage && (modalImage.endsWith('.mp4') || modalImage.endsWith('.webm') || modalImage.includes('.mp4') || modalImage.includes('.webm'))

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-5xl glass rounded-3xl shadow-2xl overflow-hidden border border-white/10 animate-scaleIn">
              {/* Close Button */}
              <button
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full glass-card flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                onClick={() => setSelectedReward(null)}
              >
                ✕
              </button>
              
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image */}
                <div className="relative bg-slate-900">
                  {modalImage ? (
                    isModalVideo ? (
                      <video
                        src={modalImage}
                        controls
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img
                        src={modalImage}
                        alt={selectedReward?.name || 'Past reward'}
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="h-full w-full aspect-square bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-6xl">
                      🎁
                    </div>
                  )}
                </div>
                
                {/* Details */}
                <div className="p-8 space-y-6 flex flex-col">
                  <div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-500/30">
                      {selectedReward?.status === 'past' ? 'Minting Ended' : selectedReward?.status || 'Ended'}
                    </span>
                    <h3 className="text-3xl font-bold text-white mt-4">{selectedReward?.name || 'Untitled drop'}</h3>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card rounded-xl p-4">
                      <p className="text-slate-400 text-xs mb-1">Asset #</p>
                      <p className="text-white font-bold">{selectedReward?.assetNr ?? '—'}</p>
                    </div>
                    <div className="glass-card rounded-xl p-4">
                      <p className="text-slate-400 text-xs mb-1">Price</p>
                      <p className="text-white font-bold">
                        {selectedReward?.price && Number(selectedReward.price) > 0
                          ? `${selectedReward.price} ${selectedReward?.loyaltyCurrency?.symbol || ''}`
                          : 'FREE'}
                      </p>
                    </div>
                    <div className="glass-card rounded-xl p-4">
                      <p className="text-slate-400 text-xs mb-1">Minted</p>
                      <p className="text-white font-bold">{selectedReward?.quantityMinted ?? 0} / {selectedReward?.quantity ?? 0}</p>
                    </div>
                    <div className="glass-card rounded-xl p-4">
                      <p className="text-slate-400 text-xs mb-1">ID</p>
                      <p className="text-white font-mono text-xs truncate">{selectedReward?.id?.substring(0, 8)}...</p>
                    </div>
                  </div>

                  {selectedReward?.description && (
                    <div className="glass-card rounded-xl p-4 text-sm text-slate-300 leading-relaxed">
                      {selectedReward.description}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 mt-auto pt-4">
                    <button
                      onClick={() => setSelectedReward(null)}
                      className="px-6 py-3 rounded-xl glass-card hover:bg-white/15 text-white font-semibold transition-colors"
                    >
                      Close
                    </button>
                    {detailHref && (
                      <Link
                        href={detailHref}
                        className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-center hover:from-amber-400 hover:to-orange-500 transition-colors shadow-lg shadow-amber-500/25"
                        onClick={() => setSelectedReward(null)}
                      >
                        View Full Page →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
