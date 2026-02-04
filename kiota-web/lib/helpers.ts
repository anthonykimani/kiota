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

export const bestPerformingAssets: AssetRowData[] = [
    {
        icon: TslaSvg,
        ticker: "TSLA",
        name: "TESLA",
        symbol: "TSLAon",
        price: 458.00,
        change: 1.66,
        changePercent: 1.06,
    },
    {
        icon: ApplSvg,
        ticker: "APPL",
        name: "APPLE",
        symbol: "AAPLon",
        price: 232.50,
        change: 3.25,
        changePercent: 1.42,
    },
]

export const marketPerformanceAssets: AssetRowData[] = [
    {
        icon: TslaSvg,
        ticker: "TSLA",
        name: "TESLA",
        symbol: "TSLAon",
        price: 458.00,
        change: 1.66,
        changePercent: 1.06,
    },
    {
        icon: ApplSvg,
        ticker: "APPL",
        name: "APPLE",
        symbol: "AAPLon",
        price: 232.50,
        change: 3.25,
        changePercent: 1.42,
    },
    {
        icon: UsdcSvg,
        ticker: "USDM",
        name: "Mountain USD",
        symbol: "USDM",
        price: 1.00,
        change: 0.01,
        changePercent: 0.05,
    },
]

// Sample user portfolio with assets
export const sampleUserPortfolio: UserPortfolio = {
    totalValue: 12450.00,
    totalChange: 245.50,
    totalChangePercent: 2.01,
    assetClasses: [
        {
            assetClass: "preservation",
            totalValue: 4980.00,
            assets: [
                {
                    icon: UsdcSvg,
                    ticker: "USDM",
                    name: "Mountain USD",
                    symbol: "USDM",
                    price: 4980.00,
                    change: 12.45,
                    changePercent: 0.25,
                },
            ],
        },
        {
            assetClass: "growth",
            totalValue: 4357.50,
            assets: [
                {
                    icon: TslaSvg,
                    ticker: "TSLA",
                    name: "TESLA",
                    symbol: "TSLAon",
                    price: 2290.00,
                    change: 45.80,
                    changePercent: 2.04,
                },
                {
                    icon: ApplSvg,
                    ticker: "APPL",
                    name: "APPLE",
                    symbol: "AAPLon",
                    price: 2067.50,
                    change: 32.50,
                    changePercent: 1.60,
                },
            ],
        },
        {
            assetClass: "hedge",
            totalValue: 3112.50,
            assets: [
                {
                    icon: UsdcSvg,
                    ticker: "PAXG",
                    name: "Paxos Gold",
                    symbol: "PAXG",
                    price: 3112.50,
                    change: 154.75,
                    changePercent: 5.23,
                },
            ],
        },
    ],
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
