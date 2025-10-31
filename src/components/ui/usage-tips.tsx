"use client"

import { useState, useEffect } from "react"
import { ModernCard, ModernCardContent } from "@/components/ui/modern-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Lightbulb, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Tip {
  id: string
  title: string
  content: string
  category: string
}

interface UsageTipsProps {
  isVisible: boolean
  onClose: () => void
  className?: string
}

const TIPS_DATA: Tip[] = [
  {
    id: "1",
    title: "选择合适的提示词",
    content: "详细描述你想要的情节、场景或角色互动，能帮助AI创作出更符合你期望的故事。避免过于简单的描述，多用形容词和动词。",
    category: "创作技巧",
  },
  {
    id: "2",
    title: "合理选择剧情类型",
    content: "原著向适合想看原作风格的续写，现代AU适合喜欢都市背景的读者，校园AU则更适合青春校园题材的爱好者。",
    category: "剧情类型",
  },
  {
    id: "3",
    title: "配对类型选择",
    content: "浪漫向适合CP粉丝，创作2人甜蜜互动；单人中心向适合特定角色的粉丝；多人配对可以创作群像戏。",
    category: "角色配对",
  },
  {
    id: "4",
    title: "长度设置建议",
    content: "短篇适合快速阅读和简单情节，中篇可以展现更多人物互动，长篇适合复杂剧情和深度描写。",
    category: "长度控制",
  },
  {
    id: "5",
    title: "OOC程度控制",
    content: "符合原著能保持角色原有性格，轻微OOC可以在不改变核心性格的前提下增加创意，大胆改编则允许更大自由度。",
    category: "角色设定",
  },
  {
    id: "6",
    title: "保存和分享",
    content: "创作完成后记得保存到历史记录，可以通过分享功能将精彩内容分享给朋友，一起欣赏你的创作！",
    category: "功能使用",
  },
]

export function UsageTips({ isVisible, onClose, className }: UsageTipsProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0)

  useEffect(() => {
    if (isVisible) {
      // Random tip on open
      const randomIndex = Math.floor(Math.random() * TIPS_DATA.length)
      setCurrentTipIndex(randomIndex)
    }
  }, [isVisible])

  if (!isVisible) return null

  const currentTip = TIPS_DATA[currentTipIndex]

  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % TIPS_DATA.length)
  }

  const prevTip = () => {
    setCurrentTipIndex((prev) => (prev - 1 + TIPS_DATA.length) % TIPS_DATA.length)
  }

  return (
    <div
      className={cn(
        "fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40",
        "max-w-sm w-[calc(100%-2rem)]",
        className
      )}
    >
      <ModernCard variant="elevated" className="overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold">使用小贴士</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <ModernCardContent className="p-0">
          <div className="p-4">
            <Badge variant="secondary" className="mb-3">
              {currentTip.category}
            </Badge>
            <h3 className="font-semibold mb-2">{currentTip.title}</h3>
            <p className="text-sm text-muted-foreground">{currentTip.content}</p>
          </div>

          <div className="flex items-center justify-between p-4 border-t bg-muted/30">
            <Button variant="ghost" size="sm" onClick={prevTip} className="h-8">
              <ChevronLeft className="w-4 h-4 mr-1" />
              上一个
            </Button>
            <div className="flex gap-1">
              {TIPS_DATA.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentTipIndex
                      ? "bg-primary w-4"
                      : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={nextTip} className="h-8">
              下一个
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </ModernCardContent>
      </ModernCard>
    </div>
  )
}
