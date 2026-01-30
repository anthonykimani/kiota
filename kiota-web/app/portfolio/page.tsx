import { OnboardingCard } from '@/components/custom/onboarding-card'
import { ScreenWrapper } from '@/components/custom/screen-wrapper'
import { BottomNav } from '@/components/ui/bottom-nav'
import { portfolioOnboardingContent } from '@/lib/helpers'
import { PortfolioOnboarding } from '@/lib/svg'
import React from 'react'

const PortfolioPage = () => {
    return (
        <div>
            <ScreenWrapper centered className="justify-end pb-24 gap-y-6">
                <OnboardingCard
                    image={PortfolioOnboarding}
                    title={portfolioOnboardingContent.title}
                    subtitle={portfolioOnboardingContent.subtitle}
                    buttonText={portfolioOnboardingContent.buttonText}
                />
            </ScreenWrapper>
            <BottomNav />
        </div>
    )
}

export default PortfolioPage