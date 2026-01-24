'use client'

import { Header } from '@/components/ui/Header'
import { Table } from '@/components/ui/Table'
import { getLeaderboardAccounts } from '@/lib/actions/getLeaderboardAccounts'
import { AccountListResponse } from '@snagsolutions/sdk/resources/loyalty/accounts.mjs'
import { useEffect, useState } from 'react'

interface LeaderboardProps {}

const getMedalEmoji = (rank: number) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

const getRankColor = (rank: number) => {
  if (rank === 1) return 'from-yellow-400 to-yellow-600'
  if (rank === 2) return 'from-gray-300 to-gray-500'
  if (rank === 3) return 'from-orange-400 to-orange-600'
  return 'from-blue-500 to-purple-600'
}

export const Leaderboard = ({}: LeaderboardProps) => {
  const [data, setData] = useState<Array<AccountListResponse.Data>>([])
  const [hasNextPage, setHasNextPage] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true)
      const response = await getLeaderboardAccounts()
      setData(response.data)
      setHasNextPage(response.hasNextPage)
      setIsLoading(false)
    }
    fetchInitialData()
  }, [])

  const loadMore = async () => {
    if (!hasNextPage || isLoading) return
    setIsLoading(true)

    const lastItem = data[data.length - 1]
    const nextPage = lastItem ? lastItem.id : null

    if (nextPage) {
      const nextData = await getLeaderboardAccounts(nextPage)
      setData((prevData) => [...prevData, ...nextData.data])
      setHasNextPage(nextData.hasNextPage)
    }
    setIsLoading(false)
  }

  return (
    <div className="flex flex-col gap-8 w-full items-start justify-start max-w-7xl mx-auto p-4 sm:p-8">
      {/* Hero Section */}
      <div className="w-full text-center space-y-4 py-8">
        <div className="inline-block">
          <h1 className="text-6xl sm:text-7xl font-black bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-gradient">
            Leaderboard
          </h1>
          <div className="h-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-full mt-2 animate-pulse"></div>
        </div>
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
          Compete with the best and climb to the top of the rankings
        </p>
      </div>

      {isLoading && data.length === 0 ? (
        <div className="flex items-center justify-center w-full min-h-[400px]">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500"></div>
            <div className="animate-ping absolute inset-0 rounded-full h-16 w-16 border-4 border-purple-500 opacity-20"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {data.length >= 3 && (
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* 2nd Place */}
              <div className="order-2 md:order-1 transform hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-gray-500/20 to-gray-700/20 backdrop-blur-xl rounded-3xl p-6 border border-gray-500/30 shadow-2xl">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="text-6xl animate-bounce">🥈</div>
                    <div className="text-2xl font-bold text-gray-300">2nd Place</div>
                    <div className="w-full bg-gray-800/50 rounded-xl p-4 text-center break-all">
                      <div className="text-xs text-gray-400 mb-2">Wallet</div>
                      <div className="font-mono text-sm">{data[1]?.user?.walletAddress?.slice(0, 10)}...{data[1]?.user?.walletAddress?.slice(-8)}</div>
                    </div>
                    <div className="text-3xl font-black text-transparent bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text">
                      {Number(data[1]?.amount || 0).toLocaleString()} pts
                    </div>
                  </div>
                </div>
              </div>

              {/* 1st Place */}
              <div className="order-1 md:order-2 transform hover:scale-110 transition-all duration-300 md:-mt-8">
                <div className="bg-gradient-to-br from-yellow-500/30 to-orange-600/30 backdrop-blur-xl rounded-3xl p-8 border border-yellow-500/50 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-orange-600/10 animate-pulse"></div>
                  <div className="relative flex flex-col items-center space-y-4">
                    <div className="text-7xl animate-bounce">🥇</div>
                    <div className="text-3xl font-black text-transparent bg-gradient-to-r from-yellow-300 to-orange-500 bg-clip-text">Champion</div>
                    <div className="w-full bg-yellow-900/30 rounded-xl p-4 text-center break-all">
                      <div className="text-xs text-yellow-400 mb-2">Wallet</div>
                      <div className="font-mono text-sm font-bold">{data[0]?.user?.walletAddress?.slice(0, 10)}...{data[0]?.user?.walletAddress?.slice(-8)}</div>
                    </div>
                    <div className="text-4xl font-black text-transparent bg-gradient-to-r from-yellow-300 to-orange-500 bg-clip-text">
                      {Number(data[0]?.amount || 0).toLocaleString()} pts
                    </div>
                  </div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="order-3 transform hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-orange-500/20 to-orange-700/20 backdrop-blur-xl rounded-3xl p-6 border border-orange-500/30 shadow-2xl">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="text-6xl animate-bounce">🥉</div>
                    <div className="text-2xl font-bold text-orange-300">3rd Place</div>
                    <div className="w-full bg-orange-900/30 rounded-xl p-4 text-center break-all">
                      <div className="text-xs text-orange-400 mb-2">Wallet</div>
                      <div className="font-mono text-sm">{data[2]?.user?.walletAddress?.slice(0, 10)}...{data[2]?.user?.walletAddress?.slice(-8)}</div>
                    </div>
                    <div className="text-3xl font-black text-transparent bg-gradient-to-r from-orange-300 to-orange-600 bg-clip-text">
                      {Number(data[2]?.amount || 0).toLocaleString()} pts
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rest of Rankings */}
          <div className="w-full">
            <h2 className="text-3xl font-bold mb-6 text-transparent bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text">
              All Rankings
            </h2>
            <Table<AccountListResponse.Data>
              data={data}
              getRowKey={(i) => i.id}
              columns={[
                { key: 'id', label: 'Rank', render: (_i, idx) => getMedalEmoji(idx + 1) },
                {
                  key: 'user',
                  label: 'Wallet Address',
                  render: (i) => i.user?.walletAddress || '',
                },
                {
                  key: 'amount',
                  label: 'Points',
                  render: (i) => Number(i.amount || 0).toLocaleString(),
                },
              ]}
              hasNextPage={hasNextPage}
              isLoading={isLoading}
              loadMore={loadMore}
            />
          </div>
        </>
      )}
    </div>
  )
}
