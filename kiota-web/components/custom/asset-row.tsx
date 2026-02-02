'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { formatCurrency, formatChange, type AssetRowData } from '@/lib/helpers'

interface AssetRowProps {
    asset: AssetRowData
    showBorder?: boolean
    className?: string
}

export function AssetRow({ asset, showBorder = true, className }: AssetRowProps) {
    const isPositive = asset.change >= 0

    return (
        <div className={cn(
            "flex items-center justify-between py-3",
            showBorder && "border-b border-white/10",
            className
        )}>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                    <Image
                        src={asset.icon}
                        alt={asset.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div>
                    <h3 className="text-sm font-semibold">{asset.name}</h3>
                    <p className="text-xs text-kiota-text-secondary">{asset.symbol}</p>
                </div>
            </div>
            <div className="text-right">
                <h3 className="text-sm font-semibold">{formatCurrency(asset.price)}</h3>
                <p className={cn(
                    "text-xs",
                    isPositive ? "text-green-500" : "text-red-500"
                )}>
                    {formatChange(asset.change, asset.changePercent)}
                </p>
            </div>
        </div>
    )
}

interface AssetListProps {
    assets: AssetRowData[]
    title?: string
    description?: string
    className?: string
}

export function AssetList({ assets, title, description, className }: AssetListProps) {
    return (
        <div className={cn("bg-kiota-card p-4 rounded-xl w-full", className)}>
            {(title || description) && (
                <div className="mb-4">
                    {title && <h3 className="text-base font-semibold">{title}</h3>}
                    {description && <p className="text-xs text-kiota-text-secondary">{description}</p>}
                </div>
            )}
            <div>
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
