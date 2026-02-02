'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

interface AmountChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  amount: number
  selected?: boolean
  currency?: string
}

export function AmountChip({
  amount,
  selected = false,
  currency = "$",
  className,
  ...props
}: AmountChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "border rounded-full px-4 py-2 text-sm font-medium transition-all",
        selected
          ? "border-kiota-accent bg-kiota-accent/20 text-white"
          : "border-white/50 text-white hover:border-white",
        className
      )}
      {...props}
    >
      {currency}{amount}
    </button>
  )
}
