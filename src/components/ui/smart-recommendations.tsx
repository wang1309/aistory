"use client"

import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle, ModernCardDescription } from "@/components/ui/modern-card"
import { Button } from "@/components/ui/button"
import { EnhancedBadge } from "@/components/ui/enhanced-badge"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { Heart, Star, TrendingUp, Sparkles, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface Recommendation {
  id: string
  title: string
  description: string
  icon: string
  type: "work" | "pairing" | "style"
  confidence: number // 0-100
  category: string
}

interface SmartRecommendationsProps {
  recommendations: Recommendation[]
  onSelect: (recommendation: Recommendation) => void
  title?: string
  description?: string
}

export function SmartRecommendations({
  recommendations,
  onSelect,
  title = "智能推荐",
  description = "基于你的选择，我们为你推荐以下内容",
}: SmartRecommendationsProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "work":
        return <BookOpen className="w-4 h-4" />
      case "pairing":
        return <Heart className="w-4 h-4" />
      case "style":
        return <Sparkles className="w-4 h-4" />
      default:
        return null
    }
  }

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "work":
        return "default"
      case "pairing":
        return "success"
      case "style":
        return "info"
      default:
        return "secondary"
    }
  }

  if (recommendations.length === 0) return null

  return (
    <ModernCard variant="hover" className="card-hover-lift">
      <ModernCardHeader>
        <ModernCardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          {title}
        </ModernCardTitle>
        <ModernCardDescription>{description}</ModernCardDescription>
      </ModernCardHeader>
      <ModernCardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recommendations.map((rec, index) => (
            <AnimatedContainer
              key={rec.id}
              variant="slideUp"
              delay={index * 0.1}
            >
              <Button
                variant="outline"
                className={cn(
                  "h-auto w-full p-4 flex flex-col items-start gap-2 text-left",
                  "hover:border-primary hover:bg-primary/5 transition-all duration-200",
                  "group"
                )}
                onClick={() => onSelect(rec)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{rec.icon}</span>
                    <EnhancedBadge
                      variant={getTypeBadgeVariant(rec.type)}
                      size="sm"
                      icon={getTypeIcon(rec.type)}
                    >
                      {rec.type === "work" ? "作品" : rec.type === "pairing" ? "配对" : "风格"}
                    </EnhancedBadge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {(rec.confidence / 10).toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="w-full">
                  <div className="font-medium text-sm group-hover:text-primary transition-colors">
                    {rec.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {rec.description}
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-1 mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${rec.confidence}%` }}
                  />
                </div>
              </Button>
            </AnimatedContainer>
          ))}
        </div>
      </ModernCardContent>
    </ModernCard>
  )
}

// Popular recommendations pre-defined
export const POPULAR_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "hp-hermione",
    title: "哈利波特 × 赫敏",
    description: "最受欢迎的CP之一，智慧与勇气的结合",
    icon: "⚡",
    type: "pairing",
    confidence: 98,
    category: "魔法世界",
  },
  {
    id: "haikyuu-kageyama",
    title: "排球少年 × 影山飞雄",
    description: "天才二传手的天赋与成长",
    icon: "🏐",
    type: "pairing",
    confidence: 95,
    category: "体育",
  },
  {
    id: "demon-slayer-tanjiro",
    title: "鬼灭之刃 × 炭治郎",
    description: "温暖善良的主角，人气最高",
    icon: "⚔️",
    type: "work",
    confidence: 97,
    category: "冒险",
  },
  {
    id: "modern-au",
    title: "现代AU设定",
    description: "将角色置于现代都市背景",
    icon: "🏙️",
    type: "style",
    confidence: 92,
    category: "设定",
  },
]
