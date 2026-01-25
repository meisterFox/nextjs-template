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
      <div className="flex flex-col items-center justify-center w-full min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 animate-float flex items-center justify-center text-4xl">
            🎯
          </div>
          <div className="absolute -inset-4 bg-violet-500/20 rounded-3xl blur-2xl animate-pulse-glow"></div>
        </div>
        <p className="text-slate-400 animate-pulse">Loading quests...</p>
      </div>
    )
  }

  if (isInitialLoad) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 animate-float flex items-center justify-center text-4xl">
            ⚡
          </div>
          <div className="absolute -inset-4 bg-fuchsia-500/20 rounded-3xl blur-2xl animate-pulse-glow"></div>
        </div>
        <p className="text-slate-400 animate-pulse">Preparing your quests...</p>
      </div>
    )
  }

  const isLoyaltyProgramConfigured = rules?.length > 0

  if (!isLoyaltyProgramConfigured) {
    return (
      <div className="flex flex-col gap-6 w-full items-center justify-center min-h-[60vh] max-w-2xl mx-auto text-center p-8">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-5xl mb-4">
          📋
        </div>
        <h1 className="text-4xl font-bold text-white">No Rules Found</h1>
        <p className="text-slate-400 leading-relaxed">
          You need to configure your loyalty program first. Go to{' '}
          <Link href="https://admin.snag-solutions.io" target="_blank" className="text-violet-400 hover:text-violet-300 underline">
            Snag Admin
          </Link>{' '}
          and create a loyalty currency, then run the script to create example rules.
        </p>
        <Code data={`pnpm create:rules`} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10 w-full items-start justify-start max-w-7xl mx-auto p-4 sm:p-8">
      {/* Hero Header */}
      <div className="w-full text-center space-y-6 py-12 relative">
        {/* Background Glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-violet-600/20 via-fuchsia-500/20 to-orange-500/20 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="inline-block animate-fadeIn">
          <span className="px-4 py-2 glass-card rounded-full text-sm text-violet-300 mb-4 inline-block">
            🎯 Earn Rewards
          </span>
          <h1 className="text-5xl sm:text-7xl font-black text-gradient-rainbow mt-4">
            Quest Rules
          </h1>
          <div className="h-1.5 w-36 mx-auto bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-500 rounded-full mt-4 animate-pulse-glow"></div>
        </div>
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto animate-fadeIn stagger-1">
          Complete quests, earn rewards, and unlock amazing multipliers
        </p>
      </div>

      {/* Multiplier Stats Card */}
      {!!multipliers?.length && (
        <div className="w-full glass-card card-hover rounded-2xl p-6 sm:p-8 neon-purple animate-fadeIn stagger-1">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-4xl shadow-lg shadow-amber-500/30 animate-float">
                ⚡
              </div>
              <div>
                <p className="text-sm text-slate-400 uppercase tracking-wider">Your Total</p>
                <h3 className="text-2xl font-bold text-white">Multiplier</h3>
              </div>
            </div>
            <div className="text-5xl font-black text-gradient-rainbow">
              {calcUserTotalMultiplier()}x
            </div>
          </div>
          <a
            className="text-sm text-violet-400 hover:text-violet-300 transition-colors mt-4 inline-flex items-center gap-2"
            target="_blank"
            href="https://docs.snagsolutions.io/loyalty/multipliers"
          >
            📚 Learn how multipliers work →
          </a>
        </div>
      )}

      {/* Rules Grid */}
      <div className="w-full animate-fadeIn stagger-2">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-2xl shadow-lg shadow-violet-500/30">
            🎯
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">Active Quests</h2>
            <p className="text-slate-400">{rules.length} quests available</p>
          </div>
        </div>
        
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
              className={`group glass-card card-hover rounded-2xl overflow-hidden stagger-${(ruleIndex % 5) + 1} ${completedAt ? 'border-emerald-500/30' : ''}`}
            >
              {/* Completed Badge */}
              {completedAt && (
                <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-emerald-500/30 flex items-center gap-2">
                  ✓ Completed
                </div>
              )}

              <div className="flex flex-col lg:flex-row gap-6 p-6">
                {/* Rule Image */}
                {rule?.mediaUrl && (
                  <div className="flex-shrink-0 w-full lg:w-48 h-48 relative overflow-hidden rounded-xl glass group-hover:scale-105 transition-transform duration-500">
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
                    <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-violet-300 transition-colors">
                      {rule?.name}
                    </h3>
                    <p className="text-slate-400 leading-relaxed">
                      {rule?.description}
                    </p>
                  </div>

                  {/* Status Indicators */}
                  <div className="flex flex-wrap gap-3">
                    {completedAt && (
                      <div className="glass rounded-xl px-4 py-3 border border-emerald-500/30">
                        <div className="text-sm text-emerald-400 font-semibold flex items-center gap-2">
                          🎉 Completed: {new Date(completedAt).toLocaleDateString()}
                        </div>
                        {!!transaction && (
                          <div className="text-xs text-emerald-300 mt-1">
                            +{transaction.amount} points earned
                          </div>
                        )}
                        {!!loyaltyMultiplier && (
                          <div className="text-xs text-amber-300 mt-1 flex items-center gap-1">
                            ⚡ {loyaltyMultiplier.multiplier}x multiplier
                          </div>
                        )}
                      </div>
                    )}

                    {processingStatus && (
                      <div className={`glass rounded-xl px-4 py-3 ${
                        processingStatus.status === 'pending'
                          ? 'border border-amber-500/30'
                          : processingStatus.status === 'completed'
                          ? 'border border-emerald-500/30'
                          : 'border border-red-500/30'
                      }`}>
                        <div className={`text-sm font-semibold flex items-center gap-2 ${
                          processingStatus.status === 'pending'
                            ? 'text-amber-400'
                            : processingStatus.status === 'completed'
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}>
                          {processingStatus.status === 'pending' && <>⏳ Processing...</>}
                          {processingStatus.status === 'completed' && <>✓ Complete</>}
                          {processingStatus.status === 'failed' && <>✕ Failed</>}
                        </div>
                        {processingStatus.message && (
                          <div className="text-xs text-slate-400 mt-1">
                            {processingStatus.message}
                          </div>
                        )}
                      </div>
                    )}

                    {!!progress && (
                      <div className="glass rounded-xl px-4 py-3 border border-cyan-500/30">
                        <div className="text-sm text-cyan-400 font-semibold flex items-center gap-2">
                          📊 Progress: {progress.progress}%
                        </div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Time Information */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {rule.startTime && (
                      <span className="text-slate-500 flex items-center gap-1">
                        🕐 Started: {new Date(rule.startTime).toLocaleDateString()}
                      </span>
                    )}
                    {rule.endTime && (
                      <span className="text-orange-400 font-semibold flex items-center gap-1 animate-pulse">
                        ⏰ Expires: {new Date(rule.endTime).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 justify-center items-end min-w-fit">
                  {!!ruleMetadata?.cta?.href && (
                    <a
                      href={ruleMetadata?.cta?.href}
                      target="_blank"
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105 flex items-center gap-2 whitespace-nowrap"
                    >
                      {ruleMetadata?.cta?.label ?? 'Learn More'} →
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
          <div className="w-full flex justify-center mt-10">
            <button
              onClick={() => loadRules(lastId || undefined)}
              disabled={isLoading}
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <span className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Loading...
                </span>
              ) : (
                'Load More Quests →'
              )}
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
