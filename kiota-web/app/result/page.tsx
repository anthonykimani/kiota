"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { InfoCard } from "@/components/custom/info-card"
import { LegendItem } from "@/components/custom/legend-item"
import { ScreenWrapper } from "@/components/custom/screen-wrapper"
import { ChartPieDonutText } from "@/components/custom/chart-pie-donut"
import { getAssetClassLabel, type PortfolioItem } from "@/lib/portfolio"
import { assetClassConfig } from "@/lib/constants"
import { useQuiz } from "@/hooks/use-quiz"
import { useAuth } from "@/context/auth-context"
import { quizApi } from "@/lib/api/client"
import type { Strategy } from "@/lib/api/types"
import { ShieldSvg, DataSvg, CrownSvg } from "@/lib/svg"

export default function ResultPage() {
  const router = useRouter()
  const { isAuthenticated, refreshUser } = useAuth()
  const { acceptStrategy, isAccepting } = useQuiz()
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [portfolioData, setPortfolioData] = useState<PortfolioItem[]>([])

  const applyStrategy = (nextStrategy: Strategy) => {
    setStrategy(nextStrategy)

    if (nextStrategy?.allocation) {
      const { stableYields, defiYield, tokenizedStocks, tokenizedGold } = nextStrategy.allocation
      setPortfolioData([
        {
          assetClass: "preservation",
          value: stableYields,
          color: assetClassConfig.preservation.color,
          asset: nextStrategy.assets?.stableYields || "USDM",
          description: "Dollar-backed | yield-focused | Low risk",
        },
        {
          assetClass: "yield",
          value: defiYield,
          color: assetClassConfig.yield.color,
          asset: nextStrategy.assets?.defiYield || "USDE",
          description: "On-chain yield | variable returns",
        },
        {
          assetClass: "growth",
          value: tokenizedStocks,
          color: assetClassConfig.growth.color,
          asset: nextStrategy.assets?.tokenizedStocks || "bCSPX",
          description: "Equities exposure | growth focused",
        },
        {
          assetClass: "hedge",
          value: tokenizedGold,
          color: assetClassConfig.hedge.color,
          asset: nextStrategy.assets?.tokenizedGold || "PAXG",
          description: "Hedge allocation | stability focused",
        },
      ])
    }
  }

  // Load strategy from localStorage or latest session
  useEffect(() => {
    const storedStrategy = localStorage.getItem("quiz-strategy")
    const storedSessionId = localStorage.getItem("quiz-session-id")

    if (storedStrategy) {
      try {
        const parsed = JSON.parse(storedStrategy)
        if (parsed?.strategy) {
          applyStrategy(parsed.strategy)
        }
      } catch (e) {
        console.error("Failed to parse strategy:", e)
      }
    }

    if (storedSessionId) {
      setSessionId(storedSessionId)
    }

    if (!storedStrategy && isAuthenticated) {
      quizApi.getLatestSession().then((response) => {
        const session = response.data?.session
        if (!session?.aiResponse) return

        const ai = session.aiResponse as any
        if (ai?.allocation && ai?.strategyName) {
          const nextStrategy: Strategy = {
            name: ai.strategyName,
            allocation: ai.allocation,
            rationale: ai.rationale || "",
            expectedReturn: ai.expectedReturn || 0,
            riskLevel: ai.riskLevel || "",
            assets: ai.defaultAssets || {
              stableYields: "USDM",
              defiYield: "USDE",
              tokenizedStocks: "bCSPX",
              tokenizedGold: "PAXG",
            },
          }
          applyStrategy(nextStrategy)
        }
      }).catch(() => null)
    }
  }, [isAuthenticated])

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

  const overviewItems = strategy ? [
    {
      icon: ShieldSvg,
      title: `${strategy.assets?.stableYields || 'USDM'} • ${strategy.allocation.stableYields}%`,
      titleColor: assetClassConfig.preservation.textColor,
      description: `Stable allocation for capital preservation.`,
    },
    {
      icon: DataSvg,
      title: `${strategy.assets?.defiYield || 'USDE'} • ${strategy.allocation.defiYield}%`,
      titleColor: assetClassConfig.yield.textColor,
      description: `On-chain yield allocation with variable returns.`,
    },
    {
      icon: CrownSvg,
      title: `${strategy.assets?.tokenizedStocks || 'bCSPX'} • ${strategy.allocation.tokenizedStocks}%`,
      titleColor: assetClassConfig.growth.textColor,
      description: `Growth allocation aligned to your risk level.`,
    },
    {
      icon: ShieldSvg,
      title: `${strategy.assets?.tokenizedGold || 'PAXG'} • ${strategy.allocation.tokenizedGold}%`,
      titleColor: assetClassConfig.hedge.textColor,
      description: `Hedge allocation for downside protection.`,
    },
  ] : []

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
        {overviewItems.length > 0 ? (
          overviewItems.map((item, index) => (
            <InfoCard
              key={index}
              icon={item.icon}
              title={item.title}
              titleColor={item.titleColor}
              description={item.description}
            />
          ))
        ) : (
          <div className="text-center text-sm text-kiota-text-secondary">
            Complete the quiz to generate your strategy.
          </div>
        )}
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
