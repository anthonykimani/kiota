const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export interface ApiResponse<T = unknown> {
  status: number
  message: string
  data: T | null
  errors: string[]
}

export class ApiError extends Error {
  status: number
  errors: string[]

  constructor(status: number, message: string, errors: string[] = []) {
    super(message)
    this.status = status
    this.errors = errors
    this.name = 'ApiError'
  }
}

let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('kiota_token', token)
    } else {
      localStorage.removeItem('kiota_token')
    }
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken
  if (typeof window !== 'undefined') {
    return localStorage.getItem('kiota_token')
  }
  return null
}

export function clearAuthToken() {
  authToken = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('kiota_token')
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`
  const token = getAuthToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  const data: ApiResponse<T> = await response.json()

  if (data.status >= 400) {
    throw new ApiError(data.status, data.message, data.errors)
  }

  return data
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
}

// Auth endpoints
export const authApi = {
  syncUser: (idToken: string) =>
    api.post<{
      user: {
        id: string
        phoneNumber: string | null
        email: string | null
        primaryAuthMethod: string
        hasCompletedOnboarding: boolean
        hasCompletedQuiz: boolean
        totalPoints: number
        level: number
      }
      wallet: {
        address: string
        provider: string
      }
      portfolio: {
        id: string
        totalValueUsd: number
      }
      token: string
      isNewUser: boolean
      nextStep: 'quiz' | 'onboarding' | 'dashboard'
    }>('/auth/sync', { idToken }),

  getMe: () =>
    api.get<{
      user: {
        id: string
        phoneNumber: string | null
        email: string | null
        firstName: string | null
        lastName: string | null
        primaryAuthMethod: string
        hasCompletedOnboarding: boolean
        hasCompletedQuiz: boolean
        totalPoints: number
        level: number
      }
      wallet: {
        address: string
        provider: string
      } | null
      portfolio: {
        id: string
        totalValueUsd: number
      } | null
    }>('/auth/me'),
}

// Quiz endpoints
export const quizApi = {
  submit: (answers: {
    primaryGoal: string
    investmentTimeline: string
    riskTolerance: string
    investmentExperience: string
    currentSavingsRange?: string
    monthlySavingsRange?: string
    comfortableWithDollars?: boolean
    investmentPriorities?: string[]
  }) =>
    api.post<{
      sessionId: string
      strategy: {
        name: string
        allocation: {
          stableYields: number
          defiYield: number
          tokenizedStocks: number
          tokenizedGold: number
        }
        rationale: string
        expectedReturn: number
        riskLevel: string
        assets: {
          stableYields: string
          defiYield: string
          tokenizedStocks: string
          tokenizedGold: string
        }
      }
    }>('/quiz/submit', { answers }),

  acceptStrategy: (sessionId: string, accepted: boolean, customAllocation?: {
    stableYields: number
    defiYield: number
    tokenizedStocks: number
    tokenizedGold: number
  }) =>
    api.post<{
      accepted: boolean
      nextStep: string
    }>('/quiz/accept-strategy', { sessionId, accepted, customAllocation }),

  getLatestSession: () =>
    api.get<{
      session: {
        id: string
        createdAt: string
        aiResponse: unknown
        userAccepted: boolean | null
      }
    }>('/quiz/latest-session'),
}

// Dashboard endpoints
export const dashboardApi = {
  getDashboard: () =>
    api.get<{
      user: {
        id: string
        firstName: string | null
        hasCompletedOnboarding: boolean
        totalPoints: number
        level: number
      }
      wallet?: {
        usdcBalance: number
        stableYieldBalance: number
        defiYieldBalance: number
        tokenizedStocksBalance: number
        tokenizedGoldBalance: number
      }
      portfolio: {
        totalValueUsd: number
        totalValueKes: number
        monthlyChange: number
        monthlyChangePercent: number
        monthlyTrend: 'up' | 'down' | 'stable'
      }
      assets: Array<{
        classKey: string
        name: string
        primaryAssetSymbol: string | null
        valueUsd: number
        percentage: number
        monthlyEarnings: number
        apy?: number
        avgReturn?: number
        requiresTier2?: boolean
        price?: number
        change?: number
        changePercent?: number
      }>
      marketPerformance?: Array<{
        symbol: string
        name: string
        price: number
        change: number
        changePercent: number
      }>
      totalMonthlyEarnings: number
      goals: Array<{
        id: string
        emoji: string
        title: string
        currentAmount: number
        targetAmount: number
        progressPercent: number
        targetDate: string
        onTrack: boolean
        status: string
      }>
      quickActions: {
        canAddMoney: boolean
        canWithdraw: boolean
        canRebalance: boolean
        canLearn: boolean
      }
      kesUsdRate: number
    }>('/dashboard'),

  getPortfolioSummary: () =>
    api.get<{
      totalValueUsd: number
      totalValueKes: number
      allTimeReturnPercent: number
      totalGainsUsd: number
      monthlyEarnings: number
    }>('/dashboard/portfolio-summary'),
}

// Portfolio endpoints
export const portfolioApi = {
  getDetail: (period?: string) =>
    api.get<{
      summary: {
        totalValueUsd: number
        totalValueKes: number
        allTimeReturn: {
          amountUsd: number
          percentage: number
        }
        totalDeposited: number
        totalWithdrawn: number
        monthlyEarnings: number
        kesUsdRate: number
      }
      assets: Array<{
        classKey: string
        name: string
        valueUsd: number
        percentage: number
        targetPercentage: number
        apy?: number
        avgReturn?: number
        requiresTier2?: boolean
      }>
      holdings: Array<{
        symbol: string
        name: string
        assetClassKey: string
        balance: number
        valueUsd: number
        lastUpdated: string
      }>
      needsRebalance: boolean
      rebalanceThreshold: number
      transactions: Array<{
        id: string
        type: string
        status: string
        amountKes: number
        amountUsd: number
        date: string
        mpesaReceipt?: string
        txHash?: string
      }>
      history: Array<{
        date: string
        value: number
      }>
      period: string
    }>(`/portfolio/detail${period ? `?period=${period}` : ''}`),

  rebalance: (force?: boolean) =>
    api.post<{
      rebalanceGroupId: string
      status: string
      estimatedCompletionTime: string
      currentAllocation: {
        stableYields: number
        defiYield: number
        tokenizedStocks: number
        tokenizedGold: number
      }
      targetAllocation: {
        stableYields: number
        defiYield: number
        tokenizedStocks: number
        tokenizedGold: number
      }
      drift: string
      totalSwapValue: string
      requiredSwaps: Array<{
        transactionId: string
        fromAsset: string
        toAsset: string
        amount: number
      }>
      swapCount: number
    }>('/portfolio/rebalance', { force }),

  getAssetDetail: (symbol: string) =>
    api.get<{
      asset: {
        symbol: string
        name: string
        assetClassKey: string
        valueUsd: number
        balance: number
        riskLevel: string | null
        description: string | null
        features: string[]
      }
      transactions: Array<{
        id: string
        type: string
        amountUsd: number
        date: string
        status: string
      }>
    }>(`/portfolio/asset/${symbol}`),
}

// Deposit endpoints
export const depositApi = {
  createIntent: (expectedAmount?: number, token?: string, chain?: string) =>
    api.post<{
      depositSessionId: string
      depositAddress: string
      chain: string
      token: {
        symbol: string
        address: string
      }
      expiresAt: string
    }>('/deposit/intent/create', { expectedAmount, token, chain }),

  confirmDeposit: (depositSessionId: string) =>
    api.post<{
      status: 'AWAITING_TRANSFER' | 'RECEIVED' | 'CONFIRMED'
      txHash?: string
      amount?: number
      confirmations?: number
      credited?: boolean
      transactionId?: string
    }>('/deposit/intent/confirm', { depositSessionId }),

  convertDeposit: (depositSessionId: string) =>
    api.post<{
      conversionGroupId: string
      depositSessionId: string
      depositedAmount: number
      status: string
      swaps: Array<{
        transactionId: string
        toAsset: string
        amount: number
      }>
      swapCount: number
      estimatedCompletionTime: string
      allocation: {
        stableYields: number
        defiYield: number
        tokenizedStocks: number
        tokenizedGold: number
      }
    }>('/deposit/convert', { depositSessionId }),

  convertWalletBalance: (amountUsd?: number) =>
    api.post<{
      conversionGroupId: string
      convertedAmount: number
      status: string
      swaps: Array<{ transactionId: string; toAsset: string; amount: number }>
      swapCount: number
      estimatedCompletionTime: string
      allocation: {
        stableYields: number
        defiYield: number
        tokenizedStocks: number
        tokenizedGold: number
      }
    }>('/deposit/convert-wallet', { amountUsd }),

  getReview: (depositSessionId: string) =>
    api.post<{
      depositSessionId: string
      amountUsd: number
      allocation: {
        stableYields: number
        defiYield: number
        tokenizedStocks: number
        tokenizedGold: number
      }
      projection: Array<{
        date: string
        investment: number
        returns: number
      }>
      assets: Array<{
        symbol: string
        name: string
        classKey: string
        price: number
        change: number
        changePercent: number
      }>
      description: string
    }>('/deposit/review', { depositSessionId }),

  getTransactionStatus: (transactionId: string) =>
    api.get<{
      transactionId: string
      status: string
      amountKes: number
      amountUsd: number
      mpesaReceiptNumber: string | null
      txHash: string | null
      completedAt: string | null
      failureReason: string | null
    }>(`/deposit/status/${transactionId}`),
}

// Goals endpoints
export const goalsApi = {
  getCategories: () =>
    api.get<{
      categories: Array<{
        value: string
        label: string
        emoji: string
      }>
    }>('/goals/categories'),

  getAll: (status?: string, limit?: number) =>
    api.get<{
      goals: Array<{
        id: string
        title: string
        category: string
        emoji: string
        targetAmountKes: number
        targetAmountUsd: number
        currentAmountUsd: number
        progressPercent: number
        targetDate: string
        status: string
        onTrack: boolean
      }>
      count: number
    }>(`/goals${status ? `?status=${status}` : ''}${limit ? `&limit=${limit}` : ''}`),

  create: (goal: {
    title: string
    category: string
    targetAmountKes: number
    targetDate: string
  }) =>
    api.post<{
      goal: {
        id: string
        title: string
        category: string
        emoji: string
        targetAmountKes: number
        targetAmountUsd: number
        currentAmountUsd: number
        progressPercent: number
        targetDate: string
        status: string
        onTrack: boolean
      }
    }>('/goals', goal),

  get: (goalId: string) =>
    api.get<{
      goal: {
        id: string
        title: string
        category: string
        emoji: string
        targetAmountKes: number
        targetAmountUsd: number
        currentAmountUsd: number
        progressPercent: number
        targetDate: string
        status: string
        onTrack: boolean
        createdAt: string
        completedAt: string | null
      }
    }>(`/goals/${goalId}`),

  update: (goalId: string, updates: {
    title?: string
    targetAmountKes?: number
    targetDate?: string
  }) =>
    api.put<{
      goal: {
        id: string
        title: string
        targetAmountKes: number
        targetAmountUsd: number
        targetDate: string
        progressPercent: number
      }
    }>(`/goals/${goalId}`, updates),

  delete: (goalId: string) =>
    api.delete<{
      message: string
      goalId: string
    }>(`/goals/${goalId}`),
}

// Swap endpoints
export const swapApi = {
  getQuote: (fromAsset: string, toAsset: string, amount: number) =>
    api.get<{
      fromAsset: string
      toAsset: string
      fromAmount: number
      estimatedToAmount: number
      slippage: number
      priceImpact: number
      fees: {
        network: number
        protocol: number
      }
      expiresAt: string
      provider: string
    }>(`/swap/quote?fromAsset=${fromAsset}&toAsset=${toAsset}&amount=${amount}`),

  execute: (fromAsset: string, toAsset: string, amount: number, slippage?: number) =>
    api.post<{
      transactionId: string
      status: string
      fromAsset: string
      toAsset: string
      fromAmount: number
      estimatedToAmount: number
      estimatedCompletionTime: string
    }>('/swap/execute', { fromAsset, toAsset, amount, slippage }),

  getStatus: (transactionId: string) =>
    api.get<{
      transactionId: string
      status: string
      fromAsset: string
      toAsset: string
      fromAmount: number
      estimatedToAmount: number
      actualToAmount?: number
      orderHash?: string
      txHash?: string
      createdAt: string
      completedAt?: string
    }>(`/swap/status/${transactionId}`),

  getHistory: () =>
    api.get<Array<{
      transactionId: string
      status: string
      fromAsset: string
      toAsset: string
      fromAmount: number
      actualToAmount: number
      txHash: string
      createdAt: string
      completedAt: string
    }>>('/swap/history'),
}
