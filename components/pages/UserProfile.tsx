'use client'

import { Header } from '@/components/ui/Header'
import { Table } from '@/components/ui/Table'
import { getLoyaltyAccount } from '@/lib/actions/getLoyaltyAccount'
import { getLoyaltyTransactionEntries } from '@/lib/actions/getLoyaltyTransactionEntries'
import { getProfileDetails } from '@/lib/actions/getProfileDetails'
import { AccountListResponse } from '@snagsolutions/sdk/resources/loyalty/accounts.mjs'
import { TransactionGetTransactionEntriesResponse } from '@snagsolutions/sdk/resources/loyalty/transactions.mjs'
import { MetadataListResponse } from '@snagsolutions/sdk/resources/users/metadatas.mjs'
import { useEffect, useState } from 'react'

interface UserProfileProps {
  userId: string
}

export const UserProfile = ({ userId }: UserProfileProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<Array<MetadataListResponse.Data>>([])
  const [account, setAccount] = useState<Array<AccountListResponse.Data>>([])
  const [history, setHistory] = useState<
    Array<TransactionGetTransactionEntriesResponse.Data>
  >([])

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true)
      const profileData = await getProfileDetails({ userId })
      setProfile(profileData.data)

      const userGroupId =
        profileData.data?.[0]?.userMetadata?.[0]?.userGroupId ?? undefined

      const accountData = await getLoyaltyAccount({
        ...(!!userGroupId ? { userGroupId } : { userId }),
      })
      setAccount(accountData.data)

      const historyData = await getLoyaltyTransactionEntries({
        ...(!!userGroupId ? { userGroupId } : { userId }),
        limit: 100,
      })
      setHistory(historyData.data)
      setIsLoading(false)
    }
    fetchInitialData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full min-h-[60vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
          <div className="animate-ping absolute inset-0 rounded-full h-16 w-16 border-4 border-blue-500 opacity-20"></div>
        </div>
      </div>
    )
  }

  const totalPoints = account?.[0]?.amount ? Number(account[0].amount) : 0
  const userName = profile?.[0]?.user?.walletAddress || 'User'

  return (
    <div className="flex flex-col gap-8 w-full items-start justify-start max-w-7xl mx-auto p-4 sm:p-8">
      {/* Hero Header */}
      <div className="w-full text-center space-y-4 py-8">
        <div className="inline-block">
          <h1 className="text-6xl sm:text-7xl font-black bg-gradient-to-r from-blue-400 via-purple-500 to-pink-600 bg-clip-text text-transparent animate-gradient">
            My Profile
          </h1>
          <div className="h-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-600 rounded-full mt-2 animate-pulse"></div>
        </div>
        <div className="inline-block px-6 py-3 bg-gradient-to-r from-gray-700/50 to-gray-800/50 backdrop-blur-xl rounded-full border border-gray-600/30">
          <span className="text-sm text-gray-400">Wallet: </span>
          <span className="font-mono text-white">{userName.slice(0, 10)}...{userName.slice(-8)}</span>
        </div>
      </div>

      {/* Stats Card */}
      <div className="w-full bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="text-6xl">{'🏆'}</div>
            <div>
              <h3 className="text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-300 to-orange-500 bg-clip-text">
                Total Points
              </h3>
              <p className="text-sm text-gray-400">Your accumulated rewards</p>
            </div>
          </div>
          <div className="text-6xl font-black text-transparent bg-gradient-to-r from-yellow-300 to-orange-500 bg-clip-text">
            {totalPoints.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="w-full">
        <h2 className="text-4xl font-bold mb-6 text-transparent bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text flex items-center gap-3">
          <span className="text-3xl">{'📜'}</span> Transaction History
        </h2>
        <Table<
          TransactionGetTransactionEntriesResponse.Data & {
            loyaltyTransaction?: {
              description?: string
            }
            loyaltyAccountEndAmount?: string
          }
        >
          data={history}
          getRowKey={(i) => i.id}
          columns={[
            {
              key: 'direction',
              label: 'Type',
              render: (i) => (
                <span className={`px-3 py-1 rounded-lg font-semibold ${
                  i.direction === 'credit' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {i.direction === 'credit' ? '+ Credit' : '- Debit'}
                </span>
              ),
            },
            {
              key: 'loyaltyTransaction',
              label: 'Description',
              render: (i) =>
                i?.loyaltyTransaction?.loyaltyRule?.name ??
                (i.loyaltyTransaction?.description || 'Transaction'),
            },
            {
              key: 'amount',
              label: 'Amount',
              render: (i) => (
                <span className="font-bold text-white">
                  {Number(i.amount || 0).toLocaleString()}
                </span>
              ),
            },
            {
              key: 'loyaltyAccountEndAmount',
              label: 'Balance',
              render: (i) => (
                <span className="text-gray-400">
                  {Number(i.loyaltyAccountEndAmount || 0).toLocaleString()}
                </span>
              ),
            },
            {
              key: 'createdAt',
              label: 'Date',
              render: (i) => {
                const date = new Date(i.createdAt || '')
                return (
                  <span className="text-gray-400">
                    {date.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )
              },
            },
          ]}
        />
      </div>
    </div>
  )
}
