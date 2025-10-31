"use client"

import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from "@/components/ui/modern-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { TrendingUp, Crown, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrendingItem {
  id: string
  title: string
  subtitle?: string
  icon: string
  trend: "up" | "hot" | "new"
  rank?: number
  type: "work" | "pairing" | "style"
  onClick: () => void
}

interface TrendingNowProps {
  title?: string
  items: TrendingItem[]
  className?: string
}

export function TrendingNow({
  title = "🔥 热门趋势",
  items,
  className,
}: TrendingNowProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case "hot":
        return <Flame className="w-4 h-4 text-red-500" />
      case "new":
        return <Crown className="w-4 h-4 text-purple-500" />
      default:
        return null
    }
  }

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case "up":
        return "上升"
      case "hot":
        return "火热"
      case "new":
        return "新晋"
      default:
        return ""
    }
  }

  const sortedItems = [...items].sort((a, b) => {
    // Sort by rank if available, otherwise by trend
    if (a.rank && b.rank) return a.rank - b.rank
    return 0
  })

  return (
    <ModernCard variant="hover" className={cn("", className)}>
      <ModernCardHeader>
        <ModernCardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          {title}
        </ModernCardTitle>
      </ModernCardHeader>
      <ModernCardContent>
        <div className="space-y-2">
          {sortedItems.map((item, index) => (
            <AnimatedContainer
              key={item.id}
              variant="slideRight"
              delay={index * 0.05}
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-auto p-3",
                  "hover:bg-primary/5 transition-colors",
                  "group"
                )}
                onClick={item.onClick}
              >
                <div className="flex items-center gap-3 w-full">
                  {/* Rank */}
                  {item.rank && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                      {item.rank}
                    </div>
                  )}

                  {/* Icon */}
                  <span className="text-xl">{item.icon}</span>

                  {/* Content */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm group-hover:text-primary transition-colors">
                        {item.title}
                      </span>
                      <Badge variant="secondary" className="text-[10px] h-4">
                        {item.type === "work" ? "作品" :
                         item.type === "pairing" ? "配对" : "风格"}
                      </Badge>
                    </div>
                    {item.subtitle && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Trend Indicator */}
                  <div className="flex items-center gap-1">
                    {getTrendIcon(item.trend)}
                    <span className="text-xs text-muted-foreground">
                      {getTrendLabel(item.trend)}
                    </span>
                  </div>
                </div>
              </Button>
            </AnimatedContainer>
          ))}
        </div>
      </ModernCardContent>
    </ModernCard>
  )
}

// Pre-defined trending items for fanfic
export const FANFIC_TRENDING_ITEMS: TrendingItem[] = [
  {
    id: "hp-new",
    title: "哈利波特：时间旅行",
    subtitle: "最近新增的热门设定",
    icon: "⚡",
    trend: "new",
    rank: 1,
    type: "work",
    onClick: () => {
      // Handle selection
    },
  },
  {
    id: "jjk-hot",
    title: "咒术回战 × 五夏",
    subtitle: "近期最热门的CP配对",
    icon: "🪄",
    trend: "hot",
    rank: 2,
    type: "pairing",
    onClick: () => {
      // Handle selection
    },
  },
  {
    id: "ds-up",
    title: "现代AU设定",
    subtitle: "热度持续上升",
    icon: "🏙️",
    trend: "up",
    rank: 3,
    type: "style",
    onClick: () => {
      // Handle selection
    },
  },
  {
    id: "haikyuu-up",
    title: "排球少年",
    subtitle: "人气持续攀升",
    icon: "🏐",
    trend: "up",
    type: "work",
    onClick: () => {
      // Handle selection
    },
  },
  {
    id: "demon-slayer-hot",
    title: "鬼灭之刃 × 煉獄杏寿郎",
    subtitle: "本周最受欢迎",
    icon: "🔥",
    trend: "hot",
    type: "pairing",
    onClick: () => {
      // Handle selection
    },
  },
]
