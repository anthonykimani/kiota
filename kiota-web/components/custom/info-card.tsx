import Image from "next/image"
import { cn } from "@/lib/utils"

interface InfoCardProps {
  icon?: string
  title: string
  titleColor?: string
  description: string
  className?: string
}

export function InfoCard({
  icon,
  title,
  titleColor,
  description,
  className,
}: InfoCardProps) {
  return (
    <div className={cn("flex flex-col gap-2 bg-card p-4 rounded-lg w-full", className)}>
      <div className="flex items-center gap-2">
        {icon && <Image src={icon} alt="" width={25} height={25} />}
        <span 
          className="font-medium text-sm" 
          style={titleColor ? { color: titleColor } : undefined}
        >
          {title}
        </span>
      </div>
      <span className="text-muted-foreground text-xs">{description}</span>
    </div>
  )
}
