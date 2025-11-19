"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardDescription, ModernCardContent } from "@/components/ui/modern-card"
import { cn } from "@/lib/utils"
import { useLocale, useTranslations } from "next-intl"
import { getWorkById, getCharacterName, getCharacterById } from "@/lib/preset-works"
import { Heart } from "lucide-react"
import { toast } from "sonner"

interface CharacterPairingSelectorProps {
  selectedPresetWork: string
  sourceType: 'preset' | 'custom'
  pairingType: 'romantic' | 'gen' | 'poly'
  setPairingType: (type: 'romantic' | 'gen' | 'poly') => void
  selectedCharacters: string[]
  setSelectedCharacters: (characters: string[]) => void
}

export function CharacterPairingSelector({
  selectedPresetWork,
  sourceType,
  pairingType,
  setPairingType,
  selectedCharacters,
  setSelectedCharacters,
}: CharacterPairingSelectorProps) {
  const locale = useLocale()
  const t = useTranslations()

  const handleAddCharacter = useCallback((characterId: string) => {
    if (!selectedCharacters.includes(characterId)) {
      if (pairingType === 'gen' && selectedCharacters.length >= 1) {
        toast.error(t('hero_fanfic.pairing.error_gen_limit') || "Gen-focused can only select 1 character")
        return
      }
      if (pairingType === 'romantic' && selectedCharacters.length >= 2) {
        toast.error(t('hero_fanfic.pairing.error_romantic_limit') || "Romantic can only select 2 characters")
        return
      }
      if (pairingType === 'poly' && selectedCharacters.length >= 5) {
        toast.error(t('hero_fanfic.pairing.error_poly_limit') || "Poly can only select 5 characters")
        return
      }
      setSelectedCharacters([...selectedCharacters, characterId])
    }
  }, [selectedCharacters, pairingType, setSelectedCharacters])

  const handleRemoveCharacter = useCallback((characterId: string) => {
    setSelectedCharacters(selectedCharacters.filter(id => id !== characterId))
  }, [selectedCharacters, setSelectedCharacters])

  // Don't render if not preset or no work selected
  if (sourceType !== 'preset' || !selectedPresetWork) {
    return null
  }

  const work = getWorkById(selectedPresetWork)
  if (!work) return null

  return (
    <ModernCard variant="elevated">
      <ModernCardHeader>
        <ModernCardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          选择角色配对
        </ModernCardTitle>
        <ModernCardDescription>
          选择配对类型，然后从角色列表中选择你喜欢的角色
        </ModernCardDescription>
      </ModernCardHeader>
      <ModernCardContent className="space-y-6">
        {/* Pairing Type Selection */}
        <div>
          <Label className="text-base font-medium mb-3 block">配对类型</Label>
          <RadioGroup
            value={pairingType}
            onValueChange={(value: 'romantic' | 'gen' | 'poly') => {
              setPairingType(value)
              setSelectedCharacters([])
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="romantic" id="romantic" />
              <Label htmlFor="romantic" className="flex-1 cursor-pointer">
                <div className="font-medium">浪漫向</div>
                <div className="text-xs text-muted-foreground">2个角色的恋爱故事</div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="gen" id="gen" />
              <Label htmlFor="gen" className="flex-1 cursor-pointer">
                <div className="font-medium">单人中心向</div>
                <div className="text-xs text-muted-foreground">以一个角色为中心</div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="poly" id="poly" />
              <Label htmlFor="poly" className="flex-1 cursor-pointer">
                <div className="font-medium">多人配对</div>
                <div className="text-xs text-muted-foreground">3个或更多角色</div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Character Selection */}
        <div>
          <h4 className="font-medium mb-3">选择角色（已选 {selectedCharacters.length}）</h4>
          <div className="flex flex-wrap gap-2">
            {work.characters.map((char) => (
              <Button
                key={char.id}
                variant={selectedCharacters.includes(char.id) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (selectedCharacters.includes(char.id)) {
                    handleRemoveCharacter(char.id)
                  } else {
                    handleAddCharacter(char.id)
                  }
                }}
                className={cn(
                  "h-auto py-2 px-3",
                  selectedCharacters.includes(char.id) && "bg-primary text-primary-foreground"
                )}
              >
                {getCharacterName(char, locale)}
              </Button>
            ))}
          </div>
        </div>

        {/* Popular Pairings */}
        {work.popularPairings.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">热门配对推荐</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {work.popularPairings.slice(0, 4).map((pairing, index) => {
                const pairingNames = pairing.map(charId => {
                  const char = getCharacterById(work, charId)
                  return char ? getCharacterName(char, locale) : charId
                })
                return (
                  <Button
                    key={index}
                    variant="secondary"
                    className="h-auto py-3 px-4 justify-start"
                    onClick={() => {
                      setPairingType(pairing.length === 1 ? 'gen' : 'romantic')
                      setSelectedCharacters(pairing)
                    }}
                  >
                    <Heart className="w-4 h-4 mr-2 text-pink-500" />
                    {pairingNames.join(' × ')}
                  </Button>
                )
              })}
            </div>
          </div>
        )}
      </ModernCardContent>
    </ModernCard>
  )
}
