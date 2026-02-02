'use client'

import * as React from "react"
import { CaretLeftIcon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  onBack?: () => void
  backDisabled?: boolean
  rightAction?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  onBack,
  backDisabled = false,
  rightAction,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between w-full", className)}>
      <button
        type="button"
        onClick={onBack}
        className="disabled:opacity-40 p-2"
        disabled={backDisabled}
        aria-label="Go back"
      >
        <CaretLeftIcon size={24} />
      </button>
      <h3>{title}</h3>
      {rightAction ? (
        rightAction
      ) : (
        <div className="p-2 w-10" aria-hidden="true" />
      )}
    </div>
  )
}
