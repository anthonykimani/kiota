'use client'

import { AssetRow } from './asset-row'
import { cn } from '@/lib/utils'
import { type AssetRowData } from '@/lib/helpers'

interface MarketPerformanceProps {
    assets: AssetRowData[]
    className?: string
}

export function MarketPerformance({ assets, className }: MarketPerformanceProps) {
    return (
        <div className={className}>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Market Performance</h2>
                <button
                    type="button"
                    className="text-xs text-kiota-text-secondary hover:text-white transition-colors"
                >
                    View All
                </button>
            </div>
            <div className="bg-kiota-card p-4 rounded-xl w-full">
                {assets.map((asset, index) => (
                    <AssetRow
                        key={asset.ticker}
                        asset={asset}
                        showBorder={index < assets.length - 1}
                    />
                ))}
            </div>
        </div>
    )
}
