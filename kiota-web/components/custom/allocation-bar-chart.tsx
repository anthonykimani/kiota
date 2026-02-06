'use client'

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'

interface AllocationData {
    stableYields: number
    defiYield: number
    tokenizedStocks: number
    tokenizedGold: number
}

interface AllocationBarChartProps {
    data?: AllocationData
    className?: string
}

const defaultData: AllocationData = {
    stableYields: 40,
    defiYield: 10,
    tokenizedStocks: 35,
    tokenizedGold: 25,
}

const chartConfig = {
    stableYields: {
        label: "Stable Yields",
        color: "rgba(34, 197, 94, 0.5)",
    },
    defiYield: {
        label: "DeFi Yield",
        color: "rgba(45, 212, 191, 0.5)",
    },
    tokenizedStocks: {
        label: "Tokenized Stocks",
        color: "rgba(59, 130, 246, 0.5)",
    },
    tokenizedGold: {
        label: "Tokenized Gold",
        color: "rgba(234, 179, 8, 0.5)",
    },
} satisfies ChartConfig

export function AllocationBarChart({ data = defaultData, className }: AllocationBarChartProps) {
    const chartData = [
        { category: "Allocation", ...data },
    ]

    return (
        <div className={`bg-kiota-card p-4 rounded-xl w-full ${className ?? ''}`}>
            <ChartContainer config={chartConfig} className="w-full" style={{ height: '45px' }}>
                <BarChart
                    accessibilityLayer
                    data={chartData}
                    layout="vertical"
                    margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    barSize={45}
                >
                    <YAxis
                        dataKey="category"
                        type="category"
                        hide
                    />
                    <XAxis type="number" hide />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar
                        dataKey="stableYields"
                        stackId="a"
                        fill="var(--color-stableYields)"
                        stroke="rgba(34, 197, 94, 0.8)"
                        strokeWidth={1}
                        radius={[4, 0, 0, 4]}
                    />
                    <Bar
                        dataKey="defiYield"
                        stackId="a"
                        fill="var(--color-defiYield)"
                        stroke="rgba(45, 212, 191, 0.8)"
                        strokeWidth={1}
                        radius={0}
                    />
                    <Bar
                        dataKey="tokenizedStocks"
                        stackId="a"
                        fill="var(--color-tokenizedStocks)"
                        stroke="rgba(59, 130, 246, 0.8)"
                        strokeWidth={1}
                        radius={0}
                    />
                    <Bar
                        dataKey="tokenizedGold"
                        stackId="a"
                        fill="var(--color-tokenizedGold)"
                        stroke="rgba(234, 179, 8, 0.8)"
                        strokeWidth={1}
                        radius={[0, 4, 4, 0]}
                    />
                </BarChart>
            </ChartContainer>
            <div className="flex flex-col justify-center gap-4 mt-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(34, 197, 94, 0.5)', border: '1px solid rgba(34, 197, 94, 0.8)' }} />
                        <span className="text-xs text-kiota-text-secondary">Stable Yields</span>
                    </div>
                    <span className="text-xs font-medium">{data.stableYields}%</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(45, 212, 191, 0.5)', border: '1px solid rgba(45, 212, 191, 0.8)' }} />
                        <span className="text-xs text-kiota-text-secondary">DeFi Yield</span>
                    </div>
                    <span className="text-xs font-medium">{data.defiYield}%</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(59, 130, 246, 0.5)', border: '1px solid rgba(59, 130, 246, 0.8)' }} />
                        <span className="text-xs text-kiota-text-secondary">Tokenized Stocks</span>
                    </div>
                    <span className="text-xs font-medium">{data.tokenizedStocks}%</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(234, 179, 8, 0.5)', border: '1px solid rgba(234, 179, 8, 0.8)' }} />
                        <span className="text-xs text-kiota-text-secondary">Tokenized Gold</span>
                    </div>
                    <span className="text-xs font-medium">{data.tokenizedGold}%</span>
                </div>
            </div>
        </div>
    )
}
