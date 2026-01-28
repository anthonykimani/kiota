"use client"

import { cn } from "@/lib/utils"

interface QuizOptionProps {
  label: string
  helper?: string
  isSelected: boolean
  isMulti?: boolean
  onClick: () => void
}

export function QuizOption({
  label,
  helper,
  isSelected,
  isMulti = false,
  onClick,
}: QuizOptionProps) {
  return (
    <button
      type="button"
      role={!isMulti ? "radio" : undefined}
      aria-checked={!isMulti ? isSelected : undefined}
      aria-pressed={isMulti ? isSelected : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition cursor-pointer",
        isSelected
          ? "border-white/80 bg-white/10"
          : "border-white/10 bg-input"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-4 items-center justify-center rounded-full border transition",
          isSelected ? "border-accent bg-accent" : "border-white/30"
        )}
      >
        <span
          className={cn(
            "block size-2 rounded-full bg-white transition",
            isSelected ? "opacity-100" : "opacity-0"
          )}
        />
      </span>
      <div className="space-y-1">
        <span className="text-white">{label}</span>
        {helper && (
          <p className="text-xs text-muted-foreground">{helper}</p>
        )}
      </div>
    </button>
  )
}
