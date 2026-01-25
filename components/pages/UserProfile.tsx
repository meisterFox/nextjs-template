'use client'

import { Header } from '@/components/ui/Header'
import { Table } from '@/components/ui/Table'
import EditProfile, { ProfileFormData } from './EditProfile'
import { getLoyaltyAccount } from '@/lib/actions/getLoyaltyAccount'
import { getLoyaltyTransactionEntries } from '@/lib/actions/getLoyaltyTransactionEntries'
import { getProfileDetails } from '@/lib/actions/getProfileDetails'
import { updateUserProfile } from '@/lib/actions/updateUserProfile'
import { useWebsiteContext } from '@/components/providers/WebsiteProvider'
import { AccountListResponse } from '@snagsolutions/sdk/resources/loyalty/accounts.mjs'
import { TransactionGetTransactionEntriesResponse } from '@snagsolutions/sdk/resources/loyalty/transactions.mjs'
import { MetadataListResponse } from '@snagsolutions/sdk/resources/users/metadatas.mjs'
import { UserListResponse } from '@snagsolutions/sdk/resources/users/users.mjs'
import { useEffect, useState } from 'react'
import { useBalance, useAccount } from 'wagmi'

interface UserProfileProps {
  userId: string
}

export const UserProfile = ({ userId }: UserProfileProps) => {
  const { website } = useWebsiteContext()
  const { address: connectedAddress } = useAccount()
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [profile, setProfile] = useState<Array<UserListResponse.Data>>([])
  const [account, setAccount] = useState<Array<AccountListResponse.Data>>([])
  const [history, setHistory] = useState<
    Array<TransactionGetTransactionEntriesResponse.Data>
  >([])

  // Get IDs from environment and website context
  const websiteId = process.env.NEXT_PUBLIC_WEBSITE_ID || website?.id
  const organizationId = process.env.NEXT_PUBLIC_ORGANIZATION_ID

  // Get balance from connected wallet
  const { data: balanceData } = useBalance({
    address: connectedAddress,
  })

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

  useEffect(() => {
    if (userId) {
      fetchInitialData()
    }
  }, [userId])

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
  const userResponse = profile?.[0]
  const userName = userResponse?.walletAddress || 'User'
  const userMeta = userResponse?.userMetadata?.[0]

  // Get organization and website IDs from profile data or context
  const profileOrgId = organizationId
  const profileWebsiteId = websiteId

  // Early return if required IDs are missing
  if (!websiteId || !organizationId) {
    return (
      <div className="flex items-center justify-center w-full min-h-[60vh]">
        <p className="text-slate-400">Loading website configuration...</p>
      </div>
    )
  }

  const handleSaveProfile = async (formData: ProfileFormData) => {
    try {
      // Convert image file for upload if provided
      let photoFile = undefined
      if (formData.profileImage) {
        const reader = new FileReader()
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(formData.profileImage!)
        })
        
        photoFile = {
          base64,
          name: formData.profileImage.name,
          size: formData.profileImage.size,
        }
      }

      if (!profileWebsiteId || !profileOrgId) {
        throw new Error('Website or organization ID is missing')
      }

      await updateUserProfile({
        userId,
        websiteId: profileWebsiteId,
        organizationId: profileOrgId,
        displayName: formData.displayName,
        location: formData.location,
        portfolioUrl: formData.portfolioUrl,
        about: formData.about,
        photoFile,
      })

      // Refresh profile data
      await fetchInitialData()
    } catch (error) {
      console.error('Error saving profile:', error)
      throw error
    }
  }

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

      {/* Profile Info Card with Edit Button */}
      <div className="w-full bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Profile Image & Basic Info */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-slate-600/50 flex items-center justify-center flex-shrink-0">
              {userMeta?.logoUrl ? (
                <img
                  src={userMeta.logoUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-4xl">👤</div>
              )}
            </div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              Edit Profile
            </button>
          </div>

          {/* Profile Details */}
          <div className="flex-1 space-y-4">
            {userMeta?.displayName && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Display Name</p>
                <p className="text-2xl font-bold text-white">{userMeta.displayName}</p>
              </div>
            )}

            {userMeta?.location && (
              <div>
                <p className="text-sm text-slate-400 mb-1">📍 Location</p>
                <p className="text-lg text-white">{userMeta.location}</p>
              </div>
            )}

            {userMeta?.portfolioUrl && (
              <div>
                <p className="text-sm text-slate-400 mb-1">🎨 NFT Portfolio</p>
                <a
                  href={userMeta.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors break-all"
                >
                  {userMeta.portfolioUrl}
                </a>
              </div>
            )}

            {userMeta?.bio && (
              <div>
                <p className="text-sm text-slate-400 mb-1">📝 About</p>
                <p className="text-white text-sm leading-relaxed">{userMeta.bio}</p>
              </div>
            )}

            {!userMeta?.displayName && !userMeta?.location && !userMeta?.portfolioUrl && !userMeta?.bio && (
              <p className="text-slate-400 italic">No profile details yet. Click "Edit Profile" to add information.</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfile
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentProfile={{
          displayName: userMeta?.displayName || '',
          location: userMeta?.location || '',
          portfolioUrl: userMeta?.portfolioUrl || '',
          about: userMeta?.bio || '',
          profileImage: userMeta?.logoUrl || '',
        }}
        onSave={handleSaveProfile}
      />

      {/* Connected Accounts & Balance Section */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connected Accounts */}
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 shadow-2xl">
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            🔗 Connected Accounts
          </h3>
          <div className="space-y-3">
            {userMeta?.twitterUser && (
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🐦</span>
                  <div>
                    <p className="text-sm text-slate-400">Twitter</p>
                    <p className="text-white font-semibold">@{userMeta.twitterUser}</p>
                  </div>
                </div>
                <span className="text-green-400 text-xs">✓ Connected</span>
              </div>
            )}

            {userMeta?.discordUser && (
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💬</span>
                  <div>
                    <p className="text-sm text-slate-400">Discord</p>
                    <p className="text-white font-semibold">{userMeta.discordUser}</p>
                  </div>
                </div>
                <span className="text-green-400 text-xs">✓ Connected</span>
              </div>
            )}

            {userMeta?.telegramUsername && (
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✈️</span>
                  <div>
                    <p className="text-sm text-slate-400">Telegram</p>
                    <p className="text-white font-semibold">@{userMeta.telegramUsername}</p>
                  </div>
                </div>
                <span className="text-green-400 text-xs">✓ Connected</span>
              </div>
            )}

            {!userMeta?.twitterUser && !userMeta?.discordUser && !userMeta?.telegramUsername && (
              <p className="text-slate-400 italic text-sm">No connected accounts yet</p>
            )}
          </div>
        </div>

        {/* Wallet Balance */}
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 shadow-2xl">
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            💰 Wallet Balance
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">
                    {balanceData?.symbol || 'Ethereum'}
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {balanceData 
                      ? `${parseFloat(balanceData.formatted).toFixed(4)} ${balanceData.symbol}` 
                      : '-- ETH'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {connectedAddress ? 'Real-time balance' : 'Connect wallet to view'}
                  </p>
                </div>
                <div className="text-4xl">⟠</div>
              </div>
            </div>
          </div>
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
