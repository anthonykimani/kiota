'use client'

import { useState, useCallback } from 'react'
import { quizApi } from '@/lib/api/client'
import type { Strategy, QuizAnswers } from '@/lib/api/types'

interface UseQuizResult {
  submitQuiz: (answers: QuizAnswers) => Promise<{ sessionId: string; strategy: Strategy } | null>
  acceptStrategy: (sessionId: string, accepted: boolean, customAllocation?: {
    stableYields: number
    defiYield: number
    tokenizedStocks: number
    tokenizedGold: number
  }) => Promise<{ accepted: boolean; nextStep: string } | null>
  isSubmitting: boolean
  isAccepting: boolean
  error: string | null
}

export function useQuiz(): UseQuizResult {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitQuiz = useCallback(async (answers: QuizAnswers) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await quizApi.submit(answers)
      if (response.data) {
        return {
          sessionId: response.data.sessionId,
          strategy: response.data.strategy as Strategy,
        }
      }
      return null
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to submit quiz'
      setError(errorMsg)
      return null
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const acceptStrategy = useCallback(async (
    sessionId: string,
    accepted: boolean,
    customAllocation?: {
      stableYields: number
      defiYield: number
      tokenizedStocks: number
      tokenizedGold: number
    }
  ) => {
    setIsAccepting(true)
    setError(null)

    try {
      const response = await quizApi.acceptStrategy(sessionId, accepted, customAllocation)
      if (response.data) {
        return response.data
      }
      return null
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to accept strategy'
      setError(errorMsg)
      return null
    } finally {
      setIsAccepting(false)
    }
  }, [])

  return {
    submitQuiz,
    acceptStrategy,
    isSubmitting,
    isAccepting,
    error,
  }
}

// Map frontend quiz answers to API format
export function mapQuizAnswersToApi(answers: Record<string, string[]>): QuizAnswers {
  return {
    primaryGoal: answers.goal?.[0] || '',
    investmentTimeline: answers.timeline?.[0] || '',
    riskTolerance: answers.risk_tolerance?.[0] || '',
    investmentExperience: answers.experience?.[0] || '',
    currentSavingsRange: answers.current_savings?.[0],
    monthlySavingsRange: answers.monthly_savings?.[0],
    comfortableWithDollars: answers.dollar_comfort?.[0] === 'yes',
    investmentPriorities: answers.priorities || [],
  }
}
