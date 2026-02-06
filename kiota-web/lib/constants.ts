/**
 * Centralized theme constants for the Kiota application
 */

// Brand colors
export const colors = {
  // Primary brand gradient
  primary: {
    from: "#53389E",
    to: "#7F56D9",
    gradient: "linear-gradient(to right, #53389E, #7F56D9)",
  },
  
  // Accent color (used for selections, progress)
  accent: "#7A5AF8",
  
  // Background colors
  background: {
    dark: "#0A0A0F",
    card: "#14141C",
    input: "#101017",
  },
  
  // Text colors
  text: {
    primary: "#FFFFFF",
    secondary: "#858699",
    muted: "#6B6B80",
  },
  
  // Border colors
  border: {
    default: "rgba(255, 255, 255, 0.1)",
    active: "rgba(255, 255, 255, 0.8)",
  },
  
  // Asset class colors
  assetClass: {
    preservation: {
      color: "hsl(142, 76%, 36%)",
      text: "#34C759",
    },
    yield: {
      color: "hsl(172, 66%, 42%)",
      text: "#14B8A6",
    },
    growth: {
      color: "hsl(221, 83%, 53%)",
      text: "#2E90FA",
    },
    hedge: {
      color: "hsl(45, 93%, 47%)",
      text: "#FF8D28",
    },
  },
  
  // Progress bar
  progress: {
    track: "#303044",
    fill: "#7A5AF8",
  },
} as const

// Asset class configuration
export const assetClassConfig = {
  preservation: {
    label: "Preservation",
    color: colors.assetClass.preservation.color,
    textColor: colors.assetClass.preservation.text,
  },
  yield: {
    label: "DeFi Yield",
    color: colors.assetClass.yield.color,
    textColor: colors.assetClass.yield.text,
  },
  growth: {
    label: "Growth",
    color: colors.assetClass.growth.color,
    textColor: colors.assetClass.growth.text,
  },
  hedge: {
    label: "Hedge",
    color: colors.assetClass.hedge.color,
    textColor: colors.assetClass.hedge.text,
  },
} as const

export type AssetClass = keyof typeof assetClassConfig
