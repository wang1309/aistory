"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ModernCard, ModernCardContent } from "@/components/ui/modern-card"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { X, ChevronRight, Lightbulb, Sparkles, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface OnboardingGuideProps {
  isOpen: boolean
  onClose: () => void
  onQuickStart: () => void
}

const TIPS = [
  {
    icon: <Sparkles className="w-6 h-6 text-primary" />,
    title: "选择热门IP",
    description: "从10+热门动漫、电影、游戏作品中选择你最喜欢的",
  },
  {
    icon: <Lightbulb className="w-6 h-6 text-yellow-500" />,
    title: "描述你的想法",
    description: "简单描述你想要的故事内容，AI会为你创作精彩情节",
  },
  {
    icon: <BookOpen className="w-6 h-6 text-blue-500" />,
    title: "一键生成",
    description: "只需几秒钟，AI就能为你创作一篇完整的同人小说",
  },
]

export function OnboardingGuide({
  isOpen,
  onClose,
  onQuickStart,
}: OnboardingGuideProps) {
  const [currentTip, setCurrentTip] = useState(0)

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % TIPS.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <AnimatedContainer variant="scale" className="relative w-full max-w-md">
        <ModernCard variant="elevated" className="relative overflow-hidden">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>

          <ModernCardContent className="p-8 text-center">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center animate-bounce-in">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold mb-2 animate-fade-in-up">
              欢迎使用AI同人小说生成器！
            </h2>
            <p className="text-muted-foreground mb-6 animate-fade-in-up stagger-1">
              只需3步，就能创作出属于你的同人故事
            </p>

            {/* Tips */}
            <div className="space-y-4 mb-8">
              {TIPS.map((tip, index) => {
                const isActive = index === currentTip
                return (
                  <AnimatedContainer
                    key={index}
                    variant={isActive ? "slideRight" : "fadeIn"}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-lg transition-all",
                      isActive
                        ? "bg-primary/5 border border-primary/20"
                        : "bg-muted/50"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        isActive ? "bg-primary/10" : "bg-muted"
                      )}
                    >
                      {tip.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <h3
                        className={cn(
                          "font-semibold mb-1 transition-colors",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {tip.title}
                      </h3>
                      <p
                        className={cn(
                          "text-sm transition-colors",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {tip.description}
                      </p>
                    </div>
                  </AnimatedContainer>
                )
              })}
            </div>

            {/* Dots Indicator */}
            <div className="flex gap-2 justify-center mb-6">
              {TIPS.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    index === currentTip
                      ? "w-8 bg-primary"
                      : "bg-muted-foreground/20"
                  )}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => {
                  onQuickStart()
                  onClose()
                }}
                size="lg"
                className={cn(
                  "w-full h-12 text-base font-medium",
                  "bg-gradient-to-r from-primary via-pink-600 to-blue-600",
                  "hover:from-primary/90 hover:via-pink-600/90 hover:to-blue-600/90",
                  "shadow-strong hover:shadow-elevated",
                  "animate-pulse-glow"
                )}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                立即开始创作
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full"
              >
                稍后再说
              </Button>
            </div>
          </ModernCardContent>
        </ModernCard>
      </AnimatedContainer>
    </div>
  )
}
