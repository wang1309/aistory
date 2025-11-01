"use client"

import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from "@/components/ui/modern-card"
import { Button } from "@/components/ui/button"
import { EnhancedBadge } from "@/components/ui/enhanced-badge"
import { ProgressBar } from "@/components/ui/progress-bar"
import { AnimatedContainer } from "@/components/ui/animated-container"
import Icon from "@/components/icon"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"

interface OutputDisplayProps {
  generatedFanfic: string
  wordCount: number
  generatedTags: string[]
  isGenerating: boolean
  onCopy: () => void
  onRegenerate: () => void
}

export function OutputDisplay({
  generatedFanfic,
  wordCount,
  generatedTags,
  isGenerating,
  onCopy,
  onRegenerate,
}: OutputDisplayProps) {
  return (
    <ModernCard variant="elevated">
      <ModernCardHeader>
        <ModernCardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          {isGenerating ? "正在创作中..." : "创作完成"}
        </ModernCardTitle>
      </ModernCardHeader>
      <ModernCardContent className="space-y-4">

        {generatedFanfic && (
          <AnimatedContainer variant="fadeIn">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                {wordCount} 字
              </div>
            </div>

            {/* Tags */}
            {generatedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {generatedTags.map((tag, index) => (
                  <EnhancedBadge key={index} variant="secondary" size="sm">
                    {tag}
                  </EnhancedBadge>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="prose prose-sm max-w-none dark:prose-invert p-4 rounded-lg bg-muted/30 whitespace-pre-wrap">
              {generatedFanfic}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCopy}
              >
                <Icon name="mdi:content-copy" className="w-4 h-4 mr-1" />
                复制
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                disabled={isGenerating}
              >
                <Icon name="mdi:refresh" className="w-4 h-4 mr-1" />
                重新生成
              </Button>
            </div>
          </AnimatedContainer>
        )}
      </ModernCardContent>
    </ModernCard>
  )
}
