import { ChartAreaLinear } from '@/components/custom/chart-area-linear'
import { ScreenWrapper } from '@/components/custom/screen-wrapper'
import { ActionCard } from '@/components/ui/action-card'
import { CryptoTradingBot, EyeClosed, HedgeFund } from '@/lib/svg'
import Image from 'next/image'
import React from 'react'

const HomePage = () => {
    return (
        <div>
            <ScreenWrapper className="py-6 gap-y-6">
                <div className='flex justify-between items-center'>
                    <div className="space-y-1">
                        <p className="text-sm text-kiota-text-secondary">Your Total Asset</p>
                        <h1 className="text-3xl font-semibold">$0.00</h1>
                        <p className="text-sm text-kiota-text-secondary">0.00% $0.00</p>
                    </div>
                    <div>
                        <Image src={EyeClosed} alt="" width={0} height={0} className='w-8 h-8' />
                    </div>
                </div>

                <ChartAreaLinear />

                <div className="flex flex-col gap-y-6">
                    <ActionCard
                        sectionTitle="My Portfolio"
                        image={CryptoTradingBot}
                        title="Setup Portfolio"
                        subtitle="Let our roboadvisor help you make your first portfolio with ease"
                        buttonText="Setup Portfolio"
                    />

                    <ActionCard
                        sectionTitle="Market Performance"
                        image={HedgeFund}
                        title="You have no Market Watchlist"
                        subtitle="Let's setup your market watchlist today."
                        buttonText="Explore Markets"
                    />

                    <ActionCard
                        sectionTitle="My Investment Goals"
                        image={CryptoTradingBot}
                        title="You have no goals"
                        subtitle="You haven't set up any goals. Let's set it up today!"
                        buttonText="Setup Now"
                    />
                </div>
            </ScreenWrapper>
        </div>
    )
}

export default HomePage