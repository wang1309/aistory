import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface FloatingActionButtonProps {
  icon: LucideIcon
  onClick?: () => void
  className?: string
  variant?: "primary" | "secondary" | "accent"
  size?: "sm" | "md" | "lg"
  disabled?: boolean
}

export function FloatingActionButton({
  icon: Icon,
  onClick,
  className,
  variant = "primary",
  size = "md",
  disabled = false,
}: FloatingActionButtonProps) {
  const variants = {
    primary: "bg-primary hover:bg-primary/90",
    secondary: "bg-secondary hover:bg-secondary/90",
    accent: "bg-accent hover:bg-accent/90",
  }

  const sizes = {
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-14 w-14",
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full shadow-strong hover:shadow-elevated transform hover:scale-110 transition-all duration-200",
        variants[variant],
        sizes[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <Icon className="h-5 w-5" />
    </Button>
  )
}
