import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center border-2 px-3 py-1 text-xs font-bold uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]",
        secondary:
          "border-secondary bg-secondary text-secondary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]",
        destructive:
          "border-destructive bg-destructive text-destructive-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]",
        outline: "text-foreground border-border bg-background",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
