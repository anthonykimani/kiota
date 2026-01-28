'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ScreenWrapper } from '@/components/custom/screen-wrapper'
import { ChartPieDonutText, type PortfolioItem } from '@/components/custom/chart-pie-donut'
import Image from 'next/image'
import { ShieldSvg, DataSvg, CrownSvg } from '@/lib/svg'

const portfolioData: PortfolioItem[] = [
    {
        assetClass: 'preservation',
        value: 40,
        color: "hsl(142, 76%, 36%)",
        asset: 'USDM',
        description: 'Dollar-backed | 5% yield | Low risk',
    },
    {
        assetClass: 'growth',
        value: 35,
        color: "hsl(221, 83%, 53%)",
        asset: 'bCSPX',
        description: 'S&P 500 | ~10% avg return | Med risk',
    },
    {
        assetClass: 'hedge',
        value: 25,
        color: "hsl(45, 93%, 47%)",
        asset: 'PAXG',
        description: 'Gold-backed | Inflation hedge | Stable',
    },
]

const assetClassLabels = {
    preservation: 'Preservation',
    growth: 'Growth',
    hedge: 'Hedge',
} as const

const resultOverview = [
    {
        icon: ShieldSvg,
        title: 'Dollar-Backed • 5% Yield • Low Risk',
        titleColor: '#2E90FA',
        description: 'USDM protects from KES depreciation while earning 5%',
    },
    {
        icon: DataSvg,
        title: 'S&P 500 • 10% avg return • Medium Risk',
        titleColor: '#34C759',
        description: 'Tokenized Assets for long-term wealth building',
    },
    {
        icon: CrownSvg,
        title: 'Inflation Hedge • Gold-Backed • Stable • Low Risk',
        titleColor: '#FF8D28',
        description: 'Tokenized Assets for long-term wealth building',
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
        <ScreenWrapper centered className="gap-6 py-8">
            <div className="text-center">
                <h3 className="text-2xl font-bold">Your Investment Strategy</h3>
                <h4 className="text-sm text-[#858699] mt-2">Based on your answers, we recommend:</h4>
            </div>

            <ChartPieDonutText data={portfolioData} />

            <div className="flex flex-col gap-2 bg-[#14141C] p-4 rounded-lg w-full">
                {portfolioData.map((item) => (
                    <div key={item.assetClass} className="flex items-center gap-3 text-sm">
                        <div
                            className="size-3 rounded-xs"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{assetClassLabels[item.assetClass]}</span>
                        <span className="text-[#858699]">{item.value}%</span>
                    </div>
                ))}
            </div>

            <h3 className="text-lg font-bold">Why This works for you:</h3>

            <div className="flex flex-col gap-3 w-full">
                {resultOverview.map((item, index) => (
                    <div key={index} className="flex flex-col gap-2 bg-[#14141C] p-4 rounded-lg w-full">
                        <div className="flex items-center gap-2">
                            <Image src={item.icon} alt="" width={25} height={25} />
                            <span className="font-medium text-sm" style={{ color: item.titleColor }}>{item.title}</span>
                        </div>
                        <span className="text-[#858699] text-xs">{item.description}</span>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3 w-full mt-4">
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
