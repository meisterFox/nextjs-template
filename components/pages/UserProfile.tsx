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

    // Use connected wallet address if available, otherwise use userId
    const queryParams = connectedAddress
      ? { walletAddress: connectedAddress }
      : { userId }

    const profileData = await getProfileDetails(queryParams)
    setProfile(profileData.data)

    const userGroupId =
      profileData.data?.[0]?.userMetadata?.[0]?.userGroupId ?? undefined

    // Get the actual userId from profile if queried by wallet
    const profileUserId = profileData.data?.[0]?.id || userId

    const accountData = await getLoyaltyAccount({
      ...(!!userGroupId ? { userGroupId } : { userId: profileUserId }),
    })
    setAccount(accountData.data)

    const historyData = await getLoyaltyTransactionEntries({
      ...(!!userGroupId ? { userGroupId } : { userId: profileUserId }),
      limit: 100,
    })
    setHistory(historyData.data)
    setIsLoading(false)
  }

  useEffect(() => {
    if (userId) {
      fetchInitialData()
    }
  }, [userId, connectedAddress]) // Also refetch when wallet changes

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
  // Use connected wallet address (from Wagmi) as primary, fallback to profile data
  const displayWalletAddress =
    connectedAddress || userResponse?.walletAddress || 'User'
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
      <div className="w-full text-center space-y-6 py-12 relative">
        {/* Background Glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-violet-600/20 via-fuchsia-500/20 to-cyan-500/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="inline-block animate-fadeIn">
          <span className="px-4 py-2 glass-card rounded-full text-sm text-violet-300 mb-4 inline-block">
            👤 Your Dashboard
          </span>
          <h1 className="text-5xl sm:text-7xl font-black text-gradient-purple mt-4">
            My Profile
          </h1>
          <div className="h-1.5 w-32 mx-auto bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 rounded-full mt-4 animate-pulse-glow"></div>
        </div>
        <div className="inline-flex items-center gap-3 px-6 py-4 glass-card rounded-2xl animate-fadeIn stagger-1">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-sm text-slate-400">Wallet: </span>
          <span className="font-mono text-white">
            {displayWalletAddress.slice(0, 10)}...
            {displayWalletAddress.slice(-6)}
          </span>
        </div>
      </div>

      {/* Profile Info Card with Edit Button */}
      <div className="w-full glass-card rounded-3xl p-8 animate-fadeIn stagger-1">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Profile Image & Basic Info */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-2xl overflow-hidden glass flex items-center justify-center flex-shrink-0">
                {userMeta?.logoUrl ? (
                  <img
                    src={userMeta.logoUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-5xl">👤</div>
                )}
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity -z-10"></div>
            </div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105"
            >
              ✏️ Edit Profile
            </button>
          </div>

          {/* Profile Details */}
          <div className="flex-1 space-y-4">
            {userMeta?.displayName && (
              <div className="glass rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">
                  Display Name
                </p>
                <p className="text-2xl font-bold text-white">
                  {userMeta.displayName}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userMeta?.location && (
                <div className="glass rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">
                    📍 Location
                  </p>
                  <p className="text-lg text-white">{userMeta.location}</p>
                </div>
              )}

              {userMeta?.portfolioUrl && (
                <div className="glass rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">
                    🎨 Portfolio
                  </p>
                  <a
                    href={userMeta.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors break-all text-sm"
                  >
                    {userMeta.portfolioUrl}
                  </a>
                </div>
              )}
            </div>

            {userMeta?.bio && (
              <div className="glass rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">
                  📝 About
                </p>
                <p className="text-white text-sm leading-relaxed">
                  {userMeta.bio}
                </p>
              </div>
            )}

            {!userMeta?.displayName &&
              !userMeta?.location &&
              !userMeta?.portfolioUrl &&
              !userMeta?.bio && (
                <div className="glass rounded-xl p-6 text-center">
                  <p className="text-slate-400">
                    No profile details yet. Click "Edit Profile" to add
                    information.
                  </p>
                </div>
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

      {/* Stats Cards */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn stagger-2">
        {/* Total Points */}
        <div className="md:col-span-1 glass-card card-hover rounded-2xl p-6 neon-purple">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30">
              🏆
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">
                Total Points
              </p>
              <p className="text-3xl font-black text-gradient-rainbow">
                {totalPoints.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Wallet Balance */}
        <div className="md:col-span-1 glass-card card-hover rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/30">
              💎
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">
                {balanceData?.symbol || 'ETH'} Balance
              </p>
              <p className="text-2xl font-bold text-white">
                {balanceData
                  ? parseFloat(balanceData.formatted).toFixed(4)
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Connected Accounts Count */}
        <div className="md:col-span-1 glass-card card-hover rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-3xl shadow-lg shadow-violet-500/30">
              🔗
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">
                Connected
              </p>
              <p className="text-2xl font-bold text-white">
                {
                  [
                    userMeta?.twitterUser,
                    userMeta?.discordUser,
                    userMeta?.telegramUsername,
                  ].filter(Boolean).length
                }{' '}
                Accounts
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="w-full glass-card rounded-2xl p-6 animate-fadeIn stagger-3">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-xl shadow-lg shadow-violet-500/30">
            🔗
          </div>
          <h3 className="text-xl font-bold text-white">Connected Accounts</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {userMeta?.twitterUser && (
            <div className="glass rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-sky-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">Twitter/X</p>
                <p className="text-white font-semibold truncate">
                  @{userMeta.twitterUser}
                </p>
              </div>
              <span className="text-emerald-400 text-xs">✓</span>
            </div>
          )}

          {userMeta?.discordUser && (
            <div className="glass rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-indigo-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">Discord</p>
                <p className="text-white font-semibold truncate">
                  {userMeta.discordUser}
                </p>
              </div>
              <span className="text-emerald-400 text-xs">✓</span>
            </div>
          )}

          {userMeta?.telegramUsername && (
            <div className="glass rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-lg">
                ✈️
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">Telegram</p>
                <p className="text-white font-semibold truncate">
                  @{userMeta.telegramUsername}
                </p>
              </div>
              <span className="text-emerald-400 text-xs">✓</span>
            </div>
          )}

          {!userMeta?.twitterUser &&
            !userMeta?.discordUser &&
            !userMeta?.telegramUsername && (
              <div className="col-span-full glass rounded-xl p-6 text-center">
                <p className="text-slate-400">No connected accounts yet</p>
              </div>
            )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="w-full animate-fadeIn stagger-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-xl shadow-lg shadow-violet-500/30">
            📜
          </div>
          <h2 className="text-2xl font-bold text-white">Transaction History</h2>
        </div>

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
                <span
                  className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${
                    i.direction === 'credit'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {i.direction === 'credit' ? '↑ Credit' : '↓ Debit'}
                </span>
              ),
            },
            {
              key: 'loyaltyTransaction',
              label: 'Description',
              render: (i) => (
                <span className="text-slate-300">
                  {i?.loyaltyTransaction?.loyaltyRule?.name ??
                    (i.loyaltyTransaction?.description || 'Transaction')}
                </span>
              ),
            },
            {
              key: 'amount',
              label: 'Amount',
              render: (i) => (
                <span
                  className={`font-bold ${i.direction === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {i.direction === 'credit' ? '+' : '-'}
                  {Number(i.amount || 0).toLocaleString()}
                </span>
              ),
            },
            {
              key: 'loyaltyAccountEndAmount',
              label: 'Balance',
              render: (i) => (
                <span className="text-violet-300 font-semibold">
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
                  <span className="text-slate-400 text-sm">
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
