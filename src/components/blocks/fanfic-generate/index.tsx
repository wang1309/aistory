"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Icon from "@/components/icon";
import { toast } from "sonner";
import { FanficGenerate as FanficGenerateType } from "@/types/blocks/fanfic-generate";
import { useLocale } from "next-intl";
import { useAppContext } from "@/contexts/app";
import confetti from "canvas-confetti";
import { FanficStorage } from "@/lib/fanfic-storage";
import { PRESET_WORKS, getWorkById, getCharacterName, getCharacterById, getWorkName } from "@/lib/preset-works";
import { cn } from "@/lib/utils";

const isDev = process.env.NODE_ENV === "development";
const devLog = (...args: any[]) => {
  if (isDev) {
    console.log(...args);
  }
};

// ========== HELPER FUNCTIONS ==========

/**
 * Calculate word count for both English and Chinese text
 */
function calculateWordCount(text: string): number {
  if (!text || !text.trim()) return 0;

  const trimmed = text.trim();
  const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/gu;
  const cjkChars = trimmed.match(cjkRegex);
  const cjkCount = cjkChars ? cjkChars.length : 0;

  const withoutCJK = trimmed.replace(cjkRegex, ' ').trim();
  const englishWords = withoutCJK.split(/\s+/).filter(word => word.length > 0);
  const englishCount = withoutCJK ? englishWords.length : 0;

  return cjkCount + englishCount;
}

/**
 * Generate tags based on fanfic parameters
 */
function generateTags(params: {
  sourceName: string;
  pairing: string[];
  plotType: string;
  ending?: string;
}): string[] {
  const tags: string[] = [];

  // Source work tag
  if (params.sourceName) {
    tags.push(`#${params.sourceName.replace(/\s+/g, '')}`);
  }

  // Pairing tag
  if (params.pairing.length > 0) {
    const pairingTag = params.pairing.join('×');
    tags.push(`#${pairingTag}`);
  }

  // Plot type tag
  const plotTypeNames: Record<string, string> = {
    'canon': 'Canon',
    'modern_au': 'ModernAU',
    'school_au': 'SchoolAU',
    'fantasy_au': 'FantasyAU',
    'crossover': 'Crossover'
  };
  if (params.plotType && plotTypeNames[params.plotType]) {
    tags.push(`#${plotTypeNames[params.plotType]}`);
  }

  // Ending tag
  if (params.ending && params.ending !== 'none') {
    const endingNames: Record<string, string> = {
      'happy': 'HE',
      'sad': 'BE',
      'open': 'OE'
    };
    if (endingNames[params.ending]) {
      tags.push(`#${endingNames[params.ending]}`);
    }
  }

  return tags;
}

// ========== COMPONENT ==========

export default function FanficGenerate({ section }: { section: FanficGenerateType }) {
  const locale = useLocale();
  const { user, setShowVerificationModal, setVerificationCallback } = useAppContext();

  // ========== STATE MANAGEMENT ==========

  // Source work state
  const [sourceType, setSourceType] = useState<'preset' | 'custom'>('preset');
  const [selectedPresetWork, setSelectedPresetWork] = useState<string>('');
  const [customWorkName, setCustomWorkName] = useState('');
  const [customWorldview, setCustomWorldview] = useState('');
  const [customCharacters, setCustomCharacters] = useState('');

  // Pairing state
  const [pairingType, setPairingType] = useState<'romantic' | 'gen' | 'poly'>('romantic');
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);

  // Plot type state
  const [plotType, setPlotType] = useState<string>('');

  // Prompt state
  const [prompt, setPrompt] = useState('');
  const [outputLanguage, setOutputLanguage] = useState(locale);

  // AI model state
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  // Advanced options state
  const [selectedOOC, setSelectedOOC] = useState('none');
  const [selectedFidelity, setSelectedFidelity] = useState('none');
  const [selectedEnding, setSelectedEnding] = useState('none');
  const [selectedRating, setSelectedRating] = useState('none');
  const [selectedLength, setSelectedLength] = useState('none');
  const [selectedPerspective, setSelectedPerspective] = useState('none');

  // Generation state
  const [generatedFanfic, setGeneratedFanfic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // UI state
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // ========== COMPUTED VALUES ==========

  const AI_MODELS = useMemo(() => [
    {
      id: 'fast',
      name: section.ai_models.models.character_focused.name,
      badge: section.ai_models.models.character_focused.badge,
      badgeColor: 'bg-green-500/10 text-green-600 border-green-500/30',
      icon: '👤',
      speed: section.ai_models.models.character_focused.speed,
      description: section.ai_models.models.character_focused.description
    },
    {
      id: 'standard',
      name: section.ai_models.models.creative.name,
      badge: section.ai_models.models.creative.badge,
      badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      icon: '✨',
      speed: section.ai_models.models.creative.speed,
      description: section.ai_models.models.creative.description
    },
    {
      id: 'creative',
      name: section.ai_models.models.depth.name,
      badge: section.ai_models.models.depth.badge,
      badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      icon: '🎭',
      speed: section.ai_models.models.depth.speed,
      description: section.ai_models.models.depth.description
    }
  ], [section]);

  // Get available characters based on source type
  const availableCharacters = useMemo(() => {
    if (sourceType === 'preset' && selectedPresetWork) {
      const work = getWorkById(selectedPresetWork);
      return work?.characters || [];
    } else if (sourceType === 'custom' && customCharacters) {
      // For custom works, create character objects with same name for both locales
      return customCharacters.split(',').map(c => {
        const trimmed = c.trim();
        return {
          id: trimmed.toLowerCase().replace(/\s+/g, '-'),
          name: trimmed,
          nameEn: trimmed,
          role: 'main' as const,
          description: ''
        };
      }).filter(c => c.name);
    }
    return [];
  }, [sourceType, selectedPresetWork, customCharacters]);

  // Update word count when generated fanfic changes
  useEffect(() => {
    if (generatedFanfic) {
      setWordCount(calculateWordCount(generatedFanfic));
    }
  }, [generatedFanfic]);

  // ========== EVENT HANDLERS ==========

  const handleSourceTypeChange = useCallback((type: 'preset' | 'custom') => {
    setSourceType(type);
    setSelectedCharacters([]);
  }, []);

  const handlePresetWorkChange = useCallback((workId: string) => {
    setSelectedPresetWork(workId);
    setSelectedCharacters([]);
  }, []);

  const handleAddCharacter = useCallback((characterId: string) => {
    if (!selectedCharacters.includes(characterId)) {
      if (pairingType === 'gen' && selectedCharacters.length >= 1) {
        toast.error(section.toasts.error_no_pairing);
        return;
      }
      setSelectedCharacters([...selectedCharacters, characterId]);
    }
  }, [selectedCharacters, pairingType, section]);

  const handleRemoveCharacter = useCallback((characterId: string) => {
    setSelectedCharacters(selectedCharacters.filter(c => c !== characterId));
  }, [selectedCharacters]);

  const handleModelSelect = useCallback((modelId: string) => {
    setSelectedModel(modelId);
  }, []);

  // Validation
  const validateForm = useCallback((): boolean => {
    // Check source
    if (sourceType === 'preset' && !selectedPresetWork) {
      toast.error(section.toasts.error_no_source);
      return false;
    }
    if (sourceType === 'custom' && !customWorkName.trim()) {
      toast.error(section.toasts.error_no_source);
      return false;
    }

    // Check pairing
    if (selectedCharacters.length === 0) {
      toast.error(section.toasts.error_no_pairing);
      return false;
    }

    // Check plot type
    if (!plotType) {
      toast.error(section.toasts.error_no_plot_type);
      return false;
    }

    // Check prompt
    if (!prompt.trim()) {
      toast.error(section.toasts.error_no_prompt);
      return false;
    }

    // Check model
    if (!selectedModel) {
      toast.error(section.toasts.error_no_model);
      return false;
    }

    // Check mature content warning
    if (selectedRating === 'mature' || selectedRating === 'explicit') {
      toast.warning(section.toasts.warning_mature_content);
    }

    return true;
  }, [sourceType, selectedPresetWork, customWorkName, selectedCharacters, plotType, prompt, selectedModel, selectedRating, section]);

  // Handle verification and triggerfanfic generation
  const handleGenerate = useCallback(async () => {
    if (!validateForm()) return;

    // Set verification callback and show modal
    setVerificationCallback(() => handleVerificationSuccess);
    setShowVerificationModal(true);
  }, [validateForm, setShowVerificationModal, setVerificationCallback]);

  // Handle verification success - start fanfic generation
  const handleVerificationSuccess = useCallback(async (turnstileToken: string) => {
    devLog('=== Starting fanfic generation after verification ===');

    setIsGenerating(true);
    setGeneratedFanfic('');
    setGeneratedTags([]);
    abortControllerRef.current = new AbortController();

    try {
      // Prepare request data
      const work = sourceType === 'preset' ? getWorkById(selectedPresetWork) : null;

      // Convert character IDs to names based on output language
      const selectedCharacterNames = selectedCharacters.map(charId => {
        const character = availableCharacters.find(c => c.id === charId);
        return character ? getCharacterName(character, outputLanguage) : charId;
      });

      const requestData: any = {
        source: {
          type: sourceType,
          name: sourceType === 'preset' ? work?.name || '' : customWorkName,
          worldview: sourceType === 'preset' ? work?.worldview : customWorldview,
          characters: sourceType === 'preset'
            ? work?.characters.map(c => getCharacterName(c, outputLanguage))
            : customCharacters.split(',').map(c => c.trim()).filter(c => c)
        },
        pairing: {
          type: pairingType,
          characters: selectedCharacterNames
        },
        plotType,
        prompt,
        model: selectedModel,
        locale,
        outputLanguage,
        options: {
          ooc: selectedOOC,
          fidelity: selectedFidelity,
          ending: selectedEnding,
          rating: selectedRating,
          length: selectedLength,
          perspective: selectedPerspective
        },
        turnstileToken: turnstileToken
      };

      devLog('=== Request body to API ===', JSON.stringify(requestData, null, 2));

      // Generate tags
      const tags = generateTags({
        sourceName: requestData.source.name,
        pairing: selectedCharacterNames,
        plotType,
        ending: selectedEnding
      });
      setGeneratedTags(tags);

      // Call API
      const response = await fetch('/api/fanfic-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: abortControllerRef.current.signal
      });

      devLog('=== Response status ===', response.status);

      if (!response.ok) {
        devLog('=== Response not OK ===');
        const errorData = await response.json();
        devLog('Error data:', errorData);
        toast.error(errorData.message || section.toasts.error_generate_failed);
        return;
      }

      devLog('=== Starting to read stream ===');

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        devLog('=== No reader available ===');
        toast.error(section.toasts.error_no_stream);
        return;
      }

      let accumulatedText = '';
      let chunkCount = 0;
      let buffer = ''; // Buffer for incomplete lines

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          devLog(`=== Stream finished, total chunks: ${chunkCount} ===`);
          break;
        }

        chunkCount++;

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        devLog(`=== Frontend chunk ${chunkCount} ===`, chunk.substring(0, 100));

        // Add to buffer
        buffer += chunk;

        // Split by newlines but keep the last incomplete line in buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep last incomplete line

        for (const line of lines) {
          if (line.startsWith('0:')) {
            // Extract the text content from the data stream
            try {
              const jsonStr = line.slice(2); // Remove "0:" prefix
              devLog('=== Parsing line ===', jsonStr.substring(0, 50));

              // Parse the JSON string to get the actual text
              const text = JSON.parse(jsonStr);
              devLog('=== Extracted text ===', text.substring(0, 50));

              accumulatedText += text;
              setGeneratedFanfic(accumulatedText);

              // Auto scroll to output
              if (outputRef.current) {
                outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            } catch (e) {
              console.error('=== Parse error ===', e, 'Line:', line);
            }
          }
        }
      }

      // Validate content
      if (!accumulatedText || accumulatedText.trim().length === 0) {
        throw new Error(section.toasts.error_no_content);
      }

      devLog('=== Final fanfic length ===', accumulatedText.length, 'chars');

      // Save to history
      FanficStorage.saveHistory({
        title: accumulatedText.split('\n')[0].substring(0, 50) + '...',
        source: requestData.source,
        pairing: requestData.pairing,
        plotType,
        prompt,
        content: accumulatedText,
        wordCount: calculateWordCount(accumulatedText),
        tags,
        model: selectedModel || 'standard',
        options: requestData.options
      });

      // Show success
      toast.success(section.toasts.success_generated);

      // Confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

    } catch (error: any) {
      if (error.name === 'AbortError') {
        devLog('Generation aborted');
      } else {
        console.error('Generation failed:', error);
        toast.error(error.message || section.toasts.error_generate_failed);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [
    sourceType,
    selectedPresetWork,
    customWorkName,
    customWorldview,
    customCharacters,
    selectedCharacters,
    availableCharacters,
    pairingType,
    plotType,
    prompt,
    selectedModel,
    locale,
    outputLanguage,
    selectedOOC,
    selectedFidelity,
    selectedEnding,
    selectedRating,
    selectedLength,
    selectedPerspective,
    section
  ]);

  // ========== RENDER ==========

  return (
    <section className="relative py-16 md:py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            {section.header.title}
          </h1>
          <p className="text-lg text-muted-foreground">
            {section.header.subtitle}
          </p>
        </div>

        {/* Main Content - Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Main Form (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. Original Work Selector */}
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Icon name="mdi:book-open-variant" className="w-5 h-5" />
                {section.source.label}
                <span className="text-xs text-destructive ml-1">*</span>
              </h3>

              {/* Source Type Toggle */}
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={sourceType === 'preset' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSourceTypeChange('preset')}
                >
                  {section.source.preset_label}
                </Button>
                <Button
                  type="button"
                  variant={sourceType === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSourceTypeChange('custom')}
                >
                  {section.source.custom_label}
                </Button>
              </div>

              {/* Preset Work Selection */}
              {sourceType === 'preset' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-sm">{section.source.preset_label}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {PRESET_WORKS.map((work) => (
                        <button
                          key={work.id}
                          type="button"
                          className={cn(
                            "p-4 rounded-lg border transition-all text-left",
                            selectedPresetWork === work.id
                              ? "border-primary bg-primary/10"
                              : "bg-card hover:border-primary/30"
                          )}
                          onClick={() => handlePresetWorkChange(work.id)}
                        >
                          <div className="font-medium text-sm line-clamp-1">
                            {getWorkName(work, locale)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {work.popularPairings.length} pairings
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* Custom Work Input */}
              {sourceType === 'custom' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="custom-work-name">{section.source.custom_label}</Label>
                    <Textarea
                      id="custom-work-name"
                      placeholder={section.source.preset_placeholder}
                      value={customWorkName}
                      onChange={(e) => setCustomWorkName(e.target.value)}
                      className="mt-2"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. CP Pairing Selection */}
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Icon name="mdi:heart-multiple" className="w-5 h-5" />
                {section.pairing.label}
                <span className="text-xs text-destructive ml-1">*</span>
              </h3>

              {/* Pairing Type */}
              <div className="mb-4">
                <Label className="mb-3 block">{section.pairing.type_label}</Label>
                <RadioGroup value={pairingType} onValueChange={(value: any) => setPairingType(value)}>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="romantic" id="romantic" />
                      <Label htmlFor="romantic" className="cursor-pointer">
                        {section.pairing.type_options.romantic}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gen" id="gen" />
                      <Label htmlFor="gen" className="cursor-pointer">
                        {section.pairing.type_options.gen}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="poly" id="poly" />
                      <Label htmlFor="poly" className="cursor-pointer">
                        {section.pairing.type_options.poly}
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Character Selection */}
              <div className="space-y-3">
                <Label>{section.pairing.character_placeholder}</Label>

                {/* Selected Characters */}
                {selectedCharacters.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/50">
                    {selectedCharacters.map((characterId, index) => {
                      const character = availableCharacters.find(c => c.id === characterId);
                      if (!character) return null;
                      const displayName = getCharacterName(character, locale);
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm"
                        >
                          <span>{displayName}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCharacter(characterId)}
                            className="ml-1 hover:opacity-70"
                          >
                            <Icon name="mdi:close" className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Available Characters */}
                {availableCharacters.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableCharacters.map((character) => {
                      const displayName = getCharacterName(character, locale);
                      return (
                        <Button
                          key={character.id}
                          type="button"
                          variant={selectedCharacters.includes(character.id) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleAddCharacter(character.id)}
                          disabled={selectedCharacters.includes(character.id)}
                          className="justify-start"
                        >
                          {displayName}
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg border-dashed">
                    {section.pairing.hint}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Plot Type Selection */}
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Icon name="mdi:script-text" className="w-5 h-5" />
                {section.plot_type.label}
                <span className="text-xs text-destructive ml-1">*</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(section.plot_type.options).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPlotType(key)}
                    className={cn(
                      "p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50",
                      plotType === key
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    )}
                  >
                    <div className="font-medium mb-1">{value.name}</div>
                    <div className="text-sm text-muted-foreground">{value.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Story Prompt */}
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Icon name="mdi:lightbulb" className="w-5 h-5" />
                {section.prompt.label}
                <span className="text-xs text-destructive ml-1">*</span>
              </h3>

              <Textarea
                placeholder={section.prompt.placeholder}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[150px] resize-y"
                maxLength={2000}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  {section.prompt.character_counter.replace('{{count}}', prompt.length.toString())}
                </p>
              </div>

              {/* Output Language Selection */}
              <div className="mt-4">
                <Label className="mb-2 block">{section.prompt.language_label}</Label>
                <Select value={outputLanguage} onValueChange={setOutputLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder={section.prompt.language_placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(section.prompt.language_options).map(([code, lang]) => (
                      <SelectItem key={code} value={code}>
                        <div className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.native}</span>
                          <span className="text-xs text-muted-foreground">({lang.english})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 5. Advanced Options */}
            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <div className="p-6 rounded-lg border bg-card">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Icon name="mdi:tune-variant" className="w-5 h-5" />
                      {section.advanced_options.title}
                      <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {section.advanced_options.optional_badge}
                      </span>
                    </h3>
                    <Icon
                      name={isAdvancedOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
                      className="w-5 h-5 text-muted-foreground"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-left mt-2">
                    {section.advanced_options.subtitle}
                  </p>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* OOC Level */}
                    <div>
                      <Label className="mb-2 block">{section.advanced_options.ooc.label}</Label>
                      <Select value={selectedOOC} onValueChange={setSelectedOOC}>
                        <SelectTrigger>
                          <SelectValue placeholder={section.advanced_options.ooc.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(section.advanced_options.ooc.options).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Fidelity */}
                    <div>
                      <Label className="mb-2 block">{section.advanced_options.fidelity.label}</Label>
                      <Select value={selectedFidelity} onValueChange={setSelectedFidelity}>
                        <SelectTrigger>
                          <SelectValue placeholder={section.advanced_options.fidelity.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(section.advanced_options.fidelity.options).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Ending */}
                    <div>
                      <Label className="mb-2 block">{section.advanced_options.ending.label}</Label>
                      <Select value={selectedEnding} onValueChange={setSelectedEnding}>
                        <SelectTrigger>
                          <SelectValue placeholder={section.advanced_options.ending.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(section.advanced_options.ending.options).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Rating */}
                    <div>
                      <Label className="mb-2 block">{section.advanced_options.rating.label}</Label>
                      <Select value={selectedRating} onValueChange={setSelectedRating}>
                        <SelectTrigger>
                          <SelectValue placeholder={section.advanced_options.rating.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(section.advanced_options.rating.options).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(selectedRating === 'mature' || selectedRating === 'explicit') && (
                        <p className="text-xs text-orange-600 mt-1">
                          {section.advanced_options.rating.warning}
                        </p>
                      )}
                    </div>

                    {/* Length */}
                    <div>
                      <Label className="mb-2 block">{section.advanced_options.length.label}</Label>
                      <Select value={selectedLength} onValueChange={setSelectedLength}>
                        <SelectTrigger>
                          <SelectValue placeholder={section.advanced_options.length.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(section.advanced_options.length.options).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Perspective */}
                    <div>
                      <Label className="mb-2 block">{section.advanced_options.perspective.label}</Label>
                      <Select value={selectedPerspective} onValueChange={setSelectedPerspective}>
                        <SelectTrigger>
                          <SelectValue placeholder={section.advanced_options.perspective.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(section.advanced_options.perspective.options).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* 6. AI Model Selection */}
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Icon name="mdi:brain" className="w-5 h-5" />
                {section.ai_models.title}
                <span className="text-xs text-destructive ml-1">*</span>
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{section.ai_models.hint}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {AI_MODELS.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleModelSelect(model.id)}
                    className={cn(
                      "p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50 relative",
                      selectedModel === model.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    )}
                  >
                    {/* Badge */}
                    <div className={cn(
                      "absolute top-2 right-2 text-xs px-2 py-1 rounded-full border",
                      model.badgeColor
                    )}>
                      {model.badge}
                    </div>

                    {/* Icon */}
                    <div className="text-2xl mb-2">{model.icon}</div>

                    {/* Name */}
                    <div className="font-semibold mb-1">{model.name}</div>

                    {/* Description */}
                    <div className="text-sm text-muted-foreground mb-2">
                      {model.description}
                    </div>

                    {/* Speed */}
                    <div className="text-xs text-muted-foreground">
                      {section.ui.speed_icon} {model.speed}
                    </div>

                    {/* Selected Indicator */}
                    {selectedModel === model.id && (
                      <div className="absolute bottom-2 right-2">
                        <Icon name="mdi:check-circle" className="w-5 h-5 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 7. Generate Button */}
            <div className="p-6 rounded-lg border bg-card bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full h-14 text-lg font-semibold"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Icon name="mdi:loading" className="w-5 h-5 mr-2 animate-spin" />
                    {section.generate_button.generating}
                  </>
                ) : (
                  <>
                    <Icon name="mdi:magic-staff" className="w-5 h-5 mr-2" />
                    {section.generate_button.text}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-3">
                {section.generate_button.tip}
              </p>
            </div>

            {/* 8. Output Display */}
            {generatedFanfic && (
              <div className="p-6 rounded-lg border bg-card" ref={outputRef}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Icon name="mdi:text-box" className="w-5 h-5" />
                    {section.output.title}
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {section.output.word_count.replace('{{count}}', wordCount.toString())}
                  </div>
                </div>

                {/* Tags */}
                {generatedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {generatedTags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Content */}
                <div className="prose prose-sm max-w-none dark:prose-invert mb-4 p-4 rounded-lg bg-muted/30 whitespace-pre-wrap">
                  {generatedFanfic}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedFanfic);
                      toast.success(section.toasts.success_copied);
                    }}
                  >
                    <Icon name="mdi:content-copy" className="w-4 h-4 mr-1" />
                    {section.output.button_copy}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    <Icon name="mdi:refresh" className="w-4 h-4 mr-1" />
                    {section.output.button_regenerate}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Presets Sidebar (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              {/* Popular Works */}
              <div className="p-6 rounded-lg border bg-card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Icon name="mdi:fire" className="w-5 h-5 text-orange-500" />
                  {section.presets.works_title}
                </h3>

                <div className="space-y-2">
                  {PRESET_WORKS.slice(0, 6).map((work) => (
                    <button
                      key={work.id}
                      type="button"
                      onClick={() => {
                        setSourceType('preset');
                        handlePresetWorkChange(work.id);
                      }}
                      className={cn(
                        "w-full p-3 rounded-lg text-left transition-all hover:bg-primary/10 border",
                        selectedPresetWork === work.id && sourceType === 'preset'
                          ? "border-primary bg-primary/5"
                          : "border-transparent"
                      )}
                    >
                      <div className="font-medium text-sm">
                        {getWorkName(work, locale)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular Pairings */}
              {selectedPresetWork && sourceType === 'preset' && (() => {
                const work = getWorkById(selectedPresetWork);
                return work && work.popularPairings.length > 0 ? (
                  <div className="p-6 rounded-lg border bg-card">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Icon name="mdi:heart" className="w-5 h-5 text-pink-500" />
                      {section.presets.popular_pairings}
                    </h3>

                    <div className="space-y-2">
                      {work.popularPairings.map((pairing, index) => {
                        const pairingNames = pairing.map(charId => {
                          const char = getCharacterById(work, charId);
                          return char ? getCharacterName(char, locale) : charId;
                        });
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setPairingType('romantic');
                              setSelectedCharacters(pairing);
                            }}
                            className="w-full p-3 rounded-lg text-left transition-all hover:bg-pink-500/10 border border-transparent hover:border-pink-500/30"
                          >
                            <div className="text-sm font-medium">
                              {pairingNames.join(section.ui.pairing_separator)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
