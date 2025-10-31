import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ReactNode } from "react"

interface ModernCardProps extends React.ComponentProps<typeof Card> {
  children: ReactNode
  variant?: "default" | "hover" | "elevated" | "minimal"
  interactive?: boolean
}

export function ModernCard({
  children,
  className,
  variant = "default",
  interactive = false,
  ...props
}: ModernCardProps) {
  const variants = {
    default: "border-border/50 bg-card/50",
    hover: "border-border/50 bg-card/50 hover:shadow-soft transition-all duration-300",
    elevated: "border-border/50 bg-card shadow-medium",
    minimal: "border-none bg-transparent shadow-none",
  }

  const interactiveClass = interactive
    ? "cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
    : ""

  return (
    <Card
      className={cn(
        variants[variant],
        interactiveClass,
        className
      )}
      {...props}
    >
      {children}
    </Card>
  )
}

export function ModernCardHeader({
  children,
  className,
  ...props
}: React.ComponentProps<typeof CardHeader>) {
  return (
    <CardHeader className={cn("pb-4", className)} {...props}>
      {children}
    </CardHeader>
  )
}

export function ModernCardTitle({
  children,
  className,
  ...props
}: React.ComponentProps<typeof CardTitle>) {
  return (
    <CardTitle
      className={cn(
        "text-xl font-semibold tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </CardTitle>
  )
}

export function ModernCardDescription({
  children,
  className,
  ...props
}: React.ComponentProps<typeof CardDescription>) {
  return (
    <CardDescription
      className={cn("text-muted-foreground", className)}
      {...props}
    >
      {children}
    </CardDescription>
  )
}

export function ModernCardContent({
  children,
  className,
  ...props
}: React.ComponentProps<typeof CardContent>) {
  return (
    <CardContent className={cn("pt-0", className)} {...props}>
      {children}
    </CardContent>
  )
}

export function ModernCardFooter({
  children,
  className,
  ...props
}: React.ComponentProps<typeof CardFooter>) {
  return (
    <CardFooter className={cn("pt-4", className)} {...props}>
      {children}
    </CardFooter>
  )
}
