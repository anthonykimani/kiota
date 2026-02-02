'use client'

import * as React from 'react'
import { CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react'
import { ChartPieDonutText, PortfolioItem } from './chart-pie-donut'
import { AssetRow } from './asset-row'
import { assetClassConfig, AssetClass } from '@/lib/constants'
import { formatCurrency, type AssetClassData, type UserPortfolio } from '@/lib/helpers'
import { cn } from '@/lib/utils'

interface AssetClassDropdownProps {
    data: AssetClassData
    defaultOpen?: boolean
}

function AssetClassDropdown({ data, defaultOpen = false }: AssetClassDropdownProps) {
    const [isOpen, setIsOpen] = React.useState(defaultOpen)
    const config = assetClassConfig[data.assetClass]

    return (
        <div className="border-b border-white/10 last:border-b-0">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-3 px-1"
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: config.color }}
                    />
                    <span className="text-sm font-medium">{config.label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{formatCurrency(data.totalValue)}</span>
                    {isOpen ? (
                        <CaretUpIcon size={16} className="text-kiota-text-secondary" />
                    ) : (
                        <CaretDownIcon size={16} className="text-kiota-text-secondary" />
                    )}
                </div>
            </button>
            {isOpen && (
                <div className="pb-2">
                    {data.assets.map((asset, index) => (
                        <AssetRow
                            key={asset.ticker}
                            asset={asset}
                            showBorder={index < data.assets.length - 1}
                            className="pl-6"
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

interface PortfolioOverviewProps {
    portfolio: UserPortfolio
    className?: string
}

export function PortfolioOverview({ portfolio, className }: PortfolioOverviewProps) {
    // Convert portfolio data to pie chart format
    const pieChartData: PortfolioItem[] = portfolio.assetClasses.map((ac) => ({
        assetClass: ac.assetClass,
        value: Math.round((ac.totalValue / portfolio.totalValue) * 100),
        color: assetClassConfig[ac.assetClass].color,
        asset: ac.assets[0]?.ticker || '',
        description: `${formatCurrency(ac.totalValue)}`,
    }))

    return (
        <div className={className}>
            <h2 className="text-lg font-semibold mb-3">My Portfolio</h2>
            <div className="bg-kiota-card p-4 rounded-xl w-full">
                {/* Pie Chart */}
                <div className="flex justify-center mb-4">
                    <ChartPieDonutText data={pieChartData} />
                </div>

                {/* Asset Class Dropdowns */}
                <div>
                    {portfolio.assetClasses.map((ac, index) => (
                        <AssetClassDropdown
                            key={ac.assetClass}
                            data={ac}
                            defaultOpen={index === 0}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
