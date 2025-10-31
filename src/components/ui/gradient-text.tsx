import { cn } from "@/lib/utils"

interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "accent" | "hero"
}

export function GradientText({
  children,
  className,
  variant = "primary",
  ...props
}: GradientTextProps) {
  const variants = {
    primary: "bg-gradient-to-r from-primary via-pink-500 to-blue-500 bg-clip-text text-transparent",
    secondary: "bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent",
    accent: "bg-gradient-to-r from-purple-500 to-violet-500 bg-clip-text text-transparent",
    hero: "bg-gradient-to-r from-primary via-pink-600 to-blue-600 bg-clip-text text-transparent",
  }

  return (
    <span
      className={cn(variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  )
}
