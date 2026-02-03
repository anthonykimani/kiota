'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ScreenWrapper } from '@/components/custom/screen-wrapper'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/custom/page-header'
import { TransactionRow, TransactionSummary } from '@/components/custom/transaction-row'
import { CoinAmount, NoEntry, GiveIcon, PaymentIcon, UsdcSvg } from '@/lib/svg'
import { depositApi } from '@/lib/api/client'

const ConfirmDeposit = () => {
    const router = useRouter()
    const [depositSessionId, setDepositSessionId] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined') return
        const storedSessionId = localStorage.getItem('kiota_deposit_session_id')
        if (!storedSessionId) {
            router.push('/portfolio/add-money')
            return
        }
        setDepositSessionId(storedSessionId)
    }, [router])

    const handleBack = () => {
        router.push('/portfolio/review-deposit')
    }

    const handleSkip = () => {
        router.push('/home')
    }

    const handleConfirmDeposit = async () => {
        if (!depositSessionId || isSubmitting) return

        setIsSubmitting(true)
        setError(null)

        try {
            await depositApi.convertDeposit(depositSessionId)
            router.push('/home')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to convert deposit')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <ScreenWrapper centered className="py-6 gap-y-6">
            <PageHeader
                title="Confirm Deposit"
                onBack={handleBack}
                rightAction={
                    <button
                        type="button"
                        className="text-kiota-text-secondary text-sm p-2"
                        onClick={handleSkip}
                    >
                        Skip
                    </button>
                }
            />

            <Image src={UsdcSvg} alt="" width={0} height={0} className='w-10 h-10' />
            <h2 className='text-3xl font-bold'>USDC Deposit</h2>
            <p className="text-sm text-kiota-text-secondary">We will convert your USDC into your target allocation.</p>

            <TransactionSummary>
                <TransactionRow
                    label="Amount"
                    value="USDC"
                    secondaryValue="Onchain"
                    icon={CoinAmount}
                />
                <TransactionRow
                    label="Transaction Fee"
                    value="Network fees apply"
                    icon={NoEntry}
                />
                <TransactionRow
                    label="You Get"
                    value="Diversified Portfolio"
                    icon={GiveIcon}
                />
                <TransactionRow
                    label="Pay With"
                    value="Crypto Deposit"
                    icon={PaymentIcon}
                    showBorder={false}
                />
            </TransactionSummary>

            {error && (
                <div className="w-full rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-center">
                    <p className="text-xs text-red-300">{error}</p>
                </div>
            )}

            <Button buttonColor="primary" className="w-full mt-1" onClick={handleConfirmDeposit} disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Confirm Deposit'}
            </Button>
        </ScreenWrapper>
    )
}

export default ConfirmDeposit
