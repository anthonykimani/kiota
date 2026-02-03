'use client'

import { useState, useEffect, useCallback } from 'react'
import { portfolioApi } from '@/lib/api/client'
import type { PortfolioDetail } from '@/lib/api/types'
import { useAuth } from '@/context/auth-context'

interface UsePortfolioResult {
  data: PortfolioDetail | null
  isLoading: boolean
  error: string | null
  refetch: (period?: string) => Promise<void>
}

export function usePortfolio(initialPeriod?: string): UsePortfolioResult {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [data, setData] = useState<PortfolioDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPortfolio = useCallback(async (period?: string) => {
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await portfolioApi.getDetail(period)
      if (response.data) {
        setData(response.data as PortfolioDetail)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!authLoading) {
      fetchPortfolio(initialPeriod)
    }
  }, [authLoading, fetchPortfolio, initialPeriod])

  return {
    data,
    isLoading: isLoading || authLoading,
    error,
    refetch: fetchPortfolio,
  }
}

// Hook for rebalancing
export function useRebalance() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rebalance = useCallback(async (force?: boolean) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await portfolioApi.rebalance(force)
      return response.data
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to rebalance'
      setError(errorMsg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    rebalance,
    isLoading,
    error,
  }
}
