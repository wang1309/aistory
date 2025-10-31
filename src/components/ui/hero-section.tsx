import { cn } from "@/lib/utils"
import { ReactNode } from "react"
import { GradientText } from "@/components/ui/gradient-text"
import { AnimatedContainer } from "@/components/ui/animated-container"

interface HeroSectionProps {
  title: string | ReactNode
  subtitle?: string
  description?: string
  children?: ReactNode
  className?: string
  background?: "gradient" | "dots" | "grid" | "minimal"
  align?: "center" | "left" | "right"
}

export function HeroSection({
  title,
  subtitle,
  description,
  children,
  className,
  background = "gradient",
  align = "center",
}: HeroSectionProps) {
  const backgrounds = {
    gradient: "bg-gradient-to-b from-background via-background/95 to-background",
    dots: "bg-[var(--bg-dots)] bg-[length:20px_20px]",
    grid: "bg-[var(--bg-grid)] bg-[length:20px_20px]",
    minimal: "bg-background",
  }

  const alignments = {
    center: "text-center items-center",
    left: "text-left items-start",
    right: "text-right items-end",
  }

  return (
    <section
      className={cn(
        "relative py-16 md:py-24 overflow-hidden",
        backgrounds[background],
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className={cn("flex flex-col gap-6", alignments[align])}>
          <AnimatedContainer variant="slideDown">
            {subtitle && (
              <p className="text-sm md:text-base font-medium text-primary tracking-wide uppercase">
                {subtitle}
              </p>
            )}
          </AnimatedContainer>

          <AnimatedContainer variant="slideUp" delay={0.1}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              {typeof title === "string" ? (
                <GradientText variant="hero">{title}</GradientText>
              ) : (
                title
              )}
            </h1>
          </AnimatedContainer>

          {description && (
            <AnimatedContainer variant="slideUp" delay={0.2}>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                {description}
              </p>
            </AnimatedContainer>
          )}

          {children && (
            <AnimatedContainer variant="scale" delay={0.3}>
              <div className="flex flex-wrap gap-4 mt-4">
                {children}
              </div>
            </AnimatedContainer>
          )}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
    </section>
  )
}
