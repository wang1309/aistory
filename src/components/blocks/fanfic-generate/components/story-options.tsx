"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardDescription, ModernCardContent } from "@/components/ui/modern-card"
import { EnhancedBadge } from "@/components/ui/enhanced-badge"
import { ChevronDown, Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface StoryOptionsProps {
  plotType: string
  setPlotType: (type: string) => void
  prompt: string
  setPrompt: (prompt: string) => void
  advancedOptions: {
    ooc: string
    fidelity: string
    ending: string
    rating: string
    length: string
    perspective: string
  }
  setAdvancedOptions: (options: any) => void
}

export function StoryOptions({
  plotType,
  setPlotType,
  prompt,
  setPrompt,
  advancedOptions,
  setAdvancedOptions,
}: StoryOptionsProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const PLOT_TYPES = [
    { value: 'canon', label: '原著向', desc: '遵循原作设定' },
    { value: 'modern_au', label: '现代AU', desc: '现代都市背景' },
    { value: 'school_au', label: '校园AU', desc: '校园环境设定' },
    { value: 'fantasy_au', label: '奇幻AU', desc: '架空魔法世界' },
    { value: 'crossover', label: '跨界', desc: '多作品混合' },
  ]

  return (
    <ModernCard variant="elevated">
      <ModernCardHeader>
        <ModernCardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary" />
          配置故事参数
        </ModernCardTitle>
        <ModernCardDescription>
          自定义你的故事类型、长度、风格等细节
        </ModernCardDescription>
      </ModernCardHeader>
      <ModernCardContent className="space-y-6">
        {/* Plot Type */}
        <div>
          <Label className="text-base font-medium mb-3 block">剧情类型</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PLOT_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={plotType === type.value ? "default" : "outline"}
                className={cn(
                  "h-auto py-4 px-4 text-left justify-start",
                  plotType === type.value && "bg-primary text-primary-foreground"
                )}
                onClick={() => setPlotType(type.value)}
              >
                <div>
                  <div className="font-medium">{type.label}</div>
                  <div className="text-xs opacity-80 mt-1">{type.desc}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div>
          <Label className="text-base font-medium mb-3 block">
            故事提示 <span className="text-xs text-muted-foreground font-normal">（至少10个字）</span>
          </Label>
          <Textarea
            placeholder="描述你想要的故事内容、情节或场景..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px] resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <span className={cn(
              "text-xs",
              prompt.trim().length < 10 ? "text-orange-500" : "text-muted-foreground"
            )}>
              {prompt.trim().length} / 2000 字符
            </span>
            {prompt.trim().length >= 10 && (
              <EnhancedBadge variant="success" size="sm">
                ✓ 符合要求
              </EnhancedBadge>
            )}
          </div>
        </div>

        {/* Advanced Options */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="font-medium">高级选项</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">OOC程度</Label>
                <RadioGroup
                  value={advancedOptions.ooc}
                  onValueChange={(value) => setAdvancedOptions({...advancedOptions, ooc: value})}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="slight" id="ooc-slight" />
                    <Label htmlFor="ooc-slight" className="text-sm">符合原著</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderate" id="ooc-moderate" />
                    <Label htmlFor="ooc-moderate" className="text-sm">轻微OOC</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bold" id="ooc-bold" />
                    <Label htmlFor="ooc-bold" className="text-sm">大胆改编</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">故事长度</Label>
                <RadioGroup
                  value={advancedOptions.length}
                  onValueChange={(value) => setAdvancedOptions({...advancedOptions, length: value})}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="short" id="length-short" />
                    <Label htmlFor="length-short" className="text-sm">短篇 (300-600字)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="length-medium" />
                    <Label htmlFor="length-medium" className="text-sm">中篇 (600-1500字)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="long" id="length-long" />
                    <Label htmlFor="length-long" className="text-sm">长篇 (1500-3000字)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">情节走向</Label>
                <RadioGroup
                  value={advancedOptions.ending}
                  onValueChange={(value) => setAdvancedOptions({...advancedOptions, ending: value})}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="happy" id="ending-happy" />
                    <Label htmlFor="ending-happy" className="text-sm">Happy Ending</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sad" id="ending-sad" />
                    <Label htmlFor="ending-sad" className="text-sm">Sad Ending</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="open" id="ending-open" />
                    <Label htmlFor="ending-open" className="text-sm">Open Ending</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">叙事视角</Label>
                <RadioGroup
                  value={advancedOptions.perspective}
                  onValueChange={(value) => setAdvancedOptions({...advancedOptions, perspective: value})}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="first" id="persp-first" />
                    <Label htmlFor="persp-first" className="text-sm">第一人称</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="third" id="persp-third" />
                    <Label htmlFor="persp-third" className="text-sm">第三人称</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="second" id="persp-second" />
                    <Label htmlFor="persp-second" className="text-sm">第二人称</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </ModernCardContent>
    </ModernCard>
  )
}
