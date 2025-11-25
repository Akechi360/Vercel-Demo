import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 shadow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-sm",
        success:
          "border-transparent bg-success text-success-foreground hover:bg-success/80 shadow-sm",
        warning:
          "border-transparent bg-warning text-warning-foreground hover:bg-warning/80 shadow-sm",
        info:
          "border-transparent bg-blue-500 text-white hover:bg-blue-600 shadow-sm",
        outline: "text-foreground",
        // Soft variants for a more subtle look
        "soft-success": "border-transparent bg-success/15 text-success hover:bg-success/25",
        "soft-warning": "border-transparent bg-warning/15 text-warning hover:bg-warning/25",
        "soft-destructive": "border-transparent bg-destructive/15 text-destructive hover:bg-destructive/25",
        "soft-blue": "border-transparent bg-blue-500/15 text-blue-500 hover:bg-blue-500/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
