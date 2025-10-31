"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { Sparkles, Zap, BookOpen, Heart, Shuffle } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  description?: string
}

interface QuickActionsProps {
  actions: QuickAction[]
  onRandomSelect?: () => void
  className?: string
}

export function QuickActions({
  actions,
  onRandomSelect,
  className,
}: QuickActionsProps) {
  const [open, setOpen] = useState(false)

  const handleActionClick = (action: QuickAction) => {
    action.onClick()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 hover:bg-primary/10 hover:text-primary transition-colors",
            className
          )}
        >
          <Sparkles className="w-4 h-4" />
          快速操作
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 p-3"
        sideOffset={5}
      >
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground px-2">
            快捷功能
          </div>
          {actions.map((action, index) => (
            <AnimatedContainer
              key={action.id}
              variant="slideLeft"
              delay={index * 0.05}
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-auto p-3",
                  "hover:bg-primary/10 hover:text-primary",
                  "transition-colors"
                )}
                onClick={() => handleActionClick(action)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{action.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{action.label}</div>
                    {action.description && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {action.description}
                      </div>
                    )}
                  </div>
                </div>
              </Button>
            </AnimatedContainer>
          ))}
          {onRandomSelect && (
            <>
              <div className="border-t my-2" />
              <AnimatedContainer variant="slideLeft" delay={actions.length * 0.05}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-auto p-3",
                    "hover:bg-gradient-to-r hover:from-pink-500/10 hover:to-purple-500/10",
                    "transition-all"
                  )}
                  onClick={() => {
                    onRandomSelect()
                    setOpen(false)
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Shuffle className="w-4 h-4 text-primary mt-0.5" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">随机搭配</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        让AI为你随机选择
                      </div>
                    </div>
                  </div>
                </Button>
              </AnimatedContainer>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Pre-defined quick actions
export const FANFIC_QUICK_ACTIONS: QuickAction[] = [
  {
    id: "popular-work",
    label: "选择热门作品",
    icon: <BookOpen className="w-4 h-4 text-blue-500" />,
    onClick: () => {
      // Scroll to works section or open modal
      document.getElementById("works-section")?.scrollIntoView({ behavior: "smooth" })
    },
    description: "查看最受欢迎的作品列表",
  },
  {
    id: "quick-pairing",
    label: "热门配对",
    icon: <Heart className="w-4 h-4 text-pink-500" />,
    onClick: () => {
      // Open popular pairings modal
    },
    description: "一键选择热门CP配对",
  },
  {
    id: "ai-suggest",
    label: "AI智能建议",
    icon: <Zap className="w-4 h-4 text-yellow-500" />,
    onClick: () => {
      // Trigger AI suggestion
    },
    description: "基于你的偏好生成建议",
  },
  {
    id: "quick-prompt",
    label: "提示词模板",
    icon: <Sparkles className="w-4 h-4 text-purple-500" />,
    onClick: () => {
      // Open prompt templates
    },
    description: "使用精心设计的提示模板",
  },
]
