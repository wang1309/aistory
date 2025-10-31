"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardDescription, ModernCardContent } from "@/components/ui/modern-card"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { cn } from "@/lib/utils"
import { useLocale } from "next-intl"
import { PRESET_WORKS, getWorkById, getCharacterName, getCharacterById, getWorkName } from "@/lib/preset-works"
import { BookOpen, Heart, Sparkles } from "lucide-react"

interface SourceWorkSelectorProps {
  sourceType: 'preset' | 'custom'
  setSourceType: (type: 'preset' | 'custom') => void
  selectedPresetWork: string
  setSelectedPresetWork: (id: string) => void
  customWorkName: string
  setCustomWorkName: (name: string) => void
  onPresetWorkChange: (workId: string) => void
}

export function SourceWorkSelector({
  sourceType,
  setSourceType,
  selectedPresetWork,
  setSelectedPresetWork,
  customWorkName,
  setCustomWorkName,
  onPresetWorkChange,
}: SourceWorkSelectorProps) {
  const locale = useLocale()

  return (
    <div className="space-y-6">
      {/* Source Type Selection */}
      <ModernCard variant="default">
        <ModernCardHeader>
          <ModernCardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            选择原作来源
          </ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant={sourceType === 'preset' ? 'default' : 'outline'}
              className={cn(
                "h-auto p-6 flex flex-col items-center gap-3",
                sourceType === 'preset' && "bg-primary text-primary-foreground"
              )}
              onClick={() => setSourceType('preset')}
            >
              <Sparkles className="w-8 h-8" />
              <div className="text-center">
                <div className="font-semibold">预置作品</div>
                <div className="text-xs opacity-80 mt-1">从热门IP中选择</div>
              </div>
            </Button>
            <Button
              variant={sourceType === 'custom' ? 'default' : 'outline'}
              className={cn(
                "h-auto p-6 flex flex-col items-center gap-3",
                sourceType === 'custom' && "bg-primary text-primary-foreground"
              )}
              onClick={() => setSourceType('custom')}
            >
              <BookOpen className="w-8 h-8" />
              <div className="text-center">
                <div className="font-semibold">自定义</div>
                <div className="text-xs opacity-80 mt-1">输入任意作品</div>
              </div>
            </Button>
          </div>
        </ModernCardContent>
      </ModernCard>

      {/* Preset Works Grid */}
      {sourceType === 'preset' && (
        <ModernCard variant="elevated">
          <ModernCardHeader>
            <ModernCardTitle>选择你喜欢的作品</ModernCardTitle>
            <ModernCardDescription>
              从{PRESET_WORKS.length}个热门IP中选择，或者点击下方快速开始
            </ModernCardDescription>
          </ModernCardHeader>
          <ModernCardContent className="space-y-6">
            {/* Quick Start */}
            <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                热门推荐
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PRESET_WORKS.slice(0, 3).map((work) => (
                  <Button
                    key={work.id}
                    variant="outline"
                    className={cn(
                      "h-auto p-4 flex flex-col items-start gap-2",
                      selectedPresetWork === work.id
                        ? "border-primary bg-primary/10"
                        : "hover:border-primary/50"
                    )}
                    onClick={() => onPresetWorkChange(work.id)}
                  >
                    <div className="font-medium text-sm">
                      {getWorkName(work, locale)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {work.popularPairings.length} 个热门配对
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* All Works Grid */}
            <div>
              <h3 className="font-semibold mb-3">全部作品</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PRESET_WORKS.map((work) => (
                  <ModernCard
                    key={work.id}
                    variant="hover"
                    interactive
                    className={cn(
                      "p-4 cursor-pointer transition-all",
                      selectedPresetWork === work.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : ""
                    )}
                    onClick={() => onPresetWorkChange(work.id)}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">
                        {work.category === 'anime' ? '🎌' :
                         work.category === 'novel' ? '📚' :
                         work.category === 'movie' ? '🎬' : '🎮'}
                      </div>
                      <div className="font-medium text-sm">
                        {getWorkName(work, locale)}
                      </div>
                    </div>
                  </ModernCard>
                ))}
              </div>
            </div>
          </ModernCardContent>
        </ModernCard>
      )}

      {/* Custom Work Input */}
      {sourceType === 'custom' && (
        <ModernCard variant="elevated">
          <ModernCardHeader>
            <ModernCardTitle>输入自定义作品</ModernCardTitle>
            <ModernCardDescription>
              输入你想要创作同人小说的作品名称
            </ModernCardDescription>
          </ModernCardHeader>
          <ModernCardContent>
            <input
              type="text"
              placeholder="例如：你的名字、原神、咒术回战..."
              value={customWorkName}
              onChange={(e) => setCustomWorkName(e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </ModernCardContent>
        </ModernCard>
      )}
    </div>
  )
}
