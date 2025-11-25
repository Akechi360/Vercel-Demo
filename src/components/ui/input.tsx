import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          // Default theme styles - will be overridden by custom className if provided
          !className?.includes('bg-') && "bg-background",
          !className?.includes('border-') && "border border-input",
          !className?.includes('text-') && "text-foreground file:text-foreground",
          !className?.includes('placeholder') && "placeholder:text-muted-foreground",
          !className?.includes('ring-offset') && "ring-offset-background",
          !className?.includes('ring-ring') && "focus-visible:ring-ring",
          // Custom className last to override
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
