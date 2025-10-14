"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/icon";
import { toast } from "sonner";
import { StoryGenerate as StoryGenerateType } from "@/types/blocks/story-generate";

// ========== HELPER FUNCTIONS ==========

/**
 * Calculate word count for both English and Chinese text
 * - For Chinese/Japanese/Korean: count characters (excluding whitespace and punctuation)
 * - For English and other languages: count words (space-separated)
 */
function calculateWordCount(text: string): number {
  if (!text || !text.trim()) return 0;

  // Remove leading/trailing whitespace
  const trimmed = text.trim();

  // Count CJK (Chinese, Japanese, Korean) characters
  const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/gu;
  const cjkChars = trimmed.match(cjkRegex);
  const cjkCount = cjkChars ? cjkChars.length : 0;

  // Remove CJK characters and count remaining words (space-separated)
  const withoutCJK = trimmed.replace(cjkRegex, ' ').trim();
  const englishWords = withoutCJK.split(/\s+/).filter(word => word.length > 0);
  const englishCount = withoutCJK ? englishWords.length : 0;

  return cjkCount + englishCount;
}

// ========== COMPONENT ==========

export default function StoryGenerate({ section }: { section: StoryGenerateType }) {
  // Get translated constants (memoized for performance)
  const RANDOM_PROMPTS = useMemo(() => section.random_prompts, [section]);

  const PRESET_TEMPLATES = useMemo(() => ({
    [section.presets.items.fantasy_quest.title]: section.presets.items.fantasy_quest.template,
    [section.presets.items.scifi_thriller.title]: section.presets.items.scifi_thriller.template,
    [section.presets.items.love_story.title]: section.presets.items.love_story.template,
    [section.presets.items.crime_mystery.title]: section.presets.items.crime_mystery.template,
  }), [section]);

  const QUICK_ADD_CHIPS = useMemo(() => [
    section.prompt.quick_add_chips.plot_twist,
    section.prompt.quick_add_chips.dialogue,
    section.prompt.quick_add_chips.setting
  ], [section]);

  const STORY_PRESETS = useMemo(() => [
    { emoji: '🏰', title: section.presets.items.fantasy_quest.title, desc: section.presets.items.fantasy_quest.desc },
    { emoji: '🚀', title: section.presets.items.scifi_thriller.title, desc: section.presets.items.scifi_thriller.desc },
    { emoji: '💕', title: section.presets.items.love_story.title, desc: section.presets.items.love_story.desc },
    { emoji: '🕵️', title: section.presets.items.crime_mystery.title, desc: section.presets.items.crime_mystery.desc }
  ], [section]);

  const AI_MODELS = useMemo(() => [
    {
      id: 'gemini-2.5-flash-lite',
      name: section.ai_models.models.fastest.name,
      badge: section.ai_models.models.fastest.badge,
      badgeColor: 'bg-green-500/10 text-green-600 border-green-500/30',
      icon: '⚡',
      speed: section.ai_models.models.fastest.speed,
      description: section.ai_models.models.fastest.description
    },
    {
      id: 'gemini-2.5-flash',
      name: section.ai_models.models.eloquent.name,
      badge: section.ai_models.models.eloquent.badge,
      badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      icon: '✒️',
      speed: section.ai_models.models.eloquent.speed,
      description: section.ai_models.models.eloquent.description
    },
    {
      id: 'gemini-2.5-flash-think',
      name: section.ai_models.models.creative.name,
      badge: section.ai_models.models.creative.badge,
      badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      icon: '🎨',
      speed: section.ai_models.models.creative.speed,
      description: section.ai_models.models.creative.description
    }
  ], [section]);

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState("none");
  const [selectedLength, setSelectedLength] = useState("none");
  const [selectedGenre, setSelectedGenre] = useState("none");
  const [selectedPerspective, setSelectedPerspective] = useState("first-person");
  const [selectedAudience, setSelectedAudience] = useState("none");
  const [selectedTone, setSelectedTone] = useState("none");

  // Story generation state
  const [generatedStory, setGeneratedStory] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Calculate word count (memoized for performance)
  const wordCount = useMemo(() => calculateWordCount(generatedStory), [generatedStory]);

  // ========== MEMOIZED HANDLERS (Performance optimization: prevents recreation on every render) ==========

  // Quick add chips handler - appends to existing prompt
  const handleQuickAdd = useCallback((text: string) => {
    setPrompt(prev => {
      const addition = prev.trim() ? `. ${text}` : text;
      return (prev + addition).slice(0, 2000);
    });
  }, []); // Empty deps because using functional setState

  // Story preset handler - replaces entire prompt with template
  const handlePresetClick = useCallback((preset: typeof STORY_PRESETS[number]) => {
    setPrompt(PRESET_TEMPLATES[preset.title as keyof typeof PRESET_TEMPLATES] || preset.desc);
  }, []);

  // Random prompt generator
  const handleRandomPrompt = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * RANDOM_PROMPTS.length);
    setPrompt(RANDOM_PROMPTS[randomIndex]);
  }, []);

  // Story generation handler with streaming
  const handleGenerateStory = useCallback(async () => {
    // Validation
    if (!prompt.trim()) {
      toast.error(section.toasts.error_no_prompt);
      return;
    }

    if (!selectedModel) {
      toast.error(section.toasts.error_no_model);
      return;
    }

    console.log("=== Starting story generation ===");
    console.log("Current state:", {
      prompt: prompt.substring(0, 100),
      selectedModel,
      selectedFormat,
      selectedLength,
      selectedGenre,
      selectedPerspective,
      selectedAudience,
      selectedTone
    });

    try {
      setIsGenerating(true);
      setGeneratedStory("");

      const requestBody = {
        prompt: prompt.trim(),
        model: selectedModel,
        format: selectedFormat,
        length: selectedLength,
        genre: selectedGenre,
        perspective: selectedPerspective,
        audience: selectedAudience,
        tone: selectedTone,
      };

      console.log("=== Request body to API ===", JSON.stringify(requestBody, null, 2));

      const response = await fetch("/api/story-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("=== Response status ===", response.status, response.statusText);
      console.log("=== Response headers ===", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error("=== Response not OK ===");
        const errorData = await response.json();
        console.error("Error data:", errorData);
        toast.error(errorData.message || section.toasts.error_generate_failed);
        return;
      }

      console.log("=== Starting to read stream ===");

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        console.error("=== No reader available ===");
        toast.error(section.toasts.error_no_stream);
        return;
      }

      let accumulatedText = "";
      let chunkCount = 0;
      let buffer = ""; // Buffer for incomplete lines

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log(`=== Stream finished, total chunks: ${chunkCount} ===`);
          break;
        }

        chunkCount++;

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        console.log(`=== Frontend chunk ${chunkCount} ===`, chunk.substring(0, 100));

        // Add to buffer
        buffer += chunk;

        // Split by newlines but keep the last incomplete line in buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep last incomplete line

        for (const line of lines) {
          if (line.startsWith("0:")) {
            // Extract the text content from the data stream
            try {
              const jsonStr = line.slice(2); // Remove "0:" prefix
              console.log("=== Parsing line ===", jsonStr.substring(0, 50));
              const parsed = JSON.parse(jsonStr);

              if (typeof parsed === "string") {
                accumulatedText += parsed;
                setGeneratedStory(accumulatedText);
                console.log("=== Accumulated text length ===", accumulatedText.length);
              }
            } catch (e) {
              // Skip invalid JSON lines
              console.error("JSON Parse error:", e, "Line:", line.substring(0, 100));
            }
          }
        }
      }

      console.log("=== Final accumulated text length ===", accumulatedText.length);

      if (accumulatedText.trim()) {
        toast.success(section.toasts.success_generated);
      } else {
        console.error("=== No story content was generated ===");
        toast.error(section.toasts.error_no_content);
      }
    } catch (error) {
      console.error("=== Story generation error ===", error);
      toast.error(section.toasts.error_generate_failed);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedModel, selectedFormat, selectedLength, selectedGenre, selectedPerspective, selectedAudience, selectedTone, section]);

  return (
    <section className="relative py-16 sm:py-20 overflow-hidden">
      <div className="container">
        <div className="mx-auto w-full max-w-5xl">
          {/* Enhanced Header */}
          <div className="relative text-center mb-12 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500">
            {/* Background ambient glow */}
            <div className="absolute -inset-x-20 -inset-y-8 bg-gradient-to-b from-primary/5 via-accent/5 to-transparent blur-2xl -z-10" />

            {/* Icon with shimmer */}
            <div className="relative inline-flex items-center justify-center mb-4 group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-500 scale-150" />
              <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 p-4 ring-1 ring-primary/20">
                <Icon name="book" className="size-8 text-primary drop-shadow-lg" />
              </div>
            </div>

            {/* Main headline */}
            <h2 id="craft_story" className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
              <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
                {section.header.title}
              </span>
            </h2>

            {/* Subtitle with sparkle */}
            <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto flex items-center justify-center gap-2">
              <span className="animate-pulse">✨</span>
              {section.header.subtitle}
            </p>
          </div>

          {/* Prompt Studio with Split Layout */}
          <div className="relative mb-8">
            {/* Main creator card */}
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500 will-change-opacity" />

              {/* Glassmorphic container */}
              <div className="relative rounded-2xl lg:rounded-3xl border-2 border-border/50 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-xl shadow-2xl ring-1 ring-white/10 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                  {/* LEFT: Prompt Studio (2/3 width) */}
                  <div className="lg:col-span-2 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-border/30">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                        <Icon name="pencil" className="size-4 text-primary" />
                        {section.prompt.label}
                        <span className="ml-1 text-xs text-muted-foreground font-normal">{section.prompt.required}</span>
                      </label>
                      <button
                        onClick={handleRandomPrompt}
                        type="button"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors group/btn"
                      >
                        <Icon name="sparkles" className="size-3.5 group-hover/btn:rotate-12 transition-transform" />
                        {section.prompt.random_button}
                      </button>
                    </div>

                    {/* Textarea with enhanced styling */}
                    <div className="relative">
                      {/* Inner glow effect */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />

                      <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value.slice(0, 2000))}
                        placeholder={section.prompt.placeholder}
                        className="min-h-[200px] resize-y rounded-xl bg-background/90 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 text-base leading-relaxed transition-colors duration-300"
                      />

                      {/* Character counter */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-2 text-xs text-muted-foreground/60">
                        <span>{prompt.length} / 2000</span>
                      </div>
                    </div>

                    {/* Quick enhancement chips */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="text-xs text-muted-foreground">{section.prompt.quick_adds_label}</span>
                      {QUICK_ADD_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => handleQuickAdd(chip)}
                          type="button"
                          className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 hover:border-primary/30 transition-all duration-200 hover:scale-105"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* RIGHT: Quick Presets (1/3 width) */}
                  <div className="p-6 lg:p-8 bg-gradient-to-br from-muted/30 to-muted/10">
                    <div className="flex items-center gap-2 mb-4">
                      <Icon name="lightbulb" className="size-4 text-accent" />
                      <h3 className="text-sm font-semibold text-foreground/90">{section.presets.title}</h3>
                    </div>

                    <div className="space-y-3">
                      {STORY_PRESETS.map((preset) => (
                        <button
                          key={preset.title}
                          onClick={() => handlePresetClick(preset)}
                          type="button"
                          className="w-full text-left p-3 rounded-lg bg-background/80 hover:bg-background/95 border border-border/30 hover:border-primary/30 transition-all duration-200 hover:scale-[1.02] hover:shadow-md group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{preset.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground/90 group-hover:text-primary transition-colors">
                                {preset.title}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {preset.desc}
                              </div>
                            </div>
                            <Icon name="arrow-right" className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Model Selection - Card Based */}
          <div className="mb-8">
            {/* Section label */}
            <div className="flex items-center gap-2 mb-4">
              <Icon name="bot" className="size-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground/90">{section.ai_models.title}</h3>
            </div>

            {/* Model cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {AI_MODELS.map((model) => {
                const isSelected = selectedModel === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    type="button"
                    className={`relative group text-left p-5 rounded-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-primary/10 ${
                      isSelected
                        ? 'bg-primary/10 border-2 border-primary/60 shadow-lg shadow-primary/20'
                        : 'bg-background/75 hover:bg-background/90 border-2 border-border/40 hover:border-primary/50'
                    }`}
                  >
                    {/* Badge */}
                    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 border ${model.badgeColor}`}>
                      {model.badge}
                    </div>

                    {/* Model info */}
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-3xl">{model.icon}</span>
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-foreground/90 mb-1">
                          {model.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {model.description}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/30">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon name="clock" className="size-3.5" />
                        {model.speed}
                      </div>
                      <div className={`text-xs font-medium transition-opacity ${
                        isSelected ? 'text-primary opacity-100' : 'text-primary opacity-0 group-hover:opacity-100'
                      }`}>
                        {isSelected ? section.ai_models.selected : section.ai_models.select}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Model comparison hint */}
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground/70">
              <Icon name="info" className="size-3.5" />
              <span>{section.ai_models.hint}</span>
            </div>
          </div>

          {/* Advanced Options - Enhanced */}
          <div className="mb-8">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-5 rounded-xl bg-gradient-to-br from-muted/40 to-muted/20 hover:from-muted/50 hover:to-muted/30 border border-border/40 hover:border-border/60 transition-all duration-300 list-none">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Icon name="sliders" className="size-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground/90">{section.advanced_options.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{section.advanced_options.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    {section.advanced_options.optional_badge}
                  </span>
                  <Icon name="chevron-down" className="size-5 text-muted-foreground group-open:rotate-180 transition-transform duration-300" />
                </div>
              </summary>

              {/* Expanded content */}
              <div className="mt-4 p-6 rounded-xl bg-background/60 border border-border/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">{section.advanced_options.format.label}</label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger className="w-full rounded-md bg-background">
                    <SelectValue placeholder={section.advanced_options.format.placeholder} />
                  </SelectTrigger>
                  <SelectContent className="rounded-md bg-background">
                  <SelectItem value="none">{section.advanced_options.format.options.none}</SelectItem>
                    <SelectItem value="prose">{section.advanced_options.format.options.prose}</SelectItem>
                    <SelectItem value="screenplay">{section.advanced_options.format.options.screenplay}</SelectItem>
                    <SelectItem value="short-story">{section.advanced_options.format.options.short_story}</SelectItem>
                    <SelectItem value="letter">{section.advanced_options.format.options.letter}</SelectItem>
                    <SelectItem value="diary">{section.advanced_options.format.options.diary}</SelectItem>
                    <SelectItem value="fairy-tale">{section.advanced_options.format.options.fairy_tale}</SelectItem>
                    <SelectItem value="myth">{section.advanced_options.format.options.myth}</SelectItem>
                    <SelectItem value="fable">{section.advanced_options.format.options.fable}</SelectItem>
                    <SelectItem value="poem">{section.advanced_options.format.options.poem}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">{section.advanced_options.length.label}</label>
                <Select value={selectedLength} onValueChange={setSelectedLength}>
                  <SelectTrigger className="w-full rounded-md bg-background">
                    <SelectValue placeholder={section.advanced_options.length.placeholder} />
                  </SelectTrigger>
                  <SelectContent className="rounded-md bg-background">
                  <SelectItem value="none">{section.advanced_options.length.options.none}</SelectItem>
                    <SelectItem value="short">{section.advanced_options.length.options.short}</SelectItem>
                    <SelectItem value="medium">{section.advanced_options.length.options.medium}</SelectItem>
                    <SelectItem value="long">{section.advanced_options.length.options.long}</SelectItem>
                    <SelectItem value="extend">{section.advanced_options.length.options.extend}</SelectItem>
                    <SelectItem value="epic-short">{section.advanced_options.length.options.epic_short}</SelectItem>
                    <SelectItem value="novella-lite">{section.advanced_options.length.options.novella_lite}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">{section.advanced_options.genre.label}</label>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="w-full rounded-md bg-background">
                    <SelectValue placeholder={section.advanced_options.genre.placeholder} />
                  </SelectTrigger>
                  <SelectContent className="rounded-md bg-background">
                  <SelectItem value="none">{section.advanced_options.genre.options.none}</SelectItem>
                    <SelectItem value="fantasy">{section.advanced_options.genre.options.fantasy}</SelectItem>
                    <SelectItem value="science-fiction">{section.advanced_options.genre.options.science_fiction}</SelectItem>
                    <SelectItem value="romance">{section.advanced_options.genre.options.romance}</SelectItem>
                    <SelectItem value="thriller">{section.advanced_options.genre.options.thriller}</SelectItem>
                    <SelectItem value="drama">{section.advanced_options.genre.options.drama}</SelectItem>
                    <SelectItem value="comedy">{section.advanced_options.genre.options.comedy}</SelectItem>
                    <SelectItem value="action">{section.advanced_options.genre.options.action}</SelectItem>
                    <SelectItem value="western">{section.advanced_options.genre.options.western}</SelectItem>
                    <SelectItem value="crime">{section.advanced_options.genre.options.crime}</SelectItem>
                    <SelectItem value="science">{section.advanced_options.genre.options.science}</SelectItem>
                    <SelectItem value="fiction">{section.advanced_options.genre.options.fiction}</SelectItem>
                    <SelectItem value="non-fiction">{section.advanced_options.genre.options.non_fiction}</SelectItem>
                    <SelectItem value="mystery">{section.advanced_options.genre.options.mystery}</SelectItem>
                    <SelectItem value="biography">{section.advanced_options.genre.options.biography}</SelectItem>
                    <SelectItem value="self-help">{section.advanced_options.genre.options.self_help}</SelectItem>
                    <SelectItem value="horror">{section.advanced_options.genre.options.horror}</SelectItem>
                    <SelectItem value="adventure">{section.advanced_options.genre.options.adventure}</SelectItem>
                    <SelectItem value="historical">{section.advanced_options.genre.options.historical}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">{section.advanced_options.perspective.label}</label>
                <Select value={selectedPerspective} onValueChange={setSelectedPerspective}>
                  <SelectTrigger className="w-full rounded-md bg-background">
                    <SelectValue placeholder={section.advanced_options.perspective.placeholder} />
                  </SelectTrigger>
                  <SelectContent className="rounded-md bg-background">
                    <SelectItem value="first-person">{section.advanced_options.perspective.options.first_person}</SelectItem>
                    <SelectItem value="second-person">{section.advanced_options.perspective.options.second_person}</SelectItem>
                    <SelectItem value="third-person-limited">{section.advanced_options.perspective.options.third_person_limited}</SelectItem>
                    <SelectItem value="third-person-omniscient">{section.advanced_options.perspective.options.third_person_omniscient}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">{section.advanced_options.audience.label}</label>
                <Select value={selectedAudience} onValueChange={setSelectedAudience}>
                  <SelectTrigger className="w-full rounded-md bg-background">
                    <SelectValue placeholder={section.advanced_options.audience.placeholder} />
                  </SelectTrigger>
                  <SelectContent className="rounded-md bg-background">
                  <SelectItem value="none">{section.advanced_options.audience.options.none}</SelectItem>
                    <SelectItem value="kids">{section.advanced_options.audience.options.kids}</SelectItem>
                    <SelectItem value="pre-teen">{section.advanced_options.audience.options.pre_teen}</SelectItem>
                    <SelectItem value="teens">{section.advanced_options.audience.options.teens}</SelectItem>
                    <SelectItem value="young-adults">{section.advanced_options.audience.options.young_adults}</SelectItem>
                    <SelectItem value="adults">{section.advanced_options.audience.options.adults}</SelectItem>
                    <SelectItem value="mature-audience">{section.advanced_options.audience.options.mature_audience}</SelectItem>
                    <SelectItem value="general">{section.advanced_options.audience.options.general}</SelectItem>
                    <SelectItem value="families">{section.advanced_options.audience.options.families}</SelectItem>
                    <SelectItem value="educators">{section.advanced_options.audience.options.educators}</SelectItem>
                    <SelectItem value="writers-author">{section.advanced_options.audience.options.writers_author}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">{section.advanced_options.tone.label}</label>
                <Select value={selectedTone} onValueChange={setSelectedTone}>
                  <SelectTrigger className="w-full rounded-md bg-background">
                    <SelectValue placeholder={section.advanced_options.tone.placeholder} />
                  </SelectTrigger>
                  <SelectContent className="rounded-md bg-background">
                  <SelectItem value="none">{section.advanced_options.tone.options.none}</SelectItem>
                    <SelectItem value="hopeful">{section.advanced_options.tone.options.hopeful}</SelectItem>
                    <SelectItem value="dark">{section.advanced_options.tone.options.dark}</SelectItem>
                    <SelectItem value="romantic">{section.advanced_options.tone.options.romantic}</SelectItem>
                    <SelectItem value="suspenseful">{section.advanced_options.tone.options.suspenseful}</SelectItem>
                    <SelectItem value="inspirational">{section.advanced_options.tone.options.inspirational}</SelectItem>
                    <SelectItem value="funny">{section.advanced_options.tone.options.funny}</SelectItem>
                    <SelectItem value="dramatic">{section.advanced_options.tone.options.dramatic}</SelectItem>
                    <SelectItem value="whimsical">{section.advanced_options.tone.options.whimsical}</SelectItem>
                    <SelectItem value="tragic">{section.advanced_options.tone.options.tragic}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                </div>
              </div>
            </details>
          </div>

          {/* Premium Generate Button */}
          <div>
            <div className="flex flex-col items-center gap-4">
              {/* Main generate button with glow effect */}
              <div className="relative group">
                {/* Animated glow */}
                <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-primary opacity-75 blur-xl transition-opacity duration-500 group-hover:opacity-100 animate-pulse anim-medium rounded-full will-change-opacity" />

                <Button
                  onClick={handleGenerateStory}
                  disabled={isGenerating || !prompt.trim() || !selectedModel}
                  className="relative w-full sm:w-auto min-w-[280px] h-14 rounded-full bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground text-base font-bold shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Icon name={isGenerating ? "RiLoader4Line" : "RiMagicLine"} className={`size-5 motion-safe:group-hover:rotate-12 transition-transform duration-300 ${isGenerating ? "animate-spin" : ""}`} />
                      <div className="absolute inset-0 bg-white/50 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <span>{isGenerating ? section.generate_button.generating : section.generate_button.text}</span>
                    {!isGenerating && <Icon name="RiArrowRightLine" className="size-5 group-hover:translate-x-1 transition-transform duration-300" />}
                  </div>
                </Button>
              </div>

              {/* Info below button */}
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-sm text-muted-foreground">
                {/* Credit cost */}
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
                    <Icon name="coins" className="size-3.5 text-primary" />
                  </div>
                  <span>
                    <span className="font-semibold text-foreground">{section.generate_button.info.credit}</span> {section.generate_button.info.credit_text}
                  </span>
                </div>

                {/* Divider */}
                <div className="hidden sm:block h-4 w-px bg-border" />

                {/* Generation time */}
                <div className="flex items-center gap-2">
                  <Icon name="clock" className="size-3.5 text-muted-foreground" />
                  <span>{section.generate_button.info.time}</span>
                </div>

                {/* Divider */}
                <div className="hidden sm:block h-4 w-px bg-border" />

                {/* Quality indicator */}
                <div className="flex items-center gap-2">
                  <Icon name="badge-check" className="size-3.5 text-green-500" />
                  <span className="text-green-600 dark:text-green-400 font-medium">{section.generate_button.info.quality}</span>
                </div>
              </div>

              {/* Tips or help text */}
              <div className="mt-2 text-center text-xs text-muted-foreground/70 max-w-md">
                <Icon name="RiLightbulbLine" className="size-3.5 inline mr-1" />
                {section.generate_button.tip}
              </div>
            </div>
          </div>

          {/* Generated Story Display Area */}
          {(isGenerating || generatedStory) && (
            <div className="mt-12 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:duration-500">
              <div className="relative group">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500 will-change-opacity" />

                {/* Story container */}
                <div className="relative rounded-2xl lg:rounded-3xl border-2 border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm shadow-2xl ring-1 ring-white/10 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-border/30 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <Icon name="RiBookOpenLine" className="size-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{section.output.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            {isGenerating ? section.output.status_writing : section.output.status_complete}
                          </span>
                          {/* Word count display */}
                          {generatedStory && (
                            <>
                              <span className="text-muted-foreground/40">•</span>
                              <div className="flex items-center gap-1.5">
                                <Icon name="RiFileTextLine" className="size-3.5" />
                                <span className="font-semibold text-foreground">
                                  {wordCount.toLocaleString()}
                                </span>
                                <span>{section.output.word_count.replace('{count}', String(wordCount))}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {generatedStory && !isGenerating && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedStory);
                            toast.success(section.toasts.success_copied);
                          }}
                          className="text-xs"
                        >
                          <Icon name="RiFileCopyLine" className="size-4 mr-1" />
                          {section.output.button_copy}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateStory}
                          className="text-xs"
                        >
                          <Icon name="RiRefreshLine" className="size-4 mr-1" />
                          {section.output.button_regenerate}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Story content */}
                  <div className="p-6 lg:p-8">
                    {isGenerating && !generatedStory ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <div className="relative">
                          <div className="size-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Icon name="RiQuillPenLine" className="size-6 text-primary" />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{section.output.loading}</p>
                      </div>
                    ) : (
                      <div className="prose prose-slate dark:prose-invert max-w-none">
                        <div className="text-base leading-relaxed whitespace-pre-wrap text-foreground/90">
                          {generatedStory}
                          {isGenerating && (
                            <span className="inline-block w-2 h-5 ml-1 bg-primary animate-pulse" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}