'use client'

import { useWalletAccount } from '@/components/providers/WalletAccountProvider'
import { useWebsiteContext } from '@/components/providers/WebsiteProvider'
import { Button } from '@/components/ui/Button'
import { Code } from '@/components/ui/Code'
import { Header } from '@/components/ui/Header'
import { getMintingContracts } from '@/lib/actions/getMintingContracts'
import { getMintingContractAssets } from '@/lib/actions/getMintingContractAssets'
import { mintMintingContractAsset } from '@/lib/actions/mintMintingContractAsset'
import { updateMintingStatus } from '@/lib/actions/updateMintingStatus'
import {
  erc1155MintWithSignatureAbi,
  erc721MintWithSignatureAbi,
  NATIVE_TOKEN_ADDRESS,
} from '@/lib/minting/abis'
import { getChainIdFromNetwork } from '@/lib/chains'
import {
  getReadyWalletClient,
  sleep,
  toBigInt,
  waitForMintSignature,
} from '@/lib/minting/utils'
import { useAuthAccount } from '@/lib/useAuthAccount'
import { ContractListResponse } from '@snagsolutions/sdk/resources/minting/contracts.mjs'
import { MintingGetAssetsResponse } from '@snagsolutions/sdk/resources/minting/minting.mjs'
import { useEffect, useState } from 'react'
import { useAccount, useConfig, useConnect, usePublicClient } from 'wagmi'

export const Minting = () => {
  const { website, isLoading: isWebsiteLoading } = useWebsiteContext()
  const { walletAddress, connect } = useAuthAccount()
  const walletAccount = useWalletAccount()
  const { isConnected } = useAccount()
  const wagmiConfig = useConfig()
  const { connectAsync, connectors } = useConnect()
  const publicClient = usePublicClient()
  const [contracts, setContracts] = useState<ContractListResponse['data']>([])
  const [isLoading, setIsLoading] = useState(true)
  const [assetsByContract, setAssetsByContract] = useState<
    Record<string, MintingGetAssetsResponse['data']>
  >({})
  const [assetsLoadingByContract, setAssetsLoadingByContract] = useState<
    Record<string, boolean>
  >({})
  const [mintingByAsset, setMintingByAsset] = useState<Record<string, boolean>>(
    {}
  )


  useEffect(() => {
    const fetchContracts = async () => {
      setIsLoading(true)
      const data = await getMintingContracts()
      setContracts(data)
      setIsLoading(false)
    }

    fetchContracts()
  }, [])

  const handleToggle = async (contractId: string, isOpen: boolean) => {
    if (!isOpen) return
    if (assetsByContract[contractId] || assetsLoadingByContract[contractId]) {
      return
    }
    if (!website?.id) return

    setAssetsLoadingByContract((prev) => ({ ...prev, [contractId]: true }))
    try {
      const assets = await getMintingContractAssets({
        contractId,
        websiteId: website.id,
      })
      setAssetsByContract((prev) => ({ ...prev, [contractId]: assets }))
    } finally {
      setAssetsLoadingByContract((prev) => ({ ...prev, [contractId]: false }))
    }
  }

  const handleMint = async (
    contract: ContractListResponse.Data,
    assetId: string
  ) => {
    if (!walletAddress) {
      await connect()
      return
    }

    setMintingByAsset((prev) => ({ ...prev, [assetId]: true }))
    try {
      const chainId = getChainIdFromNetwork(contract.network)
      if (!chainId) {
        throw new Error('Unsupported network for minting.')
      }

      if (walletAccount.chainId && walletAccount.chainId !== chainId) {
        await walletAccount.switchNetwork({ networkChainId: chainId })
        await sleep(500)
      }

      if (!isConnected) {
        const firstConnector = connectors?.[0]
        if (firstConnector) {
          await connectAsync({ connector: firstConnector })
        }
      }

      const walletClient = await getReadyWalletClient(wagmiConfig, chainId)
      if (!walletClient) {
        throw new Error('Wallet client not ready.')
      }
      if (!publicClient) {
        throw new Error('Public client not ready.')
      }

      const response = await mintMintingContractAsset({
        assetId,
        contractId: contract.id,
        walletAddress,
      })

      const statusId = response.mintingContractAssetMintStatusId
      const signaturePayload = await waitForMintSignature(statusId)
      const payload = signaturePayload.payload || {}

      const currency =
        (payload.currency as string | undefined) ||
        (payload.currencyAddress as string | undefined)
      const missingFields = [
        ['to', payload.to],
        ['royaltyRecipient', payload.royaltyRecipient],
        ['primarySaleRecipient', payload.primarySaleRecipient],
        ['uri', payload.uri],
        ['currency', currency],
        ['uid', payload.uid],
      ]
        .filter(([, value]) => !value)
        .map(([key]) => key)
      if (missingFields.length > 0) {
        throw new Error(
          `Mint signature missing fields: ${missingFields.join(', ')}`
        )
      }
      const isNative =
        currency?.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()

      const erc1155Quantity = toBigInt(payload.quantity) ?? BigInt(1)
      const erc721Price = toBigInt(payload.price) ?? BigInt(0)
      const erc1155PricePerToken = toBigInt(payload.pricePerToken) ?? BigInt(0)
      const valueToSend =
        contract.tokenType === 'erc1155'
          ? isNative
            ? erc1155PricePerToken * erc1155Quantity
            : BigInt(0)
          : isNative
            ? erc721Price
            : BigInt(0)

      const mintRequest721 = {
        to: payload.to,
        royaltyRecipient: payload.royaltyRecipient,
        royaltyBps: toBigInt(payload.royaltyBps) ?? BigInt(0),
        primarySaleRecipient: payload.primarySaleRecipient,
        uri: payload.uri,
        price: erc721Price,
        currency: currency,
        validityStartTimestamp:
          toBigInt(payload.validityStartTimestamp) ?? BigInt(0),
        validityEndTimestamp: toBigInt(payload.validityEndTimestamp) ?? BigInt(0),
        uid: payload.uid,
      }

      const mintRequest1155 = {
        to: payload.to,
        royaltyRecipient: payload.royaltyRecipient,
        royaltyBps: toBigInt(payload.royaltyBps) ?? BigInt(0),
        primarySaleRecipient: payload.primarySaleRecipient,
        tokenId: toBigInt(payload.tokenId) ?? BigInt(0),
        uri: payload.uri,
        quantity: erc1155Quantity,
        pricePerToken: erc1155PricePerToken,
        currency: currency,
        validityStartTimestamp:
          toBigInt(payload.validityStartTimestamp) ?? BigInt(0),
        validityEndTimestamp: toBigInt(payload.validityEndTimestamp) ?? BigInt(0),
        uid: payload.uid,
      }

      const abiToUse =
        contract.tokenType === 'erc1155'
          ? erc1155MintWithSignatureAbi
          : erc721MintWithSignatureAbi

      const args =
        contract.tokenType === 'erc1155'
          ? [mintRequest1155, signaturePayload.signature]
          : [mintRequest721, signaturePayload.signature]

      const txHash = await walletClient.writeContract({
        address: contract.address as `0x${string}`,
        abi: abiToUse,
        functionName: 'mintWithSignature',
        args: args as any,
        value: valueToSend,
        chain: walletClient.chain,
      })

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      })

      if (receipt.status === 'reverted') {
        await updateMintingStatus(statusId, {
          status: 'failed',
          txHash,
        })
        throw new Error('Minting transaction reverted.')
      }

      await updateMintingStatus(statusId, {
        status: 'minted',
        txHash,
      })

      alert('Mint successful.')
    } catch (error: any) {
      alert(
        error?.message
          ? `${error?.title ? `${error.title} - ` : ''}${error.message}`
          : 'Failed to start mint.'
      )
    } finally {
      setMintingByAsset((prev) => ({ ...prev, [assetId]: false }))
    }
  }

  return (
    <div className="flex flex-col gap-10 w-full items-start justify-start max-w-7xl mx-auto p-4 sm:p-8">
      {/* Hero Section */}
      <div className="w-full text-center space-y-6 py-12 relative">
        {/* Background Glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-violet-500/20 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="inline-block animate-fadeIn">
          <span className="px-4 py-2 glass-card rounded-full text-sm text-cyan-300 mb-4 inline-block">
            ✨ Exclusive Digital Assets
          </span>
          <h1 className="text-5xl sm:text-7xl font-black text-gradient-cyan mt-4">
            NFT Minting
          </h1>
          <div className="h-1.5 w-32 mx-auto bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500 rounded-full mt-4 animate-pulse-glow"></div>
        </div>
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto animate-fadeIn stagger-1">
          Mint exclusive NFTs from our curated collections
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center w-full min-h-[400px] gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 animate-float flex items-center justify-center text-4xl">
              🎨
            </div>
            <div className="absolute -inset-4 bg-cyan-500/20 rounded-3xl blur-2xl animate-pulse-glow"></div>
          </div>
          <p className="text-slate-400 animate-pulse">Loading collections...</p>
        </div>
      ) : contracts.length === 0 ? (
        <div className="w-full flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4 glass-card rounded-3xl p-12">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-2xl font-bold text-white">No Contracts Available</h3>
            <p className="text-slate-400 max-w-md">
              There are currently no minting contracts available. Check back soon!
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 w-full animate-fadeIn stagger-1">
          {contracts.map((contract, idx) => {
            const assets = assetsByContract[contract.id] || []
            const isAssetsLoading = assetsLoadingByContract[contract.id]
            return (
              <details
                key={contract.id}
                className={`group w-full glass-card rounded-2xl overflow-hidden hover:neon-cyan transition-all duration-500 stagger-${(idx % 5) + 1}`}
                onToggle={(event) =>
                  handleToggle(
                    contract.id,
                    (event.currentTarget as HTMLDetailsElement).open
                  )
                }
              >
                <summary className="flex w-full items-center justify-between gap-4 cursor-pointer list-none p-6 hover:bg-white/5 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/30">
                      🖼️
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">{contract.name}</h3>
                      <p className="text-sm text-slate-500 font-mono">
                        {contract.network} • {contract.address.slice(0, 8)}...{contract.address.slice(-6)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="px-4 py-2 glass rounded-xl border border-cyan-500/30">
                      <span className="text-cyan-400 font-bold">{contract._count.mintingContractAssets}</span>
                      <span className="text-slate-400 ml-1">assets</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 glass rounded-lg">
                        {contract.tokenType === 'erc721' || contract.tokenType === 'erc721c' ? 'ERC-721' : contract.tokenType === 'erc1155' ? 'ERC-1155' : contract.tokenType}
                      </span>
                      <span className={`px-2 py-1 rounded-lg ${contract.isListed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {contract.isListed ? '✓ Listed' : '✕ Unlisted'}
                      </span>
                    </div>
                  </div>
                </summary>
                <div className="p-6 pt-0 border-t border-white/5">
                  {isWebsiteLoading ? (
                    <div className="flex items-center justify-center py-8 text-slate-400">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500 mr-3"></div>
                      Loading website context...
                    </div>
                  ) : !website?.id ? (
                    <div className="text-center py-8 text-slate-400">
                      Website ID is required to load minting assets.
                    </div>
                  ) : isAssetsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 animate-float"></div>
                    </div>
                  ) : assets.length === 0 ? (
                    <div className="text-center py-8 glass rounded-xl">
                      <div className="text-4xl mb-2">📭</div>
                      <p className="text-slate-400">No listed assets found in this contract.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 mt-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-lg">
                          💎
                        </div>
                        <h4 className="text-lg font-bold text-white">Available Assets</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {assets.map((asset: any) => (
                          <div
                            key={asset?.id}
                            className="glass card-hover rounded-xl p-5 group/card"
                          >
                            <div className="flex flex-col gap-4">
                              <div>
                                <h5 className="text-lg font-bold text-white group-hover/card:text-cyan-300 transition-colors">{asset?.name || 'Untitled NFT'}</h5>
                                <p className="text-xs text-slate-500 font-mono truncate">{asset?.id?.slice(0, 16)}...</p>
                              </div>
                              
                              <div className="flex flex-wrap gap-2">
                                <div className="px-3 py-1.5 bg-violet-500/20 border border-violet-500/30 rounded-lg text-sm text-violet-300">
                                  {Number(asset?.quantityMinted || 0)}/{Number(asset?.quantity || 0)} minted
                                </div>
                                <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-sm text-emerald-300 font-semibold">
                                  {(() => {
                                    const rawPrice = asset?.price
                                    const currencyLabel = asset?.loyaltyCurrency?.symbol || asset?.loyaltyCurrency?.name || (asset?.currencyAddress ? 'Token' : 'ETH')
                                    if (!rawPrice || Number(rawPrice) === 0) {
                                      return `FREE`
                                    }
                                    const decimals = typeof asset?.currencyDecimals === 'number' ? asset.currencyDecimals : 0
                                    const priceNumber = Number(rawPrice) / 10 ** decimals
                                    return `${priceNumber} ${currencyLabel}`
                                  })()}
                                </div>
                              </div>

                              <Button
                                variant="primary"
                                disabled={mintingByAsset[asset?.id]}
                                onClick={() => handleMint(contract, asset?.id)}
                                className="w-full"
                              >
                                {!walletAddress ? (
                                  <span className="flex items-center justify-center gap-2">
                                    🔗 Connect Wallet
                                  </span>
                                ) : mintingByAsset[asset?.id] ? (
                                  <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Minting...
                                  </span>
                                ) : (
                                  <span className="flex items-center justify-center gap-2">
                                    ✨ Mint NFT
                                  </span>
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}
