import * as React from "react"
import { cn } from "@/src/lib/utils"

const Badge = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "secondary" | "destructive" | "outline" }>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "border-transparent bg-primary text-on-primary hover:bg-primary/90",
      secondary: "border-transparent bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80",
      destructive: "border-transparent bg-error text-on-error hover:bg-error/90",
      outline: "text-on-surface border-outline-variant",
    }
    return (
      <div ref={ref} className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold font-inter transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2", variants[variant], className)} {...props} />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
