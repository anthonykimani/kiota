'use client'

import { useState, useEffect, useCallback } from 'react'
import { goalsApi } from '@/lib/api/client'
import type { Goal, GoalCategory } from '@/lib/api/types'
import { useAuth } from '@/context/auth-context'

interface UseGoalsResult {
  goals: Goal[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useGoals(status?: string): UseGoalsResult {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGoals = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await goalsApi.getAll(status)
      if (response.data) {
        setGoals(response.data.goals)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch goals')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, status])

  useEffect(() => {
    if (!authLoading) {
      fetchGoals()
    }
  }, [authLoading, fetchGoals])

  return {
    goals,
    isLoading: isLoading || authLoading,
    error,
    refetch: fetchGoals,
  }
}

interface UseGoalCategoriesResult {
  categories: GoalCategory[]
  isLoading: boolean
  error: string | null
}

export function useGoalCategories(): UseGoalCategoriesResult {
  const [categories, setCategories] = useState<GoalCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await goalsApi.getCategories()
        if (response.data) {
          setCategories(response.data.categories)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch categories')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return {
    categories,
    isLoading,
    error,
  }
}

interface UseGoalMutationsResult {
  createGoal: (goal: {
    title: string
    category: string
    targetAmountKes: number
    targetDate: string
  }) => Promise<Goal | null>
  updateGoal: (goalId: string, updates: {
    title?: string
    targetAmountKes?: number
    targetDate?: string
  }) => Promise<Goal | null>
  deleteGoal: (goalId: string) => Promise<boolean>
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  error: string | null
}

export function useGoalMutations(): UseGoalMutationsResult {
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createGoal = useCallback(async (goal: {
    title: string
    category: string
    targetAmountKes: number
    targetDate: string
  }) => {
    setIsCreating(true)
    setError(null)

    try {
      const response = await goalsApi.create(goal)
      if (response.data) {
        return response.data.goal
      }
      return null
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create goal'
      setError(errorMsg)
      return null
    } finally {
      setIsCreating(false)
    }
  }, [])

  const updateGoal = useCallback(async (goalId: string, updates: {
    title?: string
    targetAmountKes?: number
    targetDate?: string
  }) => {
    setIsUpdating(true)
    setError(null)

    try {
      const response = await goalsApi.update(goalId, updates)
      if (response.data) {
        return response.data.goal as Goal
      }
      return null
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update goal'
      setError(errorMsg)
      return null
    } finally {
      setIsUpdating(false)
    }
  }, [])

  const deleteGoal = useCallback(async (goalId: string) => {
    setIsDeleting(true)
    setError(null)

    try {
      await goalsApi.delete(goalId)
      return true
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete goal'
      setError(errorMsg)
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [])

  return {
    createGoal,
    updateGoal,
    deleteGoal,
    isCreating,
    isUpdating,
    isDeleting,
    error,
  }
}
