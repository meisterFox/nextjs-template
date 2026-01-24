'use server'

import { snag } from '@/lib/snag'
import { MintingGetAssetsResponse } from '@snagsolutions/sdk/resources/minting/minting.mjs'

interface GetPastMintingAssetsParams {
  websiteId: string
}

export async function getPastMintingAssets({
  websiteId,
}: GetPastMintingAssetsParams): Promise<MintingGetAssetsResponse['data']> {
  try {
    const response = await snag.minting.getAssets({
      organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
      websiteId,
      includeMetadata: true,
      includeDeleted: false,
      // no status filter here; some backends error on it and we want all ended items
    })

    return response.data || []
  } catch (error) {
    console.error('getPastMintingAssets failed', error)
    return []
  }
}
