'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { usePrivy, getIdentityToken } from '@privy-io/react-auth'
import { authApi, setAuthToken, clearAuthToken, getAuthToken } from '@/lib/api/client'
import type { User, Wallet, Portfolio } from '@/lib/api/types'

interface AuthState {
  user: User | null
  wallet: Wallet | null
  portfolio: Portfolio | null
  isAuthenticated: boolean
  isLoading: boolean
  isSyncing: boolean
  error: string | null
  nextStep: 'quiz' | 'onboarding' | 'dashboard' | null
}

interface AuthContextType extends AuthState {
  syncWithBackend: () => Promise<void>
  refreshUser: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user: privyUser, logout: privyLogout } = usePrivy()
  
  const [state, setState] = useState<AuthState>({
    user: null,
    wallet: null,
    portfolio: null,
    isAuthenticated: false,
    isLoading: true,
    isSyncing: false,
    error: null,
    nextStep: null,
  })

  // Sync Privy user with our backend
  const syncWithBackend = useCallback(async () => {
    if (!authenticated || !privyUser) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        wallet: null,
        portfolio: null,
      }))
      return
    }

    setState(prev => ({ ...prev, isSyncing: true, error: null }))

    try {
      // Get identity token from Privy (not access token!)
      const idToken = await getIdentityToken()
      
      if (!idToken) {
        throw new Error('Failed to get identity token')
      }

      // Sync with our backend
      const response = await authApi.syncUser(idToken)
      
      if (response.data) {
        // Store the JWT token from our backend
        setAuthToken(response.data.token)

        setState(prev => ({
          ...prev,
          user: response.data!.user as User,
          wallet: response.data!.wallet,
          portfolio: response.data!.portfolio,
          isAuthenticated: true,
          isLoading: false,
          isSyncing: false,
          nextStep: response.data!.nextStep,
          error: null,
        }))
      }
    } catch (error) {
      console.error('Backend sync failed:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Failed to sync with backend',
      }))
    }
  }, [authenticated, privyUser])

  // Refresh user data from backend
  const refreshUser = useCallback(async () => {
    const token = getAuthToken()
    if (!token) return

    try {
      const response = await authApi.getMe()
      if (response.data) {
        setState(prev => ({
          ...prev,
          user: response.data!.user as User,
          wallet: response.data!.wallet,
          portfolio: response.data!.portfolio,
        }))
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }, [])

  // Logout
  const logout = useCallback(() => {
    clearAuthToken()
    privyLogout()
    setState({
      user: null,
      wallet: null,
      portfolio: null,
      isAuthenticated: false,
      isLoading: false,
      isSyncing: false,
      error: null,
      nextStep: null,
    })
  }, [privyLogout])

  // Auto-sync when Privy auth state changes
  useEffect(() => {
    if (!ready) return

    if (authenticated && privyUser) {
      // Check if we already have a token
      const existingToken = getAuthToken()
      if (existingToken) {
        // Try to refresh user data with existing token
        refreshUser().then(() => {
          setState(prev => ({ ...prev, isLoading: false, isAuthenticated: true }))
        }).catch(() => {
          // Token might be expired, sync again
          syncWithBackend()
        })
      } else {
        // No token, sync with backend
        syncWithBackend()
      }
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        wallet: null,
        portfolio: null,
      }))
    }
  }, [ready, authenticated, privyUser, syncWithBackend, refreshUser])

  const contextValue: AuthContextType = {
    ...state,
    syncWithBackend,
    refreshUser,
    logout,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook to require authentication
export function useRequireAuth(redirectTo?: string) {
  const auth = useAuth()
  const { login } = usePrivy()

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      if (redirectTo) {
        // Could use router here if needed
        console.log('User not authenticated, should redirect to:', redirectTo)
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, redirectTo])

  return {
    ...auth,
    login,
  }
}
