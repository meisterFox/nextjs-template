import { useWalletAccount } from '@/components/providers/WalletAccountProvider'
import { getCsrfToken, signIn, signOut, useSession } from 'next-auth/react'
import { useEffect, useMemo, useRef } from 'react'
import { SiweMessage } from 'siwe'
import { useConnect, useSignMessage } from 'wagmi'

/**
 * Get the wallet authentication signature
 */
export const getWalletAuthSignature = async (
  account: ReturnType<typeof useWalletAccount>,
  signMessage: ReturnType<typeof useSignMessage>
) => {
  const message = new SiweMessage({
    domain: window.location.host,
    statement: 'Sign in to the app. Powered by Snag Solutions.',
    uri: window.location.origin,
    version: '1',
    chainId: Number(account.chainId ?? 1),
    nonce: await getCsrfToken(),
    address: account.address,
  })

  const signatureOrToken = await signMessage.signMessageAsync({
    message: message.prepareMessage(),
  })

  return {
    signatureOrToken,
    message,
    walletAddress: account.address,
  }
}

/**
 * Sign in the user with the wallet address and signature
 */
export const signInWallet = async (
  account: ReturnType<typeof useWalletAccount>,
  signMessage: ReturnType<typeof useSignMessage>
) => {
  const { signatureOrToken, message, walletAddress } =
    await getWalletAuthSignature(account, signMessage)

  const token = await signIn('credentials', {
    message: !!message ? JSON.stringify(message) : message,
    accessToken: signatureOrToken,
    signature: signatureOrToken,
    walletAddress: walletAddress,
    redirect: false,
    callbackUrl: '/protected',
  })
  return token
}

/**
 * Hook to get the authentication account
 *
 * @returns {object} The authentication account
 */
export const useAuthAccount = () => {
  const session = useSession()
  const account = useWalletAccount()
  const signMessageWagmi = useSignMessage()
  const { connectors, connectAsync } = useConnect()
  const isAuthenticated = useMemo(
    () => !!session.data?.user,
    [session.data?.user]
  )
  
  // Prevent multiple sign-in attempts
  const isSigningRef = useRef(false)
  // Track last attempted address to prevent duplicates
  const lastAttemptedAddressRef = useRef<string | null>(null)
  
  // Get list of already authenticated addresses from localStorage
  const getAuthenticatedAddresses = (): string[] => {
    try {
      const stored = localStorage.getItem('authenticatedAddresses')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }
  
  const addAuthenticatedAddress = (address: string) => {
    try {
      const addresses = getAuthenticatedAddresses()
      const lowerAddr = address.toLowerCase()
      if (!addresses.includes(lowerAddr)) {
        addresses.push(lowerAddr)
        localStorage.setItem('authenticatedAddresses', JSON.stringify(addresses))
        console.log('💾 Saved authenticated address:', lowerAddr, 'Total:', addresses.length)
      }
    } catch {}
  }
  
  const isAddressAuthenticated = (address: string): boolean => {
    const addresses = getAuthenticatedAddresses()
    const isAuth = addresses.includes(address.toLowerCase())
    console.log('🔍 Checking if authenticated:', address.toLowerCase(), '→', isAuth, 'List:', addresses)
    return isAuth
  }

  // Single unified effect for all auth logic
  useEffect(() => {
    // Debounce to prevent rapid multiple calls
    const timeoutId = setTimeout(async () => {
      const currentAddr = account.address?.toLowerCase()
      const sessionAddr = session.data?.address?.toLowerCase()
      
      // Skip if no wallet address
      if (!currentAddr) return
      
      // Skip if already signing
      if (isSigningRef.current) return
      
      // Skip if we already attempted this address
      if (lastAttemptedAddressRef.current === currentAddr) {
        console.log('⏭️ Already attempted sign-in for this address, skipping:', currentAddr)
        return
      }
      
      // Case 1: Not authenticated - need to sign in
      if (session.status === 'unauthenticated') {
        isSigningRef.current = true
        lastAttemptedAddressRef.current = currentAddr
        
        try {
          console.log('🔐 Requesting sign-in for:', currentAddr)
          await signInWallet(account, signMessageWagmi)
          addAuthenticatedAddress(currentAddr)
          console.log('✅ Sign-in successful for:', currentAddr)
        } catch (e: any) {
          const msg = e?.message?.toLowerCase() || ''
          const isUserRejection = msg.includes('rejected') || 
                                  msg.includes('denied') || 
                                  msg.includes('cancelled') ||
                                  msg.includes('canceled') ||
                                  msg.includes('user refused') ||
                                  msg.includes('user closed')
          if (!isUserRejection) {
            console.error('Sign-in error:', e)
          }
          // Reset on rejection so user can try again
          if (isUserRejection) {
            lastAttemptedAddressRef.current = null
          }
        } finally {
          isSigningRef.current = false
        }
        return
      }
      
      // Case 2: Authenticated but address changed
      if (session.status === 'authenticated' && sessionAddr && currentAddr !== sessionAddr) {
        // Check if new address was already authenticated
        if (isAddressAuthenticated(currentAddr)) {
          console.log('🔄 Switching to previously authenticated address:', currentAddr)
          return
        }
        
        // New address - sign out (will trigger Case 1 on next render)
        console.log('🆕 New address detected, signing out:', currentAddr)
        lastAttemptedAddressRef.current = null // Reset for new address
        await signOut({ redirect: false })
      }
    }, 300) // 300ms debounce - longer to catch more duplicates
    
    return () => clearTimeout(timeoutId)
  }, [account.address, session.status, session.data?.address])

  return {
    isAuthenticated,
    userId: session.data?.user?.id,
    walletAddress: session?.data?.address,
    account,
    isLoading: session.status === 'loading',
    connect: async () => {
      try {
        const connector = connectors?.[0]
        if (!connector) throw new Error('No connector found')
        await connectAsync({ connector })
        try {
          localStorage.setItem('lastConnector', connector.id)
        } catch {}
      } catch (err: unknown) {
        console.error(err instanceof Error ? err?.message : 'Unknown error')
      }
    },
    disconnect: async () => {
      try {
        await signOut({
          redirect: false,
        })
        await account.disconnectWallet()
        try {
          localStorage.removeItem('lastConnector')
        } catch {}
      } catch (err: unknown) {
        console.error(err instanceof Error ? err?.message : 'Unknown error')
      }
    },
  }
}
