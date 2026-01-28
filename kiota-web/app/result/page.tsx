'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ScreenWrapper } from '@/components/custom/screen-wrapper'
import { ChartPieDonutText, type PortfolioItem } from '@/components/custom/chart-pie-donut'

const portfolioData: PortfolioItem[] = [
    {
        name: 'Preservation (USDM)',
        value: 40,
        emoji: '🛡️',
        symbol: 'USDM',
        description: 'Dollar-backed | 5% yield | Low risk',
    },
    {
        name: 'Growth (bCSPX)',
        value: 35,
        emoji: '📈',
        symbol: 'bCSPX',
        description: 'S&P 500 | ~10% avg return | Med risk',
    },
    {
        name: 'Hedge (PAXG)',
        value: 25,
        emoji: '🥇',
        symbol: 'PAXG',
        description: 'Gold-backed | Inflation hedge | Stable',
    },
]

const ResultPage = () => {
    const router = useRouter()

    const handleContinue = () => {
        // TODO: Navigate to dashboard or next step
        router.push('/')
    }

    const handleRetakeQuiz = () => {
        localStorage.removeItem('quiz-answers')
        router.push('/quiz')
    }

    return (
        <ScreenWrapper centered>
            <h3 className="text-2xl font-bold">Your Investment Strategy</h3>
            <h4 className="text-sm text-[#858699]">Based on your answers, we recommend:</h4>

            <div className="flex flex-col items-center gap-4">
                <ChartPieDonutText data={portfolioData} centerLabel="Allocation" />

                <div className="flex flex-col gap-2 mt-4">
                    {portfolioData.map((item) => (
                        <div key={item.symbol} className="flex items-center gap-3 text-sm">
                            <span>{item.emoji}</span>
                            <span className="font-medium">{item.symbol}</span>
                            <span className="text-[#858699]">{item.value}%</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
                <Button buttonColor="primary" onClick={handleContinue} className="w-full">
                    Continue
                </Button>
                <button
                    type="button"
                    onClick={handleRetakeQuiz}
                    className="text-[#858699] text-sm underline"
                >
                    Retake Quiz
                </button>
            </div>
        </ScreenWrapper>
    )
}

export default ResultPage
