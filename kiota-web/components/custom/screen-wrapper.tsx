import { cn } from "@/lib/utils"

interface ScreenWrapperProps {
  children: React.ReactNode
  className?: string
  centered?: boolean
}

export function ScreenWrapper({ children, className, centered }: ScreenWrapperProps) {
  return (
    <div className="kiota-background w-full min-h-screen bg-no-repeat bg-cover bg-right flex justify-center overflow-x-hidden">
      <div
        className={cn(
          "flex flex-col p-5 font-dm text-white min-h-screen w-full max-w-100",
          centered && "items-center",
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}
