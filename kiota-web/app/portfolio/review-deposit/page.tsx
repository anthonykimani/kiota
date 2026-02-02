'use client'

import { useRouter } from 'next/navigation'
import { AllocationBarChart } from '@/components/custom/allocation-bar-chart'
import { AssetList } from '@/components/custom/asset-row'
import { PortfolioProjectionChart } from '@/components/custom/chart-area-interactive'
import { PageHeader } from '@/components/custom/page-header'
import { ScreenWrapper } from '@/components/custom/screen-wrapper'
import { Button } from '@/components/ui/button'
import { bestPerformingAssets } from '@/lib/helpers'
import React from 'react'

// Sample data for portfolio projection (12 months)
const projectionData = [
    { date: "2024-01-01", investment: 1000, returns: 50 },
    { date: "2024-02-01", investment: 2000, returns: 120 },
    { date: "2024-03-01", investment: 3000, returns: 210 },
    { date: "2024-04-01", investment: 4000, returns: 340 },
    { date: "2024-05-01", investment: 5000, returns: 480 },
    { date: "2024-06-01", investment: 6000, returns: 650 },
    { date: "2024-07-01", investment: 7000, returns: 840 },
    { date: "2024-08-01", investment: 8000, returns: 1050 },
    { date: "2024-09-01", investment: 9000, returns: 1290 },
    { date: "2024-10-01", investment: 10000, returns: 1560 },
    { date: "2024-11-01", investment: 11000, returns: 1860 },
    { date: "2024-12-01", investment: 12000, returns: 2200 },
]

const ReviewDeposit = () => {
    const router = useRouter()

    const handleBack = () => {
        router.push('/portfolio/add-money')
    }

    const handleConfirmDeposit = () => {
        router.push('/portfolio/confirm-deposit')
    }

    return (
        <ScreenWrapper centered className='py-6 gap-y-6'>
            <PageHeader
                title="Review Deposit"
                onBack={handleBack}
                rightAction={
                    <button
                        type="button"
                        className="text-kiota-text-secondary text-sm p-2"
                    >
                        ?
                    </button>
                }
            />

            <AllocationBarChart
                data={{
                    stableYields: 40,
                    tokenizedStocks: 35,
                    tokenizedGold: 25,
                }}
            />

            <PortfolioProjectionChart data={projectionData} />

            <AssetList
                assets={bestPerformingAssets}
                title="Best Performing Assets"
                description="Your portfolio is well-diversified and low in volatility, making it suitable for steady, long-term growth."
            />

            <Button buttonColor="primary" className="w-full" onClick={handleConfirmDeposit}>
                Confirm & Deposit
            </Button>

        </ScreenWrapper>
    )
}

export default ReviewDeposit