'use client'

import { useState } from 'react'
import { useWebsiteContext } from '@/components/providers/WebsiteProvider'
import { useAuthAccount } from '@/lib/useAuthAccount'
import { Code } from '@/components/ui/Code'
import { Header } from '@/components/ui/Header'
import { getLeaderboardAccounts } from '@/lib/actions/getLeaderboardAccounts'
import { getLoyaltyRules } from '@/lib/actions/getLoyaltyRules'
import { getMintingContracts } from '@/lib/actions/getMintingContracts'
import { getProfileDetails } from '@/lib/actions/getProfileDetails'

export const DebugPage = () => {
  const { website } = useWebsiteContext()
  const { userId, isAuthenticated } = useAuthAccount()
  const [activeTab, setActiveTab] = useState<'website' | 'leaderboard' | 'rules' | 'minting' | 'profile'>('website')
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadData = async (tab: typeof activeTab) => {
    setIsLoading(true)
    setActiveTab(tab)
    try {
      switch (tab) {
        case 'website':
          setData(website)
          break
        case 'leaderboard':
          const leaderboard = await getLeaderboardAccounts()
          setData(leaderboard)
          break
        case 'rules':
          const rules = await getLoyaltyRules({ limit: 50 })
          setData(rules)
          break
        case 'minting':
          const contracts = await getMintingContracts()
          setData(contracts)
          break
        case 'profile':
          if (isAuthenticated && userId) {
            const profile = await getProfileDetails({ userId })
            setData(profile)
          } else {
            setData({ error: 'Not authenticated' })
          }
          break
      }
    } catch (error: any) {
      setData({ error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto p-4 sm:p-8">
      {/* Header */}
      <div className="w-full text-center space-y-4 py-8">
        <div className="inline-block">
          <h1 className="text-6xl sm:text-7xl font-black bg-gradient-to-r from-red-400 via-orange-500 to-yellow-600 bg-clip-text text-transparent animate-gradient">
            Debug Console
          </h1>
          <div className="h-2 bg-gradient-to-r from-red-400 via-orange-500 to-yellow-600 rounded-full mt-2 animate-pulse"></div>
        </div>
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
          Developer-only raw data viewer - Remove before production
        </p>
        <div className="inline-block px-6 py-3 bg-red-500/20 border border-red-500/50 rounded-xl">
          <span className="text-red-400 font-bold">⚠️ Internal Use Only</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-3 justify-center">
        {(['website', 'leaderboard', 'rules', 'minting', 'profile'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => loadData(tab)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
              activeTab === tab
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/50'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Data Display */}
      <div className="w-full bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <Header as="h3">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Data</Header>
          {isLoading && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          )}
        </div>
        
        {data ? (
          <Code data={data} />
        ) : (
          <p className="text-gray-400 text-center py-12">
            Select a tab above to load data
          </p>
        )}
      </div>

      {/* Info */}
      <div className="text-center text-sm text-gray-500 space-y-2">
        <p>🔒 This page should be removed or protected before deploying to production</p>
        <p>Access: <code className="bg-gray-800 px-2 py-1 rounded">/debug</code></p>
      </div>
    </div>
  )
}
