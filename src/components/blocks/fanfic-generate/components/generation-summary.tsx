"use client"

import { ModernCard, ModernCardContent } from "@/components/ui/modern-card"
import { Zap } from "lucide-react"
import { useLocale } from "next-intl"
import { getWorkById, getCharacterName } from "@/lib/preset-works"

interface GenerationSummaryProps {
  sourceType: 'preset' | 'custom'
  selectedPresetWork: string
  customWorkName: string
  pairingType: 'romantic' | 'gen' | 'poly'
  selectedCharacters: string[]
  plotType: string
  advancedOptions: {
    length: string
    ooc: string
  }
}

export function GenerationSummary({
  sourceType,
  selectedPresetWork,
  customWorkName,
  pairingType,
  selectedCharacters,
  plotType,
  advancedOptions,
}: GenerationSummaryProps) {
  const locale = useLocale()

  const getSourceName = () => {
    if (sourceType === 'preset') {
      const work = getWorkById(selectedPresetWork)
      return work ? work.name : ''
    }
    return customWorkName
  }

  const getPairingName = () => {
    if (selectedCharacters.length === 0) return ''
    return selectedCharacters.map(id => {
      const work = getWorkById(selectedPresetWork)
      const char = work?.characters.find(c => c.id === id)
      return char ? getCharacterName(char, locale) : id
    }).join(' × ')
  }

  const getPlotTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'canon': '原著向',
      'modern_au': '现代AU',
      'school_au': '校园AU',
      'fantasy_au': '奇幻AU',
      'crossover': '跨界',
    }
    return labels[type] || type
  }

  const getLengthLabel = (length: string) => {
    const labels: Record<string, string> = {
      'short': '短篇',
      'medium': '中篇',
      'long': '长篇',
    }
    return labels[length] || length
  }

  return (
    <ModernCard variant="elevated">
      <div className="p-6 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          创作概要
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">原作：</span>
            <span className="font-medium ml-2">
              {getSourceName()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">配对：</span>
            <span className="font-medium ml-2">
              {getPairingName()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">类型：</span>
            <span className="font-medium ml-2">
              {getPlotTypeLabel(plotType)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">长度：</span>
            <span className="font-medium ml-2">
              {getLengthLabel(advancedOptions.length)}
            </span>
          </div>
        </div>
      </div>
    </ModernCard>
  )
}
