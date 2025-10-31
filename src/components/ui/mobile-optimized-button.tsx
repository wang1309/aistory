"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { LucideIcon } from "lucide-react"

interface MobileOptimizedButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: "default" | "primary" | "secondary" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
  icon?: LucideIcon
  checked?: boolean
  fullWidth?: boolean
  className?: string
}

export function MobileOptimizedButton({
  children,
  onClick,
  disabled = false,
  variant = "default",
  size = "default",
  icon: Icon,
  checked = false,
  fullWidth = false,
  className,
}: MobileOptimizedButtonProps) {
  const baseClasses = cn(
    "h-11 px-6 font-medium text-sm",
    "touch-manipulation", // Optimize for touch
    "active:scale-95", // Provide immediate feedback on touch
    "transition-all duration-200", // Smooth transitions
    fullWidth && "w-full",
    disabled && "cursor-not-allowed opacity-50",
    className
  )

  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    primary: "bg-gradient-to-r from-primary to-blue-500 text-white hover:from-primary/90 hover:to-blue-600 shadow-lg",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
  }

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      size={size}
      className={cn(baseClasses, variantClasses[variant])}
    >
      {Icon && (
        <Icon
          className={cn(
            "mr-2",
            checked ? "text-primary-foreground" : ""
          )}
        />
      )}
      {checked && !Icon && (
        <Check className="mr-2 w-4 h-4" />
      )}
      {children}
    </Button>
  )
}

// Optimized for selection buttons
interface SelectionButtonProps {
  children: React.ReactNode
  selected: boolean
  onClick: () => void
  className?: string
}

export function SelectionButton({
  children,
  selected,
  onClick,
  className,
}: SelectionButtonProps) {
  return (
    <MobileOptimizedButton
      variant={selected ? "primary" : "outline"}
      checked={selected}
      onClick={onClick}
      className={cn(
        "h-auto py-3 px-4 min-h-[44px]", // Minimum touch target size (44px)
        className
      )}
    >
      {children}
    </MobileOptimizedButton>
  )
}

// Grid of selection buttons
interface SelectionGridProps {
  options: {
    id: string
    label: string
    icon?: string
  }[]
  selectedIds: string[]
  onToggle: (id: string) => void
  multiSelect?: boolean
  className?: string
}

export function SelectionGrid({
  options,
  selectedIds,
  onToggle,
  multiSelect = false,
  className,
}: SelectionGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 gap-3",
        className
      )}
    >
      {options.map((option) => {
        const isSelected = selectedIds.includes(option.id)
        return (
          <SelectionButton
            key={option.id}
            selected={isSelected}
            onClick={() => onToggle(option.id)}
            className={cn(
              "text-center",
              "flex flex-col items-center gap-1"
            )}
          >
            {option.icon && (
              <span className="text-2xl mb-1">{option.icon}</span>
            )}
            <span className="text-sm">{option.label}</span>
          </SelectionButton>
        )
      })}
    </div>
  )
}
