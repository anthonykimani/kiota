"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export interface PortfolioItem {
  name: string
  value: number
  emoji: string
  symbol: string
  description: string
}

interface ChartPieDonutTextProps {
  data?: PortfolioItem[]
  centerLabel?: string
}

const defaultPortfolioData: PortfolioItem[] = [
  {
    name: "Preservation (USDM)",
    value: 40,
    emoji: "🛡️",
    symbol: "USDM",
    description: "Dollar-backed | 5% yield | Low risk",
  },
  {
    name: "Growth (bCSPX)",
    value: 35,
    emoji: "📈",
    symbol: "bCSPX",
    description: "S&P 500 | ~10% avg return | Med risk",
  },
  {
    name: "Hedge (PAXG)",
    value: 25,
    emoji: "🥇",
    symbol: "PAXG",
    description: "Gold-backed | Inflation hedge | Stable",
  },
]

const chartColors = {
  USDM: "hsl(142, 76%, 36%)", // Green for preservation
  bCSPX: "hsl(221, 83%, 53%)", // Blue for growth
  PAXG: "hsl(45, 93%, 47%)", // Gold for hedge
} as const

export function ChartPieDonutText({
  data = defaultPortfolioData,
  centerLabel = "Portfolio",
}: ChartPieDonutTextProps) {
  const chartData = React.useMemo(
    () =>
      data.map((item) => ({
        name: item.symbol,
        value: item.value,
        fill: chartColors[item.symbol as keyof typeof chartColors] || "var(--chart-1)",
      })),
    [data]
  )

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: "Allocation",
      },
    }
    data.forEach((item, index) => {
      config[item.symbol] = {
        label: item.name,
        color: chartColors[item.symbol as keyof typeof chartColors] || `var(--chart-${index + 1})`,
      }
    })
    return config
  }, [data])

  const totalValue = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0)
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
          innerRadius={60}
          outerRadius={100}
          strokeWidth={2}
          stroke="hsl(var(--background))"
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-white text-3xl font-bold"
                    >
                      {totalValue}%
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-[#858699] text-sm"
                    >
                      {centerLabel}
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
