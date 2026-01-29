import { ChartAreaLinear } from '@/components/custom/chart-area-linear'
import { ScreenWrapper } from '@/components/custom/screen-wrapper'
import { EyeClosed } from '@/lib/svg'
import Image from 'next/image'
import React from 'react'

const HomePage = () => {
    return (
        <div>
            <ScreenWrapper spaced>
                <div className='flex justify-between items-center'>
                    <div className="space-y-3">
                        <p className="text-xl text-kiota-text-secondary"> Your Total Asset</p>
                        <h1 className="text-3xl font-semibold"> $0.00</h1>
                        <p className="text-lg text-kiota-text-secondary"> 0.00%
                            $0.00 </p>
                    </div>
                    <div>
                        <Image src={EyeClosed} alt="" width={0} height={0} className='w-8 h-8' />
                    </div>
                </div>
                <ChartAreaLinear />
            </ScreenWrapper>
        </div>
    )
}

export default HomePage