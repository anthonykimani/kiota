"use client"

import { useMemo } from "react"
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

  // Calculate dynamic Y-axis domain based on actual data
  const yDomain = useMemo(() => {
    if (!hasAssets || !data || data.length === 0) {
      return [0, 100] as [number, number]
    }

    const values = data.map(d => Number(d.value) || 0)
    const min = Math.min(...values)
    const max = Math.max(...values)
    
    // Add 10% padding to top and bottom
    const padding = (max - min) * 0.1 || max * 0.1 || 10
    const yMin = Math.max(0, min - padding)
    const yMax = max + padding

    return [yMin, yMax] as [number, number]
  }, [hasAssets, data])

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
          interval="preserveStartEnd"
          tickFormatter={(value) => {
            if (value == null || value === '') return ''
            return String(value)
          }}
        />
        <YAxis 
          domain={yDomain} 
          hide={true}
        />
        {hasAssets && (
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent 
                indicator="dot" 
                hideLabel 
                formatter={(value) => {
                  const num = Number(value)
                  if (isNaN(num)) return ['$0.00', 'Balance']
                  return [`$${num.toFixed(2)}`, 'Balance']
                }}
              />
            }
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
