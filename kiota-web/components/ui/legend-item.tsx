import { cn } from "@/lib/utils"

interface LegendItemProps {
  color: string
  label: string
  value: string | number
  className?: string
}

export function LegendItem({ color, label, value, className }: LegendItemProps) {
  return (
    <div className={cn("flex items-center gap-3 text-sm", className)}>
      <div
        className="size-3 rounded-sm"
        style={{ backgroundColor: color }}
      />
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  )
}
