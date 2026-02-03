"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "A linear area chart"

export interface ChartDataPoint {
  date: string
  value: number
}

interface ChartAreaLinearProps {
  data?: ChartDataPoint[]
  hasAssets?: boolean
}

const chartConfig = {
  value: {
    label: "Value",
    color: "#2563EB",
  },
} satisfies ChartConfig

// Generate flat line data for users with no assets (flat line in the middle)
function generateFlatLineData(): ChartDataPoint[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
  return months.map(month => ({
    date: month,
    value: 50,
  }))
}

export function ChartAreaLinear({ data, hasAssets = false }: ChartAreaLinearProps) {
  // Use flat line data if no assets or no data provided
  const chartData = hasAssets && data && data.length > 0 
    ? data 
    : generateFlatLineData()

  return (
    <ChartContainer
      className="h-40 w-[calc(100%+2.5rem)] -mx-5"
      config={chartConfig}
    >
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <defs>
          <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="#2563EB"
              stopOpacity={0.6}
            />
            <stop
              offset="100%"
              stopColor="#2563EB"
              stopOpacity={0.05}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => typeof value === 'string' ? value.slice(0, 3) : value}
        />
        <YAxis 
          domain={[0, 100]} 
          hide={true}
        />
        {hasAssets && (
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" hideLabel />}
          />
        )}
        <Area
          dataKey="value"
          type="linear"
          fill="url(#fillValue)"
          fillOpacity={1}
          stroke="#2563EB"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
