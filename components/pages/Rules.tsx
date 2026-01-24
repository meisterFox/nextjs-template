'use client'

import { Button } from '@/components/ui/Button'
import { Code } from '@/components/ui/Code'
import { Header } from '@/components/ui/Header'
import { claimLoyaltyRule } from '@/lib/actions/claimLoyaltyRule'
import {
  getLoyaltyRuleProgress,
  LoyaltyRuleProgressResponse,
} from '@/lib/actions/getLoyaltyRuleProgress'
import {
  getLoyaltyRules,
  RuleListResponseFull,
} from '@/lib/actions/getLoyaltyRules'
import { getLoyaltyTransactionEntries } from '@/lib/actions/getLoyaltyTransactionEntries'
import { getLoyaltyRuleProcessingStatus } from '@/lib/actions/getLoyaltyRuleProcessingStatus'
import { RuleGetStatusResponse } from '@snagsolutions/sdk/resources/loyalty/rules'
import { useAuthAccount } from '@/lib/useAuthAccount'
import { TransactionGetTransactionEntriesResponse } from '@snagsolutions/sdk/resources/loyalty/transactions.mjs'

import { RuleCreateResponse } from '@snagsolutions/sdk/resources/loyalty/rules'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import {
  getLoyaltyMultipliers,
  LoyaltyMultiplier,
} from '@/lib/actions/getLoyaltyMultipliers'
import { UserListResponse } from '@snagsolutions/sdk/resources/users/index'
import { getProfileDetails } from '@/lib/actions/getProfileDetails'
import { LoyaltyRuleAction } from '../LoyaltyRuleAction'

const LIMIT = 10
const POLLING_INTERVAL = 5000 // 5 seconds

type TransactionEntry = TransactionGetTransactionEntriesResponse['data'][number]

export const Rules = () => {
  const {
    userId,
    isAuthenticated,
    isLoading: isSessionLoading,
  } = useAuthAccount()
  const [rules, setRules] = useState<RuleListResponseFull['data']>([])
  const [lastId, setLastId] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [latestRuleTransactions, setLatestRuleTransactions] = useState<
    Record<string, TransactionEntry>
  >({})
  const [processingRules, setProcessingRules] = useState<
    Record<string, RuleGetStatusResponse['data'][number]>
  >({})
  const [pollingTimeoutId, setPollingTimeoutId] =
    useState<NodeJS.Timeout | null>(null)

  const [rulesInProgress, setRulesInProgress] = useState<
    Record<string, NonNullable<LoyaltyRuleProgressResponse['data']>[0]>
  >({})

  const [multipliers, setMultipliers] = useState<LoyaltyMultiplier[]>([])

  const [profile, setProfile] = useState<UserListResponse['data']>([])

  const getProfile = async () => {
    if (!isAuthenticated || !userId) return
    const profile = await getProfileDetails({ userId })
    setProfile(profile.data)
  }

  // MULTIPLIERS
  const getUserFinalMultipliers = (multipliers: LoyaltyMultiplier[]) => {
    const uniqueMultipliers: Record<string, LoyaltyMultiplier> = {}

    for (const multiplier of multipliers) {
      const multiplierIdf = multiplier.loyaltyRuleId ?? multiplier.id
      if (!uniqueMultipliers[multiplierIdf]) {
        uniqueMultipliers[multiplierIdf] = multiplier
      } else {
        if (
          Number(multiplier.multiplier) >
          Number(uniqueMultipliers[multiplierIdf].multiplier)
        ) {
          uniqueMultipliers[multiplierIdf] = multiplier
        }
      }
    }

    const finalMultipliers = Object.values(uniqueMultipliers)
    return finalMultipliers
  }

  const calcUserTotalMultiplier = () => {
    const toalMultipler =
      multipliers.reduce((acc, curr) => {
        return acc + Number(curr.multiplier || 0)
      }, 0) -
      (multipliers.length - 1)

    return toalMultipler.toFixed(2)
  }

  const getMultipliers = async () => {
    if (!isAuthenticated || !userId) return

    // THIS is only required if multiple wallet profiles is enabled in the loyalty program
    // otherwise this can be ignored
    const userGroupId =
      profile?.[0]?.userMetadata?.[0]?.userGroupId ?? undefined

    // if user has a group id, use it to get the multipliers and do not pass the userId
    // this is only required if user group is required
    const multipliers = await getLoyaltyMultipliers({
      ...(!!userGroupId ? {} : { userId }),
      ...(!!userGroupId && { userGroupId }),
      limit: 1000, // using large limit to get all multipliers for now
    })
    setMultipliers(getUserFinalMultipliers(multipliers.data))
  }
  // MULTIPLIERS

  // IN PROGRESS RULES
  const loadRulesInProgress = async (ruleIds: string[]) => {
    if (!isAuthenticated || !userId) return
    const data = await getLoyaltyRuleProgress({
      userId,
      limit: LIMIT,
      loyaltyRuleId: ruleIds,
    })

    const newRulesInProgress = { ...rulesInProgress }

    data.data.forEach((rule) => {
      newRulesInProgress[rule.loyaltyRuleId] = rule
    })

    setRulesInProgress(newRulesInProgress)
  }
  // IN PROGRESS RULES

  // COMPLETED RULES
  const loadTransactionEntries = async (ruleIds: string[]) => {
    if (!isAuthenticated || !userId || !ruleIds?.length) return

    const userGroupId =
      profile?.[0]?.userMetadata?.[0]?.userGroupId ?? undefined

    const entries = await getLoyaltyTransactionEntries({
      ...(!!userGroupId ? { userGroupId } : { userId }),
      userCompletedLoyaltyRuleId: ruleIds,
      limit: Math.min(ruleIds.length, 100),
    })

    // Update transactions map
    const newTransactions = { ...latestRuleTransactions }
    entries.data.forEach((entry) => {
      const ruleId = entry.loyaltyTransaction?.loyaltyRule?.id
      if (ruleId) {
        newTransactions[ruleId] = entry
      }
    })
    setLatestRuleTransactions(newTransactions)
  }
  // COMPLETED RULES

  // PROCESSING/ENQUEUED RULES
  const checkProcessingStatus = useCallback(async () => {
    if (!isAuthenticated || !userId) return

    try {
      const status = await getLoyaltyRuleProcessingStatus({
        userId,
        organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
        websiteId: process.env.NEXT_PUBLIC_WEBSITE_ID!,
      })

      const newProcessingRules = { ...processingRules }
      let hasPendingRules = false

      status.data.forEach((statusData) => {
        newProcessingRules[statusData.loyaltyRuleId] = statusData
        if (
          statusData.status === 'pending' ||
          statusData.status === 'processing'
        ) {
          hasPendingRules = true
        }
      })

      setProcessingRules(newProcessingRules)

      // If there are still pending rules, continue polling
      if (hasPendingRules) {
        const timeoutId = setTimeout(() => {
          checkProcessingStatus()
        }, POLLING_INTERVAL)
        setPollingTimeoutId(timeoutId)
      } else {
        const ruleIds = status.data.map((s) => s.loyaltyRuleId)
        !!ruleIds?.length && loadTransactionEntries(ruleIds)
      }
    } catch (error) {
      console.error('Failed to check processing status:', error)
    }
  }, [isAuthenticated, userId, rules])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingTimeoutId) {
        clearTimeout(pollingTimeoutId)
      }
    }
  }, [pollingTimeoutId])
  // PROCESSING/ENQUEUED RULES

  // LOAD RULES
  const loadRules = async (startingAfter?: string) => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const data = await getLoyaltyRules({ limit: LIMIT, startingAfter })
      if (data?.data) {
        // Load transaction entries for the current page of rules
        const ruleIds = data.data.map((rule) => rule.id)
        await Promise.all([
          loadTransactionEntries(ruleIds),
          loadRulesInProgress(ruleIds),
          checkProcessingStatus(),
        ])

        if (startingAfter) {
          setRules((prev) => [...prev, ...data.data])
        } else {
          setRules(data.data)
        }
        setLastId(data.data[data.data.length - 1]?.id || null)
        setHasMore(data.hasNextPage)
      }
    } catch (error) {
      console.error('Failed to load rules:', error)
    } finally {
      setIsLoading(false)
    }
  }
  // LOAD RULES

  // Load rules when auth status changes
  useEffect(() => {
    if (isSessionLoading) return
    setIsInitialLoad(true)
    loadRules().finally(() => {
      setIsInitialLoad(false)
    })

    getProfile()
  }, [isAuthenticated, userId, isSessionLoading])

  useEffect(() => {
    if (!!profile?.length) {
      getMultipliers()

      // This is added here to re load transactions against the user group
      // if user is attached to a group.
      loadTransactionEntries(rules.map((r) => r.id))
    }
  }, [profile])

  if (isSessionLoading) {
    return (
      <div className="flex items-center justify-center w-full min-h-[60vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
          <div className="animate-ping absolute inset-0 rounded-full h-16 w-16 border-4 border-pink-500 opacity-20"></div>
        </div>
      </div>
    )
  }

  if (isInitialLoad) {
    return (
      <div className="flex items-center justify-center w-full min-h-[60vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
          <div className="animate-ping absolute inset-0 rounded-full h-16 w-16 border-4 border-pink-500 opacity-20"></div>
        </div>
      </div>
    )
  }

  const isLoyaltyProgramConfigured = rules?.length > 0

  if (!isLoyaltyProgramConfigured) {
    return (
      <div className="flex flex-col gap-4 w-full items-start justify-start">
        <Header as="h1">Rules</Header>
        <Header as="h4">No rules found in your loyalty program.</Header>
        <Header as="p">
          You have to prepare your loyalty program first. Please go to{' '}
          <Link href="https://admin.snag-solutions.io" target="_blank">
            <b>Snag Admin</b>
          </Link>{' '}
          and create a loyalty currency first. Then you can run the script to
          create the example rules set.
        </Header>
        <Code data={`pnpm create:rules`} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 w-full items-start justify-start max-w-7xl mx-auto p-4 sm:p-8">
      {/* Hero Header */}
      <div className="w-full text-center space-y-4 py-8">
        <div className="inline-block">
          <h1 className="text-6xl sm:text-7xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent animate-gradient">
            Quest Rules
          </h1>
          <div className="h-2 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-full mt-2 animate-pulse"></div>
        </div>
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
          Complete quests, earn rewards, and unlock amazing multipliers
        </p>
      </div>

      {/* Multiplier Stats Card */}
      {!!multipliers?.length && (
        <div className="w-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{'⚡'}</div>
              <div>
                <h3 className="text-2xl font-bold text-transparent bg-gradient-to-r from-yellow-300 to-orange-500 bg-clip-text">
                  Your Total Multiplier
                </h3>
                <p className="text-sm text-gray-400">Boost your rewards</p>
              </div>
            </div>
            <div className="text-5xl font-black text-transparent bg-gradient-to-r from-yellow-300 to-orange-500 bg-clip-text">
              {calcUserTotalMultiplier()}x
            </div>
          </div>
          <a
            className="text-sm text-indigo-400 hover:text-indigo-300 underline mt-4 inline-block transition-colors"
            target="_blank"
            href="https://docs.snagsolutions.io/loyalty/multipliers"
          >
            {'📚'} Learn how multipliers work
          </a>
        </div>
      )}

      {/* Rules Grid */}
      <div className="w-full">
        <h2 className="text-4xl font-bold mb-8 text-transparent bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text flex items-center gap-3">
          <span className="text-3xl">{'🎯'}</span> Active Quests
        </h2>
        <div className="grid grid-cols-1 gap-6">
          {rules.map((rule, ruleIndex) => {
          const transaction = latestRuleTransactions[rule.id]
          const progress = rulesInProgress[rule.id]
          const processingStatus = processingRules[rule.id]

          const loyaltyMultiplier = multipliers.find(
            (m) => m.loyaltyRuleId === rule.id
          )

          const completedAt =
            transaction?.createdAt || loyaltyMultiplier?.createdAt

          const ruleMetadata = rule?.metadata as
            | RuleCreateResponse.Metadata
            | undefined

          return (
            <div
              key={rule?.id}
              className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02]"
            >
              {/* Completed Badge */}
              {completedAt && (
                <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                  <span>{'\u2713'}</span> Completed
                </div>
              )}

              <div className="flex flex-col lg:flex-row gap-6 p-6">
                {/* Rule Image */}
                {rule?.mediaUrl && (
                  <div className="flex-shrink-0 w-full lg:w-48 h-48 relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:scale-105 transition-transform duration-300">
                    <img
                      src={rule?.mediaUrl}
                      alt={rule?.name ?? ''}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                )}

                {/* Rule Content */}
                <div className="flex-1 flex flex-col gap-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-transparent bg-gradient-to-r from-white to-gray-300 bg-clip-text">
                      {rule?.name}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {rule?.description}
                    </p>
                  </div>

                  {/* Status Indicators */}
                  <div className="flex flex-wrap gap-3">
                    {completedAt && (
                      <div className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 backdrop-blur-sm">
                        <div className="text-sm text-green-400 font-semibold">
                          {'\ud83c\udf89'} Completed: {new Date(completedAt).toLocaleDateString()}
                        </div>
                        {!!transaction && (
                          <div className="text-xs text-green-300 mt-1">
                            Reward: {transaction.amount} points
                          </div>
                        )}
                        {!!loyaltyMultiplier && (
                          <div className="text-xs text-yellow-300 mt-1">
                            {'\u26a1'} Multiplier: {loyaltyMultiplier.multiplier}x
                          </div>
                        )}
                      </div>
                    )}

                    {processingStatus && (
                      <div className={`px-4 py-2 rounded-lg backdrop-blur-sm ${
                        processingStatus.status === 'pending'
                          ? 'bg-yellow-500/20 border border-yellow-500/30'
                          : processingStatus.status === 'completed'
                          ? 'bg-green-500/20 border border-green-500/30'
                          : 'bg-red-500/20 border border-red-500/30'
                      }`}>
                        <div className={`text-sm font-semibold ${
                          processingStatus.status === 'pending'
                            ? 'text-yellow-400'
                            : processingStatus.status === 'completed'
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}>
                          {processingStatus.status === 'pending' && <>{'\u23f3'} Processing...</>}
                          {processingStatus.status === 'completed' && <>{'\u2713'} Complete</>}
                          {processingStatus.status === 'failed' && <>{'\u2717'} Failed</>}
                        </div>
                        {processingStatus.message && (
                          <div className="text-xs text-gray-400 mt-1">
                            {processingStatus.message}
                          </div>
                        )}
                      </div>
                    )}

                    {!!progress && (
                      <div className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm">
                        <div className="text-sm text-blue-400 font-semibold">
                          {'\ud83d\udcca'} Progress: {progress.progress}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Time Information */}
                  <div className="flex flex-wrap gap-3 text-sm">
                    {rule.startTime && (
                      <div className="text-gray-500">
                        {'\ud83d\udd50'} Started: {new Date(rule.startTime).toLocaleDateString()}
                      </div>
                    )}
                    {rule.endTime && (
                      <div className="text-red-400 font-semibold animate-pulse">
                        {'\u23f0'} Expires: {new Date(rule.endTime).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 justify-center items-end min-w-fit">
                  {!!ruleMetadata?.cta?.href && (
                    <a
                      href={ruleMetadata?.cta?.href}
                      target="_blank"
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 whitespace-nowrap"
                    >
                      {ruleMetadata?.cta?.label ?? 'Learn More'} {'\u2192'}
                    </a>
                  )}

                  {!!profile?.[0] && (
                    <LoyaltyRuleAction
                      user={profile?.[0]}
                      rule={rule}
                      latestTransaction={transaction}
                      loyaltyMultiplier={loyaltyMultiplier}
                      processingStatus={processingStatus}
                      onClaim={({ message }) => {
                        alert(message)
                        checkProcessingStatus()
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {hasMore && (
          <div className="w-full flex justify-center mt-8">
            <button
              onClick={() => loadRules(lastId || undefined)}
              disabled={isLoading}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-2xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <span className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Loading...
                </span>
              ) : (
                'Load More Quests'
              )}
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
