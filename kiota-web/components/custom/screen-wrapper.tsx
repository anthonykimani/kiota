import { cn } from "@/lib/utils"

interface ScreenWrapperProps {
  children: React.ReactNode
  className?: string
  centered?: boolean
}

export function ScreenWrapper({ children, className, centered }: ScreenWrapperProps) {
  return (
    <div className="kiota-background w-screen bg-no-repeat bg-cover bg-right flex justify-around">
      <div
        className={cn(
          "flex flex-col justify-around p-5 font-dm text-white h-screen max-w-100",
          centered && "items-center",
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}
