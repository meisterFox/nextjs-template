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
      <div className="flex flex-col items-center justify-center w-full min-h-[60vh] gap-6">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500"></div>
          <div className="animate-ping absolute inset-0 rounded-full h-16 w-16 border-4 border-purple-500 opacity-20"></div>
        </div>
        <div className="w-64 bg-gray-800/50 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 transition-all duration-300 rounded-full"
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-12 w-full items-start justify-start max-w-7xl mx-auto p-4 sm:p-8">
      {/* Hero Section */}
      <div className="w-full text-center space-y-6 py-12">
        <div className="inline-block">
          <h1 className="text-7xl sm:text-8xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-gradient">
            {website?.name || 'Welcome'}
          </h1>
          <div className="h-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full mt-4 animate-pulse"></div>
        </div>
        <p className="text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Your gateway to an amazing web3 experience
        </p>
        {website?.id && (
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-gray-700/50 to-gray-800/50 backdrop-blur-xl rounded-full border border-gray-600/30">
            <span className="text-sm text-gray-400">Website ID: </span>
            <span className="font-mono text-white">{website.id}</span>
          </div>
        )}
      </div>

      {/* Collections Section */}
      {website?.collections && website.collections.length > 0 && (
        <div className="w-full">
          <div className="mb-8 text-center">
            <h2 className="text-5xl font-bold text-transparent bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-600 bg-clip-text inline-flex items-center gap-3">
              <span className="text-4xl">🎨</span> Collections
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {website.collections.map((collection) => (
              <div
                key={collection.id}
                className="group relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 rounded-2xl transition-all duration-300"></div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">{'💎'}</div>
                    <h3 className="text-xl font-bold text-white">{collection.name}</h3>
                  </div>
                  {collection.id && (
                    <p className="text-sm text-gray-400 font-mono break-all">
                      ID: {collection.id}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-4xl font-bold text-transparent bg-gradient-to-r from-amber-400 via-orange-500 to-pink-600 bg-clip-text flex items-center gap-3">
            <span className="text-3xl">🏅</span> Past rewards
          </h2>
          <p className="text-sm text-gray-400">Recently ended drops, still viewable</p>
        </div>

        {isPastLoading ? (
          <div className="flex items-center justify-center w-full min-h-[240px]">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-amber-500"></div>
              <div className="animate-ping absolute inset-0 rounded-full h-12 w-12 border-4 border-pink-500 opacity-20"></div>
            </div>
          </div>
        ) : pastRewards.length === 0 ? (
          <div className="w-full text-center py-12 bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 text-gray-400">
            No past rewards found yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pastRewards.map((reward) => {
              const rawImageUrl =
                reward?.imageUrl ||
                reward?.image ||
                reward?.previewImage ||
                reward?.animationUrl
              const imageUrl = rawImageUrl?.startsWith('ipfs://')
                ? rawImageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')
                : rawImageUrl
              const isVideo = imageUrl && (imageUrl.endsWith('.mp4') || imageUrl.endsWith('.webm') || imageUrl.includes('.mp4') || imageUrl.includes('.webm'))
              const statusLabel = reward?.status === 'past' ? 'Minting Ended' : reward?.status || 'Ended'
              const contractId = reward?.mintingContractId || reward?.contractId
              const href = contractId
                ? `/minting/contracts/${contractId}/assets/${reward?.id}`
                : null

              const CardContent = (
                <div className="group relative flex flex-col h-full bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-700/60 hover:border-amber-500/60 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:shadow-amber-500/10">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {imageUrl ? (
                      isVideo ? (
                        <video
                          src={imageUrl}
                          className="h-full w-full object-cover"
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={imageUrl}
                          alt={reward?.name || 'Past reward'}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-3xl">
                        {'🎁'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  </div>

                  <div className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm text-gray-400">Past reward</p>
                        <h3 className="text-lg font-bold text-white leading-tight">
                          {reward?.name || 'Untitled drop'}
                        </h3>
                      </div>
                      <div className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {statusLabel}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span className="font-mono">
                        {reward?.assetNr ? `Asset #${reward.assetNr}` : 'View details'}
                      </span>
                      <div className="flex items-center gap-2">
                        {href && (
                          <Link
                            href={href}
                            className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500/30"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Full page
                          </Link>
                        )}
                        <span className="flex items-center gap-1 text-amber-300 font-semibold">
                          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )

              return (
                <div
                  key={reward?.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedReward(reward)}
                >
                  {CardContent}
                </div>
              )
            })}
          </div>
        )}
      </div>

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
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-black/70 backdrop-blur-sm">
            <div className="relative w-full max-w-5xl bg-gradient-to-br from-gray-900 to-black border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden">
              <button
                className="absolute top-4 right-4 text-sm px-3 py-1 rounded-full bg-gray-800/70 text-gray-200 border border-gray-700 hover:bg-gray-700"
                onClick={() => setSelectedReward(null)}
              >
                Close
              </button>
              <div className="grid md:grid-cols-2 gap-0">
                <div className="relative bg-gray-900">
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
                    <div className="h-full w-full aspect-square bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-5xl">
                      {'🎁'}
                    </div>
                  )}
                </div>
                <div className="p-8 space-y-6 flex flex-col">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Past reward</p>
                      <h3 className="text-3xl font-bold text-white">{selectedReward?.name || 'Untitled drop'}</h3>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-500/40">
                      {selectedReward?.status === 'past' ? 'Minting Ended' : selectedReward?.status || 'Ended'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-300 bg-gray-800/40 border border-gray-700/60 rounded-2xl p-4">
                    <div>
                      <p className="text-gray-500 text-xs">Asset nr</p>
                      <p className="font-semibold">#{selectedReward?.assetNr ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Asset ID</p>
                      <p className="font-mono text-xs break-all">{selectedReward?.id?.substring(0, 8) ?? '—'}...</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Price</p>
                      <p className="font-semibold">
                        {selectedReward?.price && Number(selectedReward.price) > 0
                          ? `${selectedReward.price} ${selectedReward?.loyaltyCurrency?.symbol || selectedReward?.loyaltyCurrency?.name || ''}`
                          : 'FREE'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Minted</p>
                      <p className="font-semibold">{selectedReward?.quantityMinted ?? 0} / {selectedReward?.quantity ?? 0}</p>
                    </div>
                  </div>

                  {selectedReward?.description && (
                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-4 text-sm text-gray-200 leading-relaxed">
                      {selectedReward.description}
                    </div>
                  )}

                  {selectedReward?.collectInfoCustomInputLabel && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-sm text-blue-200 leading-relaxed">
                      <p className="text-blue-300 font-semibold mb-1">Required Info:</p>
                      {selectedReward.collectInfoCustomInputLabel}
                    </div>
                  )}

                  <div className="flex gap-3 flex-wrap mt-auto">
                    <button
                      onClick={() => setSelectedReward(null)}
                      className="px-4 py-2 rounded-xl bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700"
                    >
                      Close
                    </button>
                    {detailHref && (
                      <Link
                        href={detailHref}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 text-black font-semibold shadow-lg hover:opacity-90"
                        onClick={() => setSelectedReward(null)}
                      >
                        View full page
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
