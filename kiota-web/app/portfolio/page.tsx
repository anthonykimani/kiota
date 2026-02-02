'use client'

import { useRouter } from 'next/navigation'
import { OnboardingCard } from '@/components/custom/onboarding-card'
import { ScreenWrapper } from '@/components/custom/screen-wrapper'
import { BottomNav } from '@/components/custom/bottom-nav'
import { portfolioOnboardingContent } from '@/lib/helpers'
import { PortfolioOnboarding } from '@/lib/svg'
import React from 'react'

const PortfolioPage = () => {
    const router = useRouter()

    const handleGetStarted = () => {
        router.push('/portfolio/add-money')
    }

    return (
        <div>
            <ScreenWrapper centered className="justify-end pb-24 gap-y-6">
                <OnboardingCard
                    image={PortfolioOnboarding}
                    title={portfolioOnboardingContent.title}
                    subtitle={portfolioOnboardingContent.subtitle}
                    buttonText={portfolioOnboardingContent.buttonText}
                    onButtonClick={handleGetStarted}
                />
            </ScreenWrapper>
            <BottomNav />
        </div>
    )
}

export default PortfolioPage