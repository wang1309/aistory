"use client"

import { cn } from "@/lib/utils"
import { ModernCard, ModernCardContent } from "@/components/ui/modern-card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import { AnimatedContainer } from "@/components/ui/animated-container"

interface QuickStartOption {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
  recommended?: boolean
}

interface QuickStartCardProps {
  title: string
  description: string
  options: QuickStartOption[]
  onQuickStart?: () => void
  className?: string
}

export function QuickStartCard({
  title,
  description,
  options,
  onQuickStart,
  className,
}: QuickStartCardProps) {
  return (
    <ModernCard variant="hover" className={cn("max-w-4xl mx-auto", className)}>
      <ModernCardContent className="p-6 md:p-8">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {options.map((option, index) => (
            <AnimatedContainer
              key={option.id}
              variant="scale"
              delay={index * 0.1}
            >
              <Button
                variant="outline"
                className={cn(
                  "h-auto p-4 flex flex-col items-start gap-2 text-left",
                  "hover:border-primary hover:bg-primary/5",
                  "transition-all duration-200"
                )}
                onClick={option.onClick}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="text-2xl">{option.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{option.title}</span>
                      {option.recommended && (
                        <span className="text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-0.5 rounded-full">
                          推荐
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </div>
              </Button>
            </AnimatedContainer>
          ))}
        </div>

        {onQuickStart && (
          <div className="flex justify-center">
            <Button
              onClick={onQuickStart}
              size="lg"
              className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600 text-white px-8 py-6 h-auto"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              <span className="font-medium">一键开始创作</span>
            </Button>
          </div>
        )}
      </ModernCardContent>
    </ModernCard>
  )
}
