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
      <div className="w-full text-center space-y-6 py-12 relative">
        {/* Background Glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-fuchsia-500/20 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="inline-block animate-fadeIn">
          <span className="px-4 py-2 glass-card rounded-full text-sm text-amber-300 mb-4 inline-block">
            🏆 Top Performers
          </span>
          <h1 className="text-5xl sm:text-7xl font-black text-gradient-rainbow mt-4">
            Leaderboard
          </h1>
          <div className="h-1.5 w-40 mx-auto bg-gradient-to-r from-amber-500 via-orange-500 to-fuchsia-500 rounded-full mt-4 animate-pulse-glow"></div>
        </div>
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto animate-fadeIn stagger-1">
          Compete with the best and climb to the top
        </p>
      </div>

      {isLoading && data.length === 0 ? (
        <div className="flex items-center justify-center w-full min-h-[400px]">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 animate-float flex items-center justify-center text-4xl">
              🏆
            </div>
            <div className="absolute -inset-6 bg-amber-500/20 rounded-3xl blur-2xl animate-pulse-glow"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {data.length >= 3 && (
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fadeIn stagger-1">
              {/* 2nd Place */}
              <div className="order-2 md:order-1 transform hover:scale-105 transition-all duration-500">
                <div className="glass-card rounded-3xl p-6 relative overflow-hidden h-full">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-400 to-slate-600"></div>
                  <div className="flex flex-col items-center space-y-4 pt-2">
                    <div className="text-6xl animate-float" style={{ animationDelay: '0.2s' }}>🥈</div>
                    <div className="text-2xl font-bold text-slate-300">2nd Place</div>
                    <div className="w-full glass rounded-xl p-4 text-center">
                      <div className="text-xs text-slate-400 mb-2">Wallet</div>
                      <div className="font-mono text-sm text-white truncate">{data[1]?.user?.walletAddress?.slice(0, 10)}...{data[1]?.user?.walletAddress?.slice(-6)}</div>
                    </div>
                    <div className="text-3xl font-black text-gradient-purple">
                      {Number(data[1]?.amount || 0).toLocaleString()} pts
                    </div>
                  </div>
                </div>
              </div>

              {/* 1st Place */}
              <div className="order-1 md:order-2 transform hover:scale-110 transition-all duration-500 md:-mt-6">
                <div className="glass-card rounded-3xl p-8 relative overflow-hidden neon-purple">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10"></div>
                  <div className="relative flex flex-col items-center space-y-4 pt-2">
                    <div className="text-7xl animate-float">👑</div>
                    <div className="text-3xl font-black text-gradient-rainbow">Champion</div>
                    <div className="w-full glass rounded-xl p-4 text-center border border-amber-500/30">
                      <div className="text-xs text-amber-400 mb-2">Wallet</div>
                      <div className="font-mono text-sm font-bold text-white truncate">{data[0]?.user?.walletAddress?.slice(0, 10)}...{data[0]?.user?.walletAddress?.slice(-6)}</div>
                    </div>
                    <div className="text-4xl font-black text-gradient-rainbow">
                      {Number(data[0]?.amount || 0).toLocaleString()} pts
                    </div>
                  </div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="order-3 transform hover:scale-105 transition-all duration-500">
                <div className="glass-card rounded-3xl p-6 relative overflow-hidden h-full">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-600"></div>
                  <div className="flex flex-col items-center space-y-4 pt-2">
                    <div className="text-6xl animate-float" style={{ animationDelay: '0.4s' }}>🥉</div>
                    <div className="text-2xl font-bold text-orange-300">3rd Place</div>
                    <div className="w-full glass rounded-xl p-4 text-center">
                      <div className="text-xs text-orange-400 mb-2">Wallet</div>
                      <div className="font-mono text-sm text-white truncate">{data[2]?.user?.walletAddress?.slice(0, 10)}...{data[2]?.user?.walletAddress?.slice(-6)}</div>
                    </div>
                    <div className="text-3xl font-black text-gradient-purple">
                      {Number(data[2]?.amount || 0).toLocaleString()} pts
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Rankings */}
          <div className="w-full animate-fadeIn stagger-2">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-xl shadow-lg shadow-violet-500/30">
                📊
              </div>
              <h2 className="text-2xl font-bold text-white">All Rankings</h2>
            </div>
            
            <div className="glass-card rounded-2xl overflow-hidden">
              <Table<AccountListResponse.Data>
                data={data}
                getRowKey={(i) => i.id}
                columns={[
                  { key: 'id', label: 'Rank', render: (_i, idx) => (
                    <span className={`font-bold ${idx < 3 ? 'text-2xl' : 'text-slate-400'}`}>
                      {getMedalEmoji(idx + 1)}
                    </span>
                  )},
                  {
                    key: 'user',
                    label: 'Wallet Address',
                    render: (i) => (
                      <span className="font-mono text-sm text-slate-300">
                        {i.user?.walletAddress ? `${i.user.walletAddress.slice(0, 10)}...${i.user.walletAddress.slice(-6)}` : '—'}
                      </span>
                    ),
                  },
                  {
                    key: 'amount',
                    label: 'Points',
                    render: (i) => (
                      <span className="font-bold text-violet-300">
                        {Number(i.amount || 0).toLocaleString()}
                      </span>
                    ),
                  },
                ]}
              />
            </div>
            
            {hasNextPage && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
