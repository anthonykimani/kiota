'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { depositApi } from '@/lib/api/client'
import type { DepositIntent, DepositConfirmation, DepositConversion } from '@/lib/api/types'

interface UseDepositIntentResult {
  intent: DepositIntent | null
  createIntent: (expectedAmount?: number) => Promise<DepositIntent | null>
  isCreating: boolean
  error: string | null
}

export function useDepositIntent(): UseDepositIntentResult {
  const [intent, setIntent] = useState<DepositIntent | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createIntent = useCallback(async (expectedAmount?: number) => {
    setIsCreating(true)
    setError(null)

    try {
      const response = await depositApi.createIntent(expectedAmount, 'USDC', 'base')
      if (response.data) {
        const intentData = response.data as DepositIntent
        setIntent(intentData)
        return intentData
      }
      return null
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create deposit intent'
      setError(errorMsg)
      return null
    } finally {
      setIsCreating(false)
    }
  }, [])

  return {
    intent,
    createIntent,
    isCreating,
    error,
  }
}

interface UseDepositConfirmationResult {
  confirmation: DepositConfirmation | null
  checkConfirmation: (depositSessionId: string) => Promise<DepositConfirmation | null>
  startPolling: (depositSessionId: string, intervalMs?: number) => void
  stopPolling: () => void
  isChecking: boolean
  isPolling: boolean
  error: string | null
}

export function useDepositConfirmation(): UseDepositConfirmationResult {
  const [confirmation, setConfirmation] = useState<DepositConfirmation | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const checkConfirmation = useCallback(async (depositSessionId: string) => {
    setIsChecking(true)
    setError(null)

    try {
      const response = await depositApi.confirmDeposit(depositSessionId)
      if (response.data) {
        const confirmationData = response.data as DepositConfirmation
        setConfirmation(confirmationData)
        return confirmationData
      }
      return null
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to check deposit'
      setError(errorMsg)
      return null
    } finally {
      setIsChecking(false)
    }
  }, [])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    setIsPolling(false)
  }, [])

  const startPolling = useCallback((depositSessionId: string, intervalMs = 10000) => {
    // Clear any existing polling
    stopPolling()
    setIsPolling(true)

    // Initial check
    checkConfirmation(depositSessionId)

    // Set up polling
    pollingRef.current = setInterval(async () => {
      const result = await checkConfirmation(depositSessionId)
      
      // Stop polling if confirmed
      if (result?.status === 'CONFIRMED') {
        stopPolling()
      }
    }, intervalMs)
  }, [checkConfirmation, stopPolling])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  return {
    confirmation,
    checkConfirmation,
    startPolling,
    stopPolling,
    isChecking,
    isPolling,
    error,
  }
}

interface UseDepositConversionResult {
  conversion: DepositConversion | null
  convertDeposit: (depositSessionId: string) => Promise<DepositConversion | null>
  isConverting: boolean
  error: string | null
}

export function useDepositConversion(): UseDepositConversionResult {
  const [conversion, setConversion] = useState<DepositConversion | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const convertDeposit = useCallback(async (depositSessionId: string) => {
    setIsConverting(true)
    setError(null)

    try {
      const response = await depositApi.convertDeposit(depositSessionId)
      if (response.data) {
        const conversionData = response.data as DepositConversion
        setConversion(conversionData)
        return conversionData
      }
      return null
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to convert deposit'
      setError(errorMsg)
      return null
    } finally {
      setIsConverting(false)
    }
  }, [])

  return {
    conversion,
    convertDeposit,
    isConverting,
    error,
  }
}
