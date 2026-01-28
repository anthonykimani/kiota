"use client"

import * as React from "react"
import { Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { assetClassConfig, type AssetClass } from "@/lib/constants"

export interface PortfolioItem {
  assetClass: AssetClass
  value: number
  color: string
  asset: string
  description: string
}

interface ChartPieDonutTextProps {
  data?: PortfolioItem[]
}

const defaultPortfolioData: PortfolioItem[] = [
  {
    assetClass: "preservation",
    value: 40,
    color: assetClassConfig.preservation.color,
    asset: "USDM",
    description: "Dollar-backed | 5% yield | Low risk",
  },
  {
    assetClass: "growth",
    value: 35,
    color: assetClassConfig.growth.color,
    asset: "bCSPX",
    description: "S&P 500 | ~10% avg return | Med risk",
  },
  {
    assetClass: "hedge",
    value: 25,
    color: assetClassConfig.hedge.color,
    asset: "PAXG",
    description: "Gold-backed | Inflation hedge | Stable",
  },
]

export function ChartPieDonutText({
  data = defaultPortfolioData,
}: ChartPieDonutTextProps) {
  const chartData = React.useMemo(
    () =>
      data.map((item) => ({
        name: assetClassConfig[item.assetClass].label,
        value: item.value,
        fill: item.color || assetClassConfig[item.assetClass].color,
      })),
    [data]
  )

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: "Allocation",
      },
    }
    data.forEach((item) => {
      config[item.assetClass] = {
        label: assetClassConfig[item.assetClass].label,
        color: item.color || assetClassConfig[item.assetClass].color,
      }
    })
    return config
  }, [data])

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-[250px] w-[250px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel nameKey="name" />}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={4}
          cornerRadius={12}
          stroke="none"
        >
          
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
