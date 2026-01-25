'use client'

import { useState, useEffect } from 'react'
import { useWebsiteContext } from '@/components/providers/WebsiteProvider'
import { getPastMintingAssets } from '@/lib/actions/getPastMintingAssets'
import { Code } from '@/components/ui/Code'

export const DebugPastPage = () => {
  const { website } = useWebsiteContext()
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!website?.id) return
      setIsLoading(true)
      try {
        const result = await getPastMintingAssets({ websiteId: website.id })
        setData(result)
      } catch (error: any) {
        setData({ error: error.message })
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [website?.id])

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">
          Debug Past Rewards Data
        </h1>
        <p className="text-gray-400 mt-2">
          Check field names from API response
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        </div>
      ) : data ? (
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
          <Code data={data} />
        </div>
      ) : (
        <p className="text-center text-gray-400">No data loaded yet</p>
      )}
    </div>
  )
}
