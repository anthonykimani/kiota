'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AllocationBarChart } from '@/components/custom/allocation-bar-chart'
import { AssetList } from '@/components/custom/asset-row'
import { PortfolioProjectionChart } from '@/components/custom/chart-area-interactive'
import { PageHeader } from '@/components/custom/page-header'
import { ScreenWrapper } from '@/components/custom/screen-wrapper'
import { Button } from '@/components/ui/button'
import { assetIcons, type AssetRowData } from '@/lib/helpers'
import { UsdcSvg } from '@/lib/svg'
import { depositApi } from '@/lib/api/client'
import type { DepositReviewResponse } from '@/lib/api/types'

type DepositStatus = 'idle' | 'awaiting' | 'received' | 'confirmed' | 'error'

const ReviewDeposit = () => {
    const router = useRouter()
    const [status, setStatus] = useState<DepositStatus>('idle')
    const [error, setError] = useState<string | null>(null)
    const [depositSessionId, setDepositSessionId] = useState<string | null>(null)
    const [reviewData, setReviewData] = useState<DepositReviewResponse | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined') return
        const storedSessionId = localStorage.getItem('kiota_deposit_session_id')
        if (!storedSessionId) {
            router.push('/portfolio/add-money')
            return
        }
        setDepositSessionId(storedSessionId)
    }, [router])

    useEffect(() => {
        if (!depositSessionId) return

        let isActive = true
        let intervalId: ReturnType<typeof setInterval> | null = null

        const pollConfirm = async () => {
            try {
                const response = await depositApi.confirmDeposit(depositSessionId)
                const currentStatus = response.data?.status

                if (!isActive) return

                if (currentStatus === 'CONFIRMED') {
                    setStatus('confirmed')
                    if (intervalId) clearInterval(intervalId)
                    return
                }

                if (currentStatus === 'RECEIVED') {
                    setStatus('received')
                    return
                }

                setStatus('awaiting')
            } catch (err) {
                if (!isActive) return
                setStatus('error')
                setError(err instanceof Error ? err.message : 'Failed to confirm deposit')
                if (intervalId) clearInterval(intervalId)
            }
        }

        pollConfirm()
        intervalId = setInterval(pollConfirm, 8000)

        return () => {
            isActive = false
            if (intervalId) clearInterval(intervalId)
        }
    }, [depositSessionId])

    useEffect(() => {
        if (status !== 'confirmed' || !depositSessionId || reviewData) return

        const fetchReview = async () => {
            try {
                const response = await depositApi.getReview(depositSessionId)
                if (response.data) {
                    setReviewData(response.data as DepositReviewResponse)
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load review data')
            }
        }

        fetchReview()
    }, [status, depositSessionId, reviewData])

    const handleBack = () => {
        router.push('/portfolio/add-money')
    }

    const handleConfirmDeposit = () => {
        router.push('/portfolio/confirm-deposit')
    }

    const assetRows = useMemo<AssetRowData[]>(() => {
        if (!reviewData?.assets) return []
        return reviewData.assets.map(asset => ({
            icon: assetIcons[asset.symbol] || UsdcSvg,
            ticker: asset.symbol,
            name: asset.name,
            symbol: asset.symbol,
            price: asset.price,
            change: asset.change,
            changePercent: asset.changePercent,
        }))
    }, [reviewData])

    const allocationData = reviewData?.allocation ? {
        stableYields: reviewData.allocation.stableYields,
        tokenizedStocks: reviewData.allocation.tokenizedStocks,
        tokenizedGold: reviewData.allocation.tokenizedGold,
    } : null

    const isLoading = status === 'idle' || status === 'awaiting' || status === 'received' || !reviewData

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

            {isLoading && (
                <div className="w-full rounded-xl bg-kiota-card p-4 text-center space-y-2">
                    <p className="text-sm font-medium">Waiting for deposit confirmation</p>
                    <p className="text-xs text-kiota-text-secondary">
                        {status === 'received'
                            ? 'Deposit detected. Waiting for network confirmations.'
                            : 'Send USDC to the address to continue.'}
                    </p>
                </div>
            )}

            {status === 'error' && (
                <div className="w-full rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-center">
                    <p className="text-sm font-medium text-red-400">Unable to confirm deposit</p>
                    <p className="text-xs text-red-300 mt-1">{error}</p>
                </div>
            )}

            {reviewData && allocationData && (
                <>
                    <AllocationBarChart data={allocationData} />

                    <PortfolioProjectionChart data={reviewData.projection} />

                    <AssetList
                        assets={assetRows}
                        title="Best Performing Assets"
                        description={reviewData.description}
                    />

                    <Button buttonColor="primary" className="w-full" onClick={handleConfirmDeposit}>
                        Confirm & Deposit
                    </Button>
                </>
            )}

            {!reviewData && (
                <Button buttonColor="primary" className="w-full" disabled>
                    {status === 'received'
                        ? 'Confirming onchain...'
                        : 'Waiting for deposit...'}
                </Button>
            )}
        </ScreenWrapper>
    )
}

export default ReviewDeposit
