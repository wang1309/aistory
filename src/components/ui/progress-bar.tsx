import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface ProgressBarProps {
  value: number // 0-100
  className?: string
  variant?: "default" | "gradient" | "striped"
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  label?: string
}

export function ProgressBar({
  value,
  className,
  variant = "default",
  size = "md",
  showLabel = false,
  label,
}: ProgressBarProps) {
  const variants = {
    default: "bg-primary",
    gradient: "bg-gradient-to-r from-primary via-pink-500 to-blue-500",
    striped: "bg-primary bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)_1]",
    striped2: "bg-[linear-gradient(to_right,rgba(255,255,255,0.1),rgba(255,255,255,0.3),rgba(255,255,255,0.1))]",
  }

  const sizes = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  }

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{label || "Progress"}</span>
          <span className="text-sm text-muted-foreground">{value}%</span>
        </div>
      )}
      <div
        className={cn(
          "w-full bg-muted rounded-full overflow-hidden",
          sizes[size]
        )}
      >
        <motion.div
          className={cn(
            "h-full rounded-full",
            variants[variant]
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}
