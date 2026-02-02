'use client'

import * as React from "react"
import Image, { StaticImageData } from "next/image"
import { cn } from "@/lib/utils"

interface TransactionRowProps {
  label: string
  value: string | React.ReactNode
  secondaryValue?: string
  icon?: StaticImageData | string
  className?: string
  showBorder?: boolean
}

export function TransactionRow({
  label,
  value,
  secondaryValue,
  icon,
  className,
  showBorder = true,
}: TransactionRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between w-full py-4",
        showBorder && "border-b border-white/10",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {icon && (
          <Image src={icon} alt="" width={20} height={20} className="w-5 h-5" />
        )}
        <span className="text-sm text-kiota-text-secondary">{label}</span>
      </div>

      <div className="flex items-center gap-1.5 text-right">
        {secondaryValue && (
          <span className="text-sm text-kiota-text-secondary">{secondaryValue}</span>
        )}
        <span className="text-sm font-medium text-white">{value}</span>
      </div>
    </div>
  )
}

interface TransactionSummaryProps {
  children: React.ReactNode
  className?: string
}

export function TransactionSummary({ children, className }: TransactionSummaryProps) {
  return (
    <div className={cn("w-full rounded-lg bg-white/5 px-4", className)}>
      {children}
    </div>
  )
}
