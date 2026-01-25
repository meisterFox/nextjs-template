'use client'

import { UserProfile } from '@/components/pages/UserProfile'
import SignInWithEthereum from '@/components/SignIn'
import { Header } from '@/components/ui/Header'
import { useAuthAccount } from '@/lib/useAuthAccount'

export const Profile = () => {
  const { isAuthenticated, userId } = useAuthAccount()

  if (!isAuthenticated || !userId) {
    return (
      <div className="flex flex-col gap-8 w-full items-center justify-center min-h-[60vh] max-w-4xl mx-auto p-4 sm:p-8">
        <div className="text-center space-y-6">
          <div className="inline-block">
            <h1 className="text-6xl sm:text-7xl font-black bg-gradient-to-r from-blue-400 via-purple-500 to-pink-600 bg-clip-text text-transparent animate-gradient">
              Your Profile
            </h1>
            <div className="h-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-600 rounded-full mt-2 animate-pulse"></div>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Connect your wallet to view your profile and track your progress
          </p>
        </div>

        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-3xl p-12 border border-gray-700/50 shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
          <div className="flex flex-col items-center gap-6">
            <div className="text-7xl">{'🔐'}</div>
            <h3 className="text-2xl font-bold text-white">
              Authentication Required
            </h3>
            <p className="text-gray-400 text-center max-w-md">
              Sign in with your Ethereum wallet to access your personalized
              profile
            </p>
            <SignInWithEthereum />
          </div>
        </div>
      </div>
    )
  }

  return <UserProfile userId={userId} />
}
