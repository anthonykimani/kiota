'use client'

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart'

interface ChartDataPoint {
    date: string
    investment: number
    returns: number
}

interface PortfolioProjectionChartProps {
    data: ChartDataPoint[]
    className?: string
}

const chartConfig = {
    investment: {
        label: "Investment",
        color: "#2563EB",
    },
    returns: {
        label: "Returns",
        color: "#22C55E",
    },
} satisfies ChartConfig

export function PortfolioProjectionChart({ data, className }: PortfolioProjectionChartProps) {
    return (
        <div className={`bg-kiota-card p-4 rounded-xl w-full ${className ?? ''}`}>
            <div className="mb-4">
                <h3 className="text-base font-semibold">Portfolio Projection</h3>
                <p className="text-xs text-kiota-text-secondary">Visualize your potential portfolio growth based on current trends and contributions.</p>
            </div>
            <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[250px] w-full"
            >
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="fillInvestment" x1="0" y1="0" x2="0" y2="1">
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
                        <linearGradient id="fillReturns" x1="0" y1="0" x2="0" y2="1">
                            <stop
                                offset="0%"
                                stopColor="#22C55E"
                                stopOpacity={0.6}
                            />
                            <stop
                                offset="100%"
                                stopColor="#22C55E"
                                stopOpacity={0.05}
                            />
                        </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={32}
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                        tickFormatter={(value) => {
                            const date = new Date(value)
                            return date.toLocaleDateString("en-US", {
                                month: "short",
                            })
                        }}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={
                            <ChartTooltipContent
                                labelFormatter={(value) => {
                                    return new Date(value).toLocaleDateString("en-US", {
                                        month: "short",
                                        year: "numeric",
                                    })
                                }}
                                indicator="dot"
                            />
                        }
                    />
                    <Area
                        dataKey="investment"
                        type="monotone"
                        fill="url(#fillInvestment)"
                        stroke="#2563EB"
                        strokeWidth={2}
                        stackId="a"
                    />
                    <Area
                        dataKey="returns"
                        type="monotone"
                        fill="url(#fillReturns)"
                        stroke="#22C55E"
                        strokeWidth={2}
                        stackId="a"
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
            </ChartContainer>
        </div>
    )
}
