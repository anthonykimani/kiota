'use client'

import { useRouter } from 'next/navigation'
import { ChartAreaLinear } from '@/components/custom/chart-area-linear'
import { ScreenWrapper } from '@/components/custom/screen-wrapper'
import { ActionCard } from '@/components/custom/action-card'
import { BottomNav } from '@/components/custom/bottom-nav'
import { PortfolioOverview } from '@/components/custom/portfolio-overview'
import { MarketPerformance } from '@/components/custom/market-performance'
import { CryptoTradingBot, EyeClosed, HedgeFund } from '@/lib/svg'
import { 
    hasAssets, 
    sampleUserPortfolio, 
    marketPerformanceAssets,
    formatCurrency,
    formatChange,
    type UserPortfolio 
} from '@/lib/helpers'
import Image from 'next/image'
import React from 'react'

// For demo purposes - toggle this to see different states
const DEMO_HAS_ASSETS = true

const HomePage = () => {
    const router = useRouter()
    
    // In real app, this would come from API/state
    const portfolio: UserPortfolio | null = DEMO_HAS_ASSETS ? sampleUserPortfolio : null
    const userHasAssets = hasAssets(portfolio)

    const handleSetupPortfolio = () => {
        router.push('/quiz')
    }

    const handleExploreMarkets = () => {
        // TODO: Navigate to markets page when available
        router.push('/portfolio')
    }

    const handleSetupGoals = () => {
        // TODO: Navigate to goals page when available
        router.push('/portfolio')
    }

    return (
        <div>
            <ScreenWrapper className="py-6 gap-y-6 pb-24">
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
                <ChartAreaLinear />

                {/* Content based on whether user has assets */}
                {userHasAssets ? (
                    <div className="flex flex-col gap-y-6">
                        {/* Portfolio Overview with Pie Chart and Asset Class Dropdowns */}
                        <PortfolioOverview portfolio={portfolio!} />

                        {/* Market Performance */}
                        <MarketPerformance assets={marketPerformanceAssets} />

                        {/* Investment Goals - still show action card if no goals */}
                        <ActionCard
                            sectionTitle="My Investment Goals"
                            image={CryptoTradingBot}
                            title="You have no goals"
                            subtitle="You haven't set up any goals. Let's set it up today!"
                            buttonText="Setup Now"
                            onButtonClick={handleSetupGoals}
                        />
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