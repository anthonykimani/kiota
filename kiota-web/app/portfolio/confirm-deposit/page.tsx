'use client'

import Image from 'next/image'
import { ScreenWrapper } from '@/components/custom/screen-wrapper'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/custom/page-header'
import { TransactionRow, TransactionSummary } from '@/components/custom/transaction-row'
import { CoinAmount, NoEntry, GiveIcon, PaymentIcon, UsdcSvg } from '@/lib/svg'

const ConfirmDeposit = () => {
    return (
        <ScreenWrapper centered className="py-6 gap-y-6">
            <PageHeader
                title="Confirm Deposit"
                onBack={() => { }}
                rightAction={
                    <button
                        type="button"
                        className="text-kiota-text-secondary text-sm p-2"
                    >
                        Skip
                    </button>
                }
            />

            <Image src={UsdcSvg} alt="" width={0} height={0} className='w-10 h-10' />
            <h2 className='text-3xl font-bold'>1,125 USDC</h2>
            <p className="text-sm text-kiota-text-secondary">Equivalent of 1290.00 KES</p>

            <TransactionSummary>
                <TransactionRow
                    label="Amount"
                    value="1290.00"
                    secondaryValue="KES"
                    icon={CoinAmount}
                />
                <TransactionRow
                    label="Transaction Fee"
                    value="20 KES"
                    icon={NoEntry}
                />
                <TransactionRow
                    label="You Get"
                    value="10 USDC"
                    icon={GiveIcon}
                />
                <TransactionRow
                    label="Pay With"
                    value="Mpesa ••7781"
                    icon={PaymentIcon}
                    showBorder={false}
                />
            </TransactionSummary>

            <Button buttonColor="primary" className="w-full mt-1">
                Confirm Deposit
            </Button>
        </ScreenWrapper>
    )
}

export default ConfirmDeposit