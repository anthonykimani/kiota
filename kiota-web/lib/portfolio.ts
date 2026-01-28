import { assetClassConfig, type AssetClass } from "./constants"
import { ShieldSvg, DataSvg, CrownSvg } from "./svg"

export interface PortfolioItem {
  assetClass: AssetClass
  value: number
  color: string
  asset: string
  description: string
}

export interface ResultOverviewItem {
  icon: string
  title: string
  titleColor: string
  description: string
}

// Default portfolio allocation
export const defaultPortfolioData: PortfolioItem[] = [
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

// Result page overview cards
export const resultOverviewData: ResultOverviewItem[] = [
  {
    icon: ShieldSvg,
    title: "Dollar-Backed • 5% Yield • Low Risk",
    titleColor: assetClassConfig.preservation.textColor,
    description: "USDM protects from KES depreciation while earning 5%",
  },
  {
    icon: DataSvg,
    title: "S&P 500 • 10% avg return • Medium Risk",
    titleColor: assetClassConfig.growth.textColor,
    description: "Tokenized Assets for long-term wealth building",
  },
  {
    icon: CrownSvg,
    title: "Inflation Hedge • Gold-Backed • Stable • Low Risk",
    titleColor: assetClassConfig.hedge.textColor,
    description: "Tokenized Assets for long-term wealth building",
  },
]

// Helper to get asset class label
export function getAssetClassLabel(assetClass: AssetClass): string {
  return assetClassConfig[assetClass].label
}
