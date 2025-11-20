import * as React from "react"
import { cn } from "@/lib/utils"

interface HealthBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max: number
  label?: string
  showValue?: boolean
  variant?: 'default' | 'destructive'
}

const HealthBar = React.forwardRef<HTMLDivElement, HealthBarProps>(
  ({ className, value, max, label = "HP", showValue = true, variant = 'default', ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {(label || showValue) && (
          <div className="flex justify-between mb-2">
            {label && (
              <span className="text-xs font-bold uppercase font-mono text-foreground">
                {label}
              </span>
            )}
            {showValue && (
              <span className="text-xs font-bold font-mono text-foreground">
                {value}/{max}
              </span>
            )}
          </div>
        )}
        <div className="h-6 bg-muted border-4 border-foreground relative overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300",
              variant === 'destructive' ? (
                percentage > 50 ? "bg-red-500" : percentage > 25 ? "bg-orange-500" : "bg-red-700"
              ) : (
                percentage > 50 ? "bg-green-500" : percentage > 25 ? "bg-yellow-500" : "bg-red-500"
              )
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }
)
HealthBar.displayName = "HealthBar"

export { HealthBar }
