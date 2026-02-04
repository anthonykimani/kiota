'use client'

import { useRouter } from 'next/navigation'
import { ChartAreaLinear, type ChartDataPoint } from '@/components/custom/chart-area-linear'
import { ScreenWrapper } from '@/components/custom/screen-wrapper'
import { ActionCard } from '@/components/custom/action-card'
import { BottomNav } from '@/components/custom/bottom-nav'
import { PortfolioOverview } from '@/components/custom/portfolio-overview'
import { MarketPerformance } from '@/components/custom/market-performance'
import { CryptoTradingBot, EyeClosed, HedgeFund } from '@/lib/svg'
import { 
    marketPerformanceAssets,
    formatCurrency,
    formatChange,
    type UserPortfolio,
    type AssetClassData
} from '@/lib/helpers'
import { UsdcSvg, TslaSvg } from '@/lib/svg'
import Image from 'next/image'
import React, { useMemo } from 'react'
import { useDashboard } from '@/hooks/use-dashboard'
import { usePortfolio } from '@/hooks/use-portfolio'
import { useAuth } from '@/context/auth-context'

const HomePage = () => {
    const router = useRouter()
    const { isAuthenticated, isLoading: authLoading, user } = useAuth()
    const { data: dashboard, isLoading: dashboardLoading, error } = useDashboard()
    const { data: portfolioDetail } = usePortfolio('1M') // Get 1 month history for chart

    // Transform API dashboard data to UserPortfolio format
    const portfolio: UserPortfolio | null = useMemo(() => {
        if (!dashboard?.portfolio || dashboard.portfolio.totalValueUsd <= 0) {
            return null
        }

        // Map API assets to local format
        const assetClasses: AssetClassData[] = dashboard.assets.map(asset => {
            const assetClassMap: Record<string, 'preservation' | 'growth' | 'hedge'> = {
                'stable_yields': 'preservation',
                'tokenized_stocks': 'growth',
                'tokenized_gold': 'hedge',
            }

            return {
                assetClass: assetClassMap[asset.classKey] || 'preservation',
                totalValue: asset.valueUsd,
                assets: [{
                    icon: asset.classKey === 'stable_yields' ? UsdcSvg : 
                          asset.classKey === 'tokenized_stocks' ? TslaSvg : UsdcSvg,
                    ticker: asset.primaryAssetSymbol || asset.classKey.toUpperCase(),
                    name: asset.name,
                    symbol: asset.primaryAssetSymbol || '',
                    price: asset.valueUsd,
                    change: asset.monthlyEarnings,
                    changePercent: asset.percentage,
                }]
            }
        })

        return {
            totalValue: dashboard.portfolio.totalValueUsd,
            totalChange: dashboard.portfolio.monthlyChange,
            totalChangePercent: dashboard.portfolio.monthlyChangePercent,
            assetClasses,
        }
    }, [dashboard])

    const userHasAssets = portfolio !== null && portfolio.totalValue > 0
    const isLoading = authLoading || dashboardLoading

    // Transform portfolio history to chart data format
    const chartData: ChartDataPoint[] = useMemo(() => {
        if (!portfolioDetail?.history || portfolioDetail.history.length === 0) {
            return []
        }

        return portfolioDetail.history.map(point => ({
            date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Number(point.value) || 0,
        }))
    }, [portfolioDetail?.history])

    const handleSetupPortfolio = () => {
        router.push('/portfolio')
    }

    const handleExploreMarkets = () => {
        // TODO: Navigate to markets page when available
        router.push('/portfolio')
    }

    const handleSetupGoals = () => {
        // TODO: Navigate to goals page when available
        router.push('/portfolio')
    }

    // Show loading state
    if (isLoading) {
        return (
            <div>
                <ScreenWrapper className="py-6 gap-y-6 pb-24">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-kiota-card rounded w-32"></div>
                        <div className="h-12 bg-kiota-card rounded w-48"></div>
                        <div className="h-48 bg-kiota-card rounded"></div>
                    </div>
                </ScreenWrapper>
                <BottomNav />
            </div>
        )
    }

    // Show error state
    if (error) {
        return (
            <div>
                <ScreenWrapper className="py-6 gap-y-6 pb-24">
                    <div className="text-center">
                        <p className="text-red-500">Failed to load dashboard</p>
                        <p className="text-sm text-kiota-text-secondary">{error}</p>
                    </div>
                </ScreenWrapper>
                <BottomNav />
            </div>
        )
    }

    const displayName = dashboard?.user?.firstName || user?.firstName || 'there'

    return (
        <div>
            <ScreenWrapper className="py-6 gap-y-6 pb-24">
                {/* Greeting */}
                {displayName && (
                    <p className="text-kiota-text-secondary">Hi, {displayName}!</p>
                )}

                {/* Header - Total Assets */}
                <div className='flex justify-between items-center'>
                    <div className="space-y-1">
                        <p className="text-sm text-kiota-text-secondary">Your Total Asset</p>
                        <h1 className="text-3xl font-semibold">
                            {userHasAssets ? formatCurrency(portfolio!.totalValue) : '$0.00'}
                        </h1>
                        <p className={`text-sm ${userHasAssets && portfolio!.totalChange >= 0 ? 'text-green-500' : 'text-kiota-text-secondary'}`}>
                            {userHasAssets 
                                ? formatChange(portfolio!.totalChange, portfolio!.totalChangePercent)
                                : '0.00% $0.00'
                            }
                        </p>
                    </div>
                    <div>
                        <Image src={EyeClosed} alt="" width={0} height={0} className='w-8 h-8' />
                    </div>
                </div>

                {/* Chart */}
                <ChartAreaLinear data={chartData} hasAssets={userHasAssets} />

                {/* Content based on whether user has assets */}
                {userHasAssets ? (
                    <div className="flex flex-col gap-y-6">
                        {/* Portfolio Overview with Pie Chart and Asset Class Dropdowns */}
                        <PortfolioOverview portfolio={portfolio!} />

                        {/* Market Performance */}
                        <MarketPerformance assets={marketPerformanceAssets} />

                        {/* Investment Goals */}
                        {dashboard?.goals && dashboard.goals.length > 0 ? (
                            <div className="space-y-3">
                                <h2 className="text-lg font-semibold">My Investment Goals</h2>
                                {dashboard.goals.map(goal => (
                                    <div key={goal.id} className="bg-kiota-card p-4 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{goal.emoji}</span>
                                            <div className="flex-1">
                                                <p className="font-medium">{goal.title}</p>
                                                <p className="text-sm text-kiota-text-secondary">
                                                    {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                                                </p>
                                            </div>
                                            <span className={`text-sm ${goal.onTrack ? 'text-green-500' : 'text-yellow-500'}`}>
                                                {goal.progressPercent}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <ActionCard
                                sectionTitle="My Investment Goals"
                                image={CryptoTradingBot}
                                title="You have no goals"
                                subtitle="You haven't set up any goals. Let's set it up today!"
                                buttonText="Setup Now"
                                onButtonClick={handleSetupGoals}
                            />
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-y-6">
                        <ActionCard
                            sectionTitle="My Portfolio"
                            image={CryptoTradingBot}
                            title="Setup Portfolio"
                            subtitle="Let our roboadvisor help you make your first portfolio with ease"
                            buttonText="Setup Portfolio"
                            onButtonClick={handleSetupPortfolio}
                        />

                        <ActionCard
                            sectionTitle="Market Performance"
                            image={HedgeFund}
                            title="You have no Market Watchlist"
                            subtitle="Let's setup your market watchlist today."
                            buttonText="Explore Markets"
                            onButtonClick={handleExploreMarkets}
                        />

                        <ActionCard
                            sectionTitle="My Investment Goals"
                            image={CryptoTradingBot}
                            title="You have no goals"
                            subtitle="You haven't set up any goals. Let's set it up today!"
                            buttonText="Setup Now"
                            onButtonClick={handleSetupGoals}
                        />
                    </div>
                )}
            </ScreenWrapper>
            <BottomNav />
        </div>
    )
}

export default HomePage