'use client'

import { WalletAccountProvider } from '@/components/providers/WalletAccountProvider'
import { WebsiteProvider } from '@/components/providers/WebsiteProvider'
import { getAllSupportedChains } from '@/lib/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { createClient, http } from 'viem'
import { createConfig, WagmiProvider } from 'wagmi'
import { coinbaseWallet, metaMask, walletConnect } from 'wagmi/connectors'
import { ErrorHandlerProvider } from './ErrorHandlerProvider'

type ProvidersProps = {
  children: ReactNode
}

export const defaultWagmiConfig = () => {
  // WalletConnect projectId - get yours at https://cloud.walletconnect.com/
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '3a8170812b534d0ff9d794f19a901d64'
  
  return createConfig({
    chains: getAllSupportedChains(),
    connectors: [
      metaMask(),
      coinbaseWallet({ appName: 'Snag Loyalty' }),
      walletConnect({ projectId }),
    ],
    ssr: true,
    client({ chain }) {
      return createClient({ chain, transport: http() })
    },
  })
}

export default function Providers({ children }: ProvidersProps) {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <WagmiProvider config={defaultWagmiConfig()}>
          <WebsiteProvider>
            <WalletAccountProvider>
              <ErrorHandlerProvider>{children}</ErrorHandlerProvider>
            </WalletAccountProvider>
          </WebsiteProvider>
        </WagmiProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}
