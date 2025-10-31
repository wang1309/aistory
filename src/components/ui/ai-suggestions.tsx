"use client"

import { useState } from "react"
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from "@/components/ui/modern-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { Lightbulb, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface Suggestion {
  id: string
  title: string
  description: string
  prompt: string
  category: string
  confidence: number // 0-100
}

interface AISuggestionsProps {
  onSelect: (suggestion: Suggestion) => void
  currentSelection?: {
    work?: string
    pairing?: string
    plotType?: string
  }
  className?: string
}

const SUGGESTIONS: Suggestion[] = [
  {
    id: "1",
    title: "甜蜜校园时光",
    description: "在美丽的校园里，两人相遇、相知、相爱的青春故事",
    prompt: "在樱花飞舞的校园里，两个主角初次相遇，他们从陌生到熟悉，经历了许多美好的时光...",
    category: "校园AU",
    confidence: 95,
  },
  {
    id: "2",
    title: "魔法世界的重逢",
    description: "在魔法学院中，多年未见的老朋友重新相遇",
    prompt: "在霍格沃茨的走廊里，一个熟悉的身影突然出现，让他们想起多年前的美好回忆...",
    category: "原著向",
    confidence: 92,
  },
  {
    id: "3",
    title: "现代都市奇遇",
    description: "在繁忙的都市中，两个陌生人因为偶然事件产生交集",
    prompt: "在城市的咖啡店里，主角不小心撞到了另一个人，咖啡洒了一地，这成了他们缘分的开始...",
    category: "现代AU",
    confidence: 88,
  },
  {
    id: "4",
    title: "并肩作战的友谊",
    description: "面对强大的敌人，主角们团结一致，共同战斗",
    prompt: "黑暗势力再次崛起，主角们不得不放下个人恩怨，联手对抗共同的敌人...",
    category: "冒险",
    confidence: 90,
  },
  {
    id: "5",
    title: "久别重逢的温暖",
    description: "分离多年的朋友在意外中重逢，重燃友谊之火",
    prompt: "多年后的同学聚会上，他们再次相遇，回想起学生时代的美好时光...",
    category: "现代AU",
    confidence: 87,
  },
  {
    id: "6",
    title: "跨越次元的相遇",
    description: "来自不同世界的角色意外相遇，发生有趣的故事",
    prompt: "一道神秘的光芒闪过，两个来自完全不同世界的角色突然出现在同一个地方...",
    category: "奇幻AU",
    confidence: 85,
  },
]

export function AISuggestions({
  onSelect,
  currentSelection,
  className,
}: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(SUGGESTIONS)

  const shuffleSuggestions = () => {
    const shuffled = [...SUGGESTIONS].sort(() => Math.random() - 0.5)
    setSuggestions(shuffled)
  }

  return (
    <ModernCard variant="hover" className={cn("", className)}>
      <ModernCardHeader>
        <div className="flex items-center justify-between">
          <ModernCardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            AI创意建议
          </ModernCardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={shuffleSuggestions}
            className="h-8"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          基于你的选择，AI为你推荐以下创作灵感
        </div>
      </ModernCardHeader>
      <ModernCardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((suggestion, index) => (
            <AnimatedContainer
              key={suggestion.id}
              variant="slideUp"
              delay={index * 0.1}
            >
              <Button
                variant="outline"
                className={cn(
                  "h-auto w-full p-4 text-left justify-start",
                  "hover:border-primary hover:bg-primary/5 transition-all",
                  "group"
                )}
                onClick={() => onSelect(suggestion)}
              >
                <div className="w-full">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-blue-500 transition-all"
                          style={{ width: `${suggestion.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground ml-1">
                        {suggestion.confidence}%
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                    {suggestion.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {suggestion.description}
                  </p>
                </div>
              </Button>
            </AnimatedContainer>
          ))}
        </div>
      </ModernCardContent>
    </ModernCard>
  )
}
