"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { InfoCard } from "@/components/ui/info-card"
import { LegendItem } from "@/components/ui/legend-item"
import { ScreenWrapper } from "@/components/custom/screen-wrapper"
import { ChartPieDonutText } from "@/components/custom/chart-pie-donut"
import { defaultPortfolioData, resultOverviewData, getAssetClassLabel } from "@/lib/portfolio"

export default function ResultPage() {
  const router = useRouter()

  const handleContinue = () => {
    // TODO: Navigate to dashboard or next step
    router.push("/")
  }

  const handleRetakeQuiz = () => {
    localStorage.removeItem("quiz-answers")
    router.push("/quiz")
  }

  return (
    <ScreenWrapper centered className="gap-6 py-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">Your Investment Strategy</h1>
        <p className="text-sm text-kiota-text-secondary mt-2">
          Based on your answers, we recommend:
        </p>
      </div>

      {/* Chart */}
      <ChartPieDonutText data={defaultPortfolioData} />

      {/* Legend */}
      <div className="flex flex-col gap-2 bg-kiota-card p-4 rounded-lg w-full">
        {defaultPortfolioData.map((item) => (
          <LegendItem
            key={item.assetClass}
            color={item.color}
            label={getAssetClassLabel(item.assetClass)}
            value={`${item.value}%`}
          />
        ))}
      </div>

      {/* Why this works section */}
      <h2 className="text-lg font-bold">Why This works for you:</h2>

      <div className="flex flex-col gap-3 w-full">
        {resultOverviewData.map((item, index) => (
          <InfoCard
            key={index}
            icon={item.icon}
            title={item.title}
            titleColor={item.titleColor}
            description={item.description}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full mt-4">
        <Button buttonColor="primary" onClick={handleContinue} className="w-full">
          Continue
        </Button>
        <button
          type="button"
          onClick={handleRetakeQuiz}
          className="text-kiota-text-secondary text-sm underline"
        >
          Retake Quiz
        </button>
      </div>
    </ScreenWrapper>
  )
}
