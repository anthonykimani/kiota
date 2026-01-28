import { cn } from "@/lib/utils"

interface ScreenWrapperProps {
  children: React.ReactNode
  className?: string
  centered?: boolean
  /** Use justify-around for fixed-height screens (onboarding, quiz) */
  spaced?: boolean
}

export function ScreenWrapper({ children, className, centered, spaced }: ScreenWrapperProps) {
  return (
    <div className="kiota-background w-full min-h-screen bg-no-repeat bg-cover bg-right flex justify-center overflow-x-hidden">
      <div
        className={cn(
          "flex flex-col p-5 font-dm text-white w-full max-w-100",
          spaced ? "justify-around h-screen" : "min-h-screen",
          centered && "items-center",
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}
