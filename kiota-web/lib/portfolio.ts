import { assetClassConfig, type AssetClass } from "./constants"

export interface PortfolioItem {
  assetClass: AssetClass
  value: number
  color: string
  asset: string
  description: string
}

// Helper to get asset class label
export function getAssetClassLabel(assetClass: AssetClass): string {
  return assetClassConfig[assetClass].label
}
