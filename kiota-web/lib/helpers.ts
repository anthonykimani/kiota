import { TslaSvg, ApplSvg, UsdcSvg } from './svg'
import { AssetClass } from './constants'

export const portfolioOnboardingContent = {
    title: "Let's set up your Portfolio.",
    subtitle: "We'll guide you through the steps of setting up your personalized household budget",
    buttonText: "Get Started"
}

export interface AssetRowData {
    icon: string
    ticker: string
    name: string
    symbol: string
    price: number
    change: number
    changePercent: number
}

export interface AssetClassData {
    assetClass: AssetClass
    totalValue: number
    assets: AssetRowData[]
}

export interface UserPortfolio {
    totalValue: number
    totalChange: number
    totalChangePercent: number
    assetClasses: AssetClassData[]
}

export const assetIcons: Record<string, string> = {
    TSLA: TslaSvg,
    APPL: ApplSvg,
    USDM: UsdcSvg,
    PAXG: UsdcSvg,
}

export const emptyPortfolio: UserPortfolio = {
    totalValue: 0,
    totalChange: 0,
    totalChangePercent: 0,
    assetClasses: [],
}

export function formatCurrency(value: unknown): string {
    const num = Number(value)
    if (isNaN(num)) return '$0.00'
    return `$${num.toFixed(2)}`
}

export function formatChange(change: unknown, changePercent: unknown): string {
    const safeChange = Number(change) || 0
    const safePercent = Number(changePercent) || 0
    const sign = safeChange >= 0 ? '+' : ''
    return `${sign}${safeChange.toFixed(2)} (${sign}${safePercent.toFixed(2)}%)`
}

export function hasAssets(portfolio: UserPortfolio | null): boolean {
    return portfolio !== null && portfolio.totalValue > 0
}
