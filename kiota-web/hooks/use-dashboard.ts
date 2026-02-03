'use client'

import { useState, useEffect, useCallback } from 'react'
import { dashboardApi } from '@/lib/api/client'
import type { Dashboard } from '@/lib/api/types'
import { useAuth } from '@/context/auth-context'

interface UseDashboardResult {
  data: Dashboard | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDashboard(): UseDashboardResult {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [data, setData] = useState<Dashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await dashboardApi.getDashboard()
      if (response.data) {
        setData(response.data as Dashboard)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!authLoading) {
      fetchDashboard()
    }
  }, [authLoading, fetchDashboard])

  return {
    data,
    isLoading: isLoading || authLoading,
    error,
    refetch: fetchDashboard,
  }
}
