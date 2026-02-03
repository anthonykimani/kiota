"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { InfoCard } from "@/components/custom/info-card"
import { LegendItem } from "@/components/custom/legend-item"
import { ScreenWrapper } from "@/components/custom/screen-wrapper"
import { ChartPieDonutText } from "@/components/custom/chart-pie-donut"
import { defaultPortfolioData, resultOverviewData, getAssetClassLabel, type PortfolioItem } from "@/lib/portfolio"
import { assetClassConfig } from "@/lib/constants"
import { useQuiz } from "@/hooks/use-quiz"
import { useAuth } from "@/context/auth-context"
import type { Strategy } from "@/lib/api/types"

export default function ResultPage() {
  const router = useRouter()
  const { isAuthenticated, refreshUser } = useAuth()
  const { acceptStrategy, isAccepting } = useQuiz()
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [portfolioData, setPortfolioData] = useState<PortfolioItem[]>(defaultPortfolioData)

  // Load strategy from localStorage on mount
  useEffect(() => {
    const storedStrategy = localStorage.getItem("quiz-strategy")
    const storedSessionId = localStorage.getItem("quiz-session-id")

    if (storedStrategy) {
      try {
        const parsed = JSON.parse(storedStrategy)
        setStrategy(parsed.strategy)
        
        // Convert API allocation to portfolio data format
        if (parsed.strategy?.allocation) {
          const { stableYields, tokenizedStocks, tokenizedGold } = parsed.strategy.allocation
          setPortfolioData([
            {
              assetClass: "preservation",
              value: stableYields,
              color: assetClassConfig.preservation.color,
              asset: parsed.strategy.assets?.stableYields || "USDM",
              description: "Dollar-backed | 5% yield | Low risk",
            },
            {
              assetClass: "growth",
              value: tokenizedStocks,
              color: assetClassConfig.growth.color,
              asset: parsed.strategy.assets?.tokenizedStocks || "bCSPX",
              description: "S&P 500 | ~10% avg return | Med risk",
            },
            {
              assetClass: "hedge",
              value: tokenizedGold,
              color: assetClassConfig.hedge.color,
              asset: parsed.strategy.assets?.tokenizedGold || "PAXG",
              description: "Gold-backed | Inflation hedge | Stable",
            },
          ])
        }
      } catch (e) {
        console.error("Failed to parse strategy:", e)
      }
    }

    if (storedSessionId) {
      setSessionId(storedSessionId)
    }
  }, [])

  const handleContinue = async () => {
    // Accept strategy if we have a session
    if (isAuthenticated && sessionId) {
      await acceptStrategy(sessionId, true)
      // Refresh user data to update hasCompletedQuiz
      await refreshUser()
    }

    // Clean up localStorage
    localStorage.removeItem("quiz-answers")
    localStorage.removeItem("quiz-strategy")
    localStorage.removeItem("quiz-session-id")

    router.push("/home")
  }

  const handleRetakeQuiz = () => {
    localStorage.removeItem("quiz-answers")
    localStorage.removeItem("quiz-strategy")
    localStorage.removeItem("quiz-session-id")
    router.push("/quiz")
  }

  return (
    <ScreenWrapper centered className="gap-6 py-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">
          {strategy?.name || "Your Investment Strategy"}
        </h1>
        <p className="text-sm text-kiota-text-secondary mt-2">
          Based on your answers, we recommend:
        </p>
      </div>

      {/* Chart */}
      <ChartPieDonutText data={portfolioData} />

      {/* Legend */}
      <div className="flex flex-col gap-2 bg-kiota-card p-4 rounded-lg w-full">
        {portfolioData.map((item) => (
          <LegendItem
            key={item.assetClass}
            color={item.color}
            label={getAssetClassLabel(item.assetClass)}
            value={`${item.value}%`}
          />
        ))}
      </div>

      {/* Strategy rationale if available */}
      {strategy?.rationale && (
        <div className="bg-kiota-card p-4 rounded-lg w-full">
          <h3 className="text-sm font-semibold text-kiota-text-secondary mb-2">AI Rationale</h3>
          <p className="text-sm">{strategy.rationale}</p>
        </div>
      )}

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

      {/* Expected returns if available */}
      {strategy?.expectedReturn && (
        <div className="bg-kiota-card p-4 rounded-lg w-full text-center">
          <p className="text-sm text-kiota-text-secondary">Expected Annual Return</p>
          <p className="text-2xl font-bold text-green-500">
            {strategy.expectedReturn.toFixed(1)}%
          </p>
          <p className="text-xs text-kiota-text-secondary">
            Risk Level: {strategy.riskLevel}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full mt-4">
        <Button 
          buttonColor="primary" 
          onClick={handleContinue} 
          className="w-full"
          disabled={isAccepting}
        >
          {isAccepting ? "Saving..." : "Continue"}
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
