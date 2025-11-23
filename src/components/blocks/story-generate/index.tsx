"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/icon";
import { toast } from "sonner";
import { StoryGenerate as StoryGenerateType } from "@/types/blocks/story-generate";
import { useLocale } from "next-intl";
import { exportStoryToPdf, StoryMetadata } from "@/lib/pdf-export";
import { useAppContext } from "@/contexts/app";
import confetti from "canvas-confetti";
import { StoryStorage, SavedStory } from "@/lib/story-storage";
import StoryHistoryDropdown from "@/components/story-history-dropdown";
import StoryShareButtons from "@/components/story-share-buttons";

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
   const locale = useLocale(); // 获取当前语言
  const { user, setShowVerificationModal, setVerificationCallback } = useAppContext();
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

  const LANGUAGE_OPTIONS = useMemo(() => section.prompt.language_options, [section]);

  const STORY_PRESETS = useMemo(() => [
    { emoji: '🏰', title: section.presets.items.fantasy_quest.title, desc: section.presets.items.fantasy_quest.desc },
    { emoji: '🚀', title: section.presets.items.scifi_thriller.title, desc: section.presets.items.scifi_thriller.desc },
    { emoji: '💕', title: section.presets.items.love_story.title, desc: section.presets.items.love_story.desc },
    { emoji: '🕵️', title: section.presets.items.crime_mystery.title, desc: section.presets.items.crime_mystery.desc }
  ], [section]);

  const AI_MODELS = useMemo(() => [
    {
      id: 'fast',
      name: section.ai_models.models.fastest.name,
      badge: section.ai_models.models.fastest.badge,
      badgeColor: 'bg-green-500/10 text-green-600 border-green-500/30',
      icon: '⚡',
      speed: section.ai_models.models.fastest.speed,
      description: section.ai_models.models.fastest.description
    },
    {
      id: 'standard',
      name: section.ai_models.models.eloquent.name,
      badge: section.ai_models.models.eloquent.badge,
      badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      icon: '✒️',
      speed: section.ai_models.models.eloquent.speed,
      description: section.ai_models.models.eloquent.description
    },
    {
      id: 'creative',
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
  const [selectedPerspective, setSelectedPerspective] = useState("none");
  const [selectedAudience, setSelectedAudience] = useState("none");
  const [selectedTone, setSelectedTone] = useState("none");
  const [selectedLanguage, setSelectedLanguage] = useState(locale);

  // Use ref to store latest advanced options values to avoid stale closure
  const advancedOptionsRef = useRef({
    format: "none",
    length: "none",
    genre: "none",
    perspective: "none",
    audience: "none",
    tone: "none",
    language: locale
  });

  // Update ref whenever advanced options change
  useEffect(() => {
    advancedOptionsRef.current = {
      format: selectedFormat,
      length: selectedLength,
      genre: selectedGenre,
      perspective: selectedPerspective,
      audience: selectedAudience,
      tone: selectedTone,
      language: selectedLanguage
    };
  }, [selectedFormat, selectedLength, selectedGenre, selectedPerspective, selectedAudience, selectedTone, selectedLanguage]);

  // Wrapped setters with debug logging
  const handleFormatChange = useCallback((value: string) => {
    console.log(`📝 Format changed: "${selectedFormat}" → "${value}"`);
    setSelectedFormat(value);
  }, [selectedFormat]);

  const handleLengthChange = useCallback((value: string) => {
    console.log(`📏 Length changed: "${selectedLength}" → "${value}"`);
    setSelectedLength(value);
  }, [selectedLength]);

  const handleGenreChange = useCallback((value: string) => {
    console.log(`🎭 Genre changed: "${selectedGenre}" → "${value}"`);
    setSelectedGenre(value);
  }, [selectedGenre]);

  const handlePerspectiveChange = useCallback((value: string) => {
    console.log(`👁️ Perspective changed: "${selectedPerspective}" → "${value}"`);
    setSelectedPerspective(value);
  }, [selectedPerspective]);

  const handleAudienceChange = useCallback((value: string) => {
    console.log(`👥 Audience changed: "${selectedAudience}" → "${value}"`);
    setSelectedAudience(value);
  }, [selectedAudience]);

  const handleToneChange = useCallback((value: string) => {
    console.log(`🎨 Tone changed: "${selectedTone}" → "${value}"`);
    setSelectedTone(value);
  }, [selectedTone]);

  const handleLanguageChange = useCallback((value: string) => {
    console.log(`🌐 Language changed: "${selectedLanguage}" → "${value}"`);
    setSelectedLanguage(value);
  }, [selectedLanguage]);

  // Story generation state
  const [generatedStory, setGeneratedStory] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // PDF export state
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Calculate word count (memoized for performance)
  const wordCount = useMemo(() => calculateWordCount(generatedStory), [generatedStory]);

  // Calculate number of selected advanced options (not "none")
  const selectedOptionsCount = useMemo(() => {
    let count = 0;
    if (selectedFormat !== "none") count++;
    if (selectedLength !== "none") count++;
    if (selectedGenre !== "none") count++;
    if (selectedPerspective !== "none") count++;
    if (selectedAudience !== "none") count++;
    if (selectedTone !== "none") count++;
    return count;
  }, [selectedFormat, selectedLength, selectedGenre, selectedPerspective, selectedAudience, selectedTone]);

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
  }, [PRESET_TEMPLATES]);

  // Random prompt generator
  const handleRandomPrompt = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * RANDOM_PROMPTS.length);
    setPrompt(RANDOM_PROMPTS[randomIndex]);
  }, [RANDOM_PROMPTS]);

  // Confetti celebration for first-time story generation
  const triggerFirstTimeConfetti = useCallback(() => {
    // Check if user has generated a story before
    const hasGeneratedBefore = localStorage.getItem('hasGeneratedStory');

    if (!hasGeneratedBefore) {
      // Trigger confetti animation
      confetti({
        particleCount: 200,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
        startVelocity: 30,
        gravity: 1,
        scalar: 1.2,
        ticks: 300
      });

      // Mark as generated
      localStorage.setItem('hasGeneratedStory', 'true');

      return true; // Return whether this is first time
    }

    return false;
  }, []);

  // Handle clicking the generate button - show verification modal first
  const handleGenerateClick = useCallback(() => {
    // Validation
    if (!prompt.trim()) {
      toast.error(section.toasts.error_no_prompt);
      return;
    }

    if (!selectedModel) {
      toast.error(section.toasts.error_no_model);
      return;
    }

    // Set verification callback and show modal
    setVerificationCallback(() => handleVerificationSuccess);
    setShowVerificationModal(true);
  }, [prompt, selectedModel, section, setShowVerificationModal, setVerificationCallback]);
  // Note: handleVerificationSuccess is NOT in deps because it's defined below
  // and using ref for advanced options prevents stale closure issues

  // Handle verification success - start story generation
  const handleVerificationSuccess = useCallback(async (turnstileToken: string) => {
    console.log("=== Starting story generation after verification ===");

    // Get latest advanced options from ref (to avoid stale closure)
    const latestOptions = advancedOptionsRef.current;

    console.log("=== CURRENT STATE - All Options ===");
    console.log({
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      promptLength: prompt.length,
      selectedModel,
      advancedOptions: latestOptions,
      locale,
      turnstileToken: `Present (${turnstileToken.length} chars)`
    });
    console.log("⚠️ Note: If all advancedOptions are 'none', they won't affect the generated prompt");

    try {
      setIsGenerating(true);
      setGeneratedStory("");

      const requestBody = {
        prompt: prompt.trim(),
        model: selectedModel,
        locale: locale,
        outputLanguage: latestOptions.language,
        format: latestOptions.format,
        length: latestOptions.length,
        genre: latestOptions.genre,
        perspective: latestOptions.perspective,
        audience: latestOptions.audience,
        tone: latestOptions.tone,
        turnstileToken: turnstileToken,
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
        console.log("=== Response not OK ===");
        const errorData = await response.json();
        console.log("Error data:", errorData);
        toast.error(errorData.message || section.toasts.error_generate_failed);
        return;
      }

      console.log("=== Starting to read stream ===");

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        console.log("=== No reader available ===");
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
              console.log("JSON Parse error:", e, "Line:", line.substring(0, 100));
            }
          }
        }
      }

      console.log("=== Final accumulated text length ===", accumulatedText.length);

      if (accumulatedText.trim()) {
        // Check if this is first time and trigger confetti
        const isFirstTime = triggerFirstTimeConfetti();

        // Save story to LocalStorage
        try {
          const selectedModelName = AI_MODELS.find(m => m.id === selectedModel)?.name || '';
          StoryStorage.saveStory({
            title: prompt.substring(0, 30) + (prompt.length > 30 ? '...' : ''),
            prompt: prompt,
            content: accumulatedText,
            wordCount: calculateWordCount(accumulatedText),
            model: selectedModelName,
            format: latestOptions.format !== 'none' ? latestOptions.format : undefined,
            genre: latestOptions.genre !== 'none' ? latestOptions.genre : undefined,
            tone: latestOptions.tone !== 'none' ? latestOptions.tone : undefined,
          });
        } catch (error) {
          console.log('Failed to save story:', error);
        }

        if (isFirstTime) {
          // Special celebration message for first-time success
          toast.success('🎉 ' + section.toasts.success_generated, {
            duration: 5000,
            description: locale === 'zh' ? '你的第一个AI故事诞生了!' :
                        locale === 'ja' ? '最初のAIストーリーが誕生しました!' :
                        locale === 'ko' ? '첫 번째 AI 스토리가 탄생했습니다!' :
                        locale === 'de' ? 'Ihre erste KI-Geschichte wurde erstellt!' :
                        'Your first AI story is born!'
          });
        } else {
          // Regular success message
          toast.success(section.toasts.success_generated);
        }
      } else {
        console.log("=== No story content was generated ===");
        toast.error(section.toasts.error_no_content);
      }
    } catch (error) {
      console.log("=== Story generation error ===", error);
      toast.error(section.toasts.error_generate_failed);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedModel, locale, section, AI_MODELS, triggerFirstTimeConfetti]);
  // Note: advancedOptions are accessed via ref, so not in dependency array

  // PDF export handler
  const handleExportPdf = useCallback(async () => {
    if (!generatedStory.trim()) {
      toast.error(section.toasts.error_no_content);
      return;
    }

    try {
      setIsExportingPdf(true);

      // 获取选中模型的名称
      const selectedModelName = AI_MODELS.find(model => model.id === selectedModel)?.name || '';

      // 准备PDF元数据
      const metadata: StoryMetadata = {
        title: section.output.title || 'AI Generated Story',
        prompt: prompt.substring(0, 200) + (prompt.length > 200 ? '...' : ''),
        wordCount: wordCount,
        generatedAt: new Date(),
        model: selectedModelName,
        format: selectedFormat !== 'none' ? selectedFormat : undefined,
        genre: selectedGenre !== 'none' ? selectedGenre : undefined,
        tone: selectedTone !== 'none' ? selectedTone : undefined,
      };

      // 准备PDF翻译
      const pdfTranslations = {
        generated_at: section.pdf.generated_at,
        word_count_label: section.pdf.word_count_label,
        ai_model: section.pdf.ai_model,
        story_format: section.pdf.story_format,
        story_genre: section.pdf.story_genre,
        story_tone: section.pdf.story_tone,
        prompt: section.pdf.prompt,
        footer_text: section.pdf.footer_text,
        page_indicator: section.pdf.page_indicator,
      };

      // 导出PDF (传递locale和翻译)
      await exportStoryToPdf(generatedStory, metadata, locale, pdfTranslations, (progress) => {
        console.log(`PDF export progress: ${progress}%`);
      });

      toast.success(section.toasts.success_pdf_exported);

    } catch (error) {
      console.log('PDF export failed:', error);
      toast.error(section.toasts.error_pdf_export_failed);
    } finally {
      setIsExportingPdf(false);
    }
  }, [generatedStory, prompt, wordCount, selectedModel, selectedFormat, selectedGenre, selectedTone, locale, section]);

  // Load story from history
  const handleLoadStory = useCallback((story: SavedStory) => {
    // Load prompt and story content
    setPrompt(story.prompt);
    setGeneratedStory(story.content);

    // Load model selection
    const modelToSelect = AI_MODELS.find(m => m.name === story.model);
    if (modelToSelect) {
      setSelectedModel(modelToSelect.id);
    }

    // Load parameters
    if (story.format) setSelectedFormat(story.format);
    if (story.genre) setSelectedGenre(story.genre);
    if (story.tone) setSelectedTone(story.tone);

    // Show success toast
    toast.success(
      locale === 'zh' ? '故事已加载' :
      locale === 'ja' ? 'ストーリーを読み込みました' :
      locale === 'ko' ? '스토리가 로드되었습니다' :
      locale === 'de' ? 'Geschichte geladen' :
      'Story loaded'
    );
  }, [AI_MODELS, locale]);

  // Share translations
  const shareTranslations = useMemo(() => ({
    title: locale === 'zh' ? '分享' : locale === 'ja' ? '共有' : 'Share',
    copy_link: locale === 'zh' ? '复制链接' : locale === 'ja' ? 'リンクをコピー' : 'Copy Link',
    share_twitter: 'Twitter',
    share_facebook: 'Facebook',
    share_linkedin: 'LinkedIn',
    link_copied: locale === 'zh' ? '链接已复制' : locale === 'ja' ? 'リンクをコピーしました' : 'Link copied!',
    share_text_template: locale === 'zh' ? '我用AI写了一个 {wordCount} 字的故事！' : locale === 'ja' ? 'AIで{wordCount}文字の物語を書きました！' : 'I wrote a {wordCount} word story with AI!',
  }), [locale]);

  // ========== RENDER ==========

  return (
    <section className="min-h-screen relative overflow-hidden bg-background text-foreground selection:bg-indigo-500/30">
      {/* Premium Background Layer - Deep Space Variant */}
      <div className="absolute inset-0 -z-20 bg-noise opacity-[0.15] pointer-events-none mix-blend-overlay" />
      
      <div className="absolute inset-0 -z-30 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] left-[20%] w-[700px] h-[700px] bg-indigo-500/20 rounded-full blur-[120px] animate-blob mix-blend-multiply dark:mix-blend-screen" />
         <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-screen" />
         <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-background rounded-full blur-[150px] opacity-80" />
      </div>

      <div className="w-full max-w-6xl mx-auto px-6 py-24 sm:py-32 relative">
      
      {/* Minimalist Header */}
      <div className="relative text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center mb-8">
          <div className="p-px bg-gradient-to-br from-indigo-500/20 to-transparent rounded-2xl">
            <div className="glass-premium rounded-2xl p-4 bg-background/50">
               <Icon name="book" className="size-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-8 leading-[0.9]">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 via-violet-600 to-indigo-700 dark:from-white dark:via-indigo-200 dark:to-indigo-400 animate-shimmer">
            {section.header.title}
          </span>
        </h1>
        
        <p className="text-xl sm:text-2xl text-muted-foreground/80 dark:text-muted-foreground/90 max-w-2xl mx-auto font-light tracking-wide leading-relaxed mb-8 sm:mb-8">
          {section.header.subtitle}
        </p>
      </div>

      {/* Main Studio - Crystal Monolith */}
      <div className="relative animate-fade-in-up animation-delay-1000">
        <div className="glass-premium rounded-[3rem] p-1 overflow-hidden shadow-2xl shadow-indigo-500/10 dark:shadow-black/20 ring-1 ring-black/5 dark:ring-white/10">
          <div className="bg-background/40 backdrop-blur-xl rounded-[calc(3rem-4px)] grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
            
            {/* Editor (8 cols) */}
            <div className="lg:col-span-8 p-8 sm:p-16 lg:border-r border-black/5 dark:border-white/5">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <span className="flex items-center justify-center size-8 rounded-full border border-black/10 dark:border-white/10 text-xs font-serif italic text-muted-foreground dark:text-muted-foreground/80">01</span>
                  <label className="text-xl font-medium tracking-tight text-foreground">
                    {section.prompt.label}
                  </label>
                </div>
                <button
                  onClick={handleRandomPrompt}
                  type="button"
                  className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 text-sm font-medium transition-all duration-300"
                >
                  <Icon name="sparkles" className="size-4 text-indigo-500 group-hover:rotate-12 transition-transform" />
                  <span className="text-muted-foreground dark:text-muted-foreground/80 group-hover:text-foreground dark:group-hover:text-foreground transition-colors">{section.prompt.random_button}</span>
                </button>
              </div>

              <div className="relative group mb-8">
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 2000))}
                  placeholder={section.prompt.placeholder}
                  className="relative w-full min-h-[350px] bg-transparent border-0 border-b border-black/10 dark:border-white/10 focus:border-indigo-500/50 focus:ring-0 rounded-none px-0 text-2xl sm:text-3xl font-light leading-snug placeholder:text-muted-foreground/30 dark:placeholder:text-muted-foreground/50 text-foreground resize-none transition-all duration-300"
                  style={{ boxShadow: 'none' }}
                />
                <div className="absolute bottom-0 right-0 py-2 text-xs font-medium text-muted-foreground/40 dark:text-muted-foreground/70 tracking-widest uppercase">
                  {prompt.length} / 2000 CHARS
                </div>
              </div>

              {/* Quick Chips - Refined */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 dark:text-muted-foreground/80 mr-2">
                  {section.prompt.quick_adds_label}
                </span>
                {QUICK_ADD_CHIPS.map((chip, i) => (
                  <button
                    key={chip}
                    onClick={() => handleQuickAdd(chip)}
                    className="px-4 py-1.5 rounded-full text-xs font-medium bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 text-muted-foreground hover:text-foreground dark:text-muted-foreground/80 dark:hover:text-foreground transition-all duration-300"
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              {/* Language Bar - Minimal */}
              <div className="mt-12 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <span className="flex items-center justify-center size-8 rounded-full border border-black/10 dark:border-white/10 text-xs font-serif italic text-muted-foreground">02</span>
                   <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground/80">{section.prompt.language_label}</span>
                   <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                     <SelectTrigger className="w-auto border-0 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 rounded-full gap-2 px-4 text-base font-medium focus:ring-0 text-foreground">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="glass-premium rounded-2xl p-2 min-w-[200px] bg-background/95 backdrop-blur-xl border-black/5 dark:border-white/10">
                       {Object.entries(LANGUAGE_OPTIONS).map(([code, option]) => (
                         <SelectItem key={code} value={code} className="rounded-xl my-1 cursor-pointer focus:bg-black/5 dark:focus:bg-white/10">
                           <span className="mr-3 text-lg opacity-80">{option.flag}</span>
                           <span className="font-medium tracking-wide">{option.native}</span>
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
              </div>
            </div>

            {/* Sidebar (4 cols) */}
            <div className="lg:col-span-4 bg-black/5 dark:bg-black/20 backdrop-blur-sm p-8 sm:p-12 border-t lg:border-t-0 lg:border-l border-black/5 dark:border-white/5">
              <div className="sticky top-12 space-y-10">
                
                {/* History */}
                <div className="flex items-center justify-between pb-8 border-b border-black/5 dark:border-white/5">
                   <h3 className="text-xs font-bold text-muted-foreground/50 dark:text-muted-foreground/80 uppercase tracking-[0.2em]">
                     {locale === 'zh' ? '历史记录' : 'HISTORY'}
                   </h3>
                   <StoryHistoryDropdown 
                     onLoadStory={handleLoadStory}
                     locale={locale}
                   />
                </div>

                {/* Presets */}
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground/50 dark:text-muted-foreground/80 uppercase tracking-[0.2em] mb-6">
                    {section.presets.title}
                  </h3>
                  <div className="space-y-4">
                    {STORY_PRESETS.map((preset) => (
                      <button
                        key={preset.title}
                        onClick={() => handlePresetClick(preset)}
                        className="group w-full text-left p-5 rounded-2xl bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/20 transition-all duration-300 shadow-sm dark:shadow-none"
                      >
                        <div className="flex items-start gap-4">
                          <span className="text-2xl opacity-70 dark:opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 filter grayscale group-hover:grayscale-0">
                            {preset.emoji}
                          </span>
                          <div>
                            <div className="font-medium text-foreground/80 dark:text-foreground/95 group-hover:text-foreground transition-colors tracking-wide">
                              {preset.title}
                            </div>
                            <div className="text-xs text-muted-foreground/60 dark:text-white/90 mt-1 font-light tracking-wide">
                              {preset.desc}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced Options */}
                <div className="pt-8 border-t border-black/5 dark:border-white/5">
                   <details className="group">
                     <summary className="list-none flex items-center justify-between cursor-pointer py-2">
                       <div className="flex items-center gap-3">
                         <Icon name="sliders" className="size-4 text-muted-foreground" />
                         <span className="text-sm font-semibold tracking-wide text-foreground/80 dark:text-foreground/95 group-hover:text-foreground transition-colors">
                           {section.advanced_options.title}
                         </span>
                       </div>
                       <Icon name="chevron-down" className="size-4 text-muted-foreground/50 dark:text-muted-foreground/80 group-open:rotate-180 transition-transform duration-300" />
                     </summary>
                     
                     <div className="mt-6 space-y-5 animate-fade-in-down">
                        {[
                          { label: section.advanced_options.format.label, value: selectedFormat, setter: handleFormatChange, opts: section.advanced_options.format.options },
                          { label: section.advanced_options.genre.label, value: selectedGenre, setter: handleGenreChange, opts: section.advanced_options.genre.options },
                          { label: section.advanced_options.tone.label, value: selectedTone, setter: handleToneChange, opts: section.advanced_options.tone.options },
                          { label: section.advanced_options.perspective.label, value: selectedPerspective, setter: handlePerspectiveChange, opts: section.advanced_options.perspective.options },
                          { label: section.advanced_options.audience.label, value: selectedAudience, setter: handleAudienceChange, opts: section.advanced_options.audience.options },
                          { label: section.advanced_options.length.label, value: selectedLength, setter: handleLengthChange, opts: section.advanced_options.length.options }
                        ].map((field, i) => (
                          <div key={i} className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground/40 dark:text-muted-foreground/70 uppercase tracking-widest ml-1">{field.label}</label>
                            <Select value={field.value} onValueChange={field.setter}>
                              <SelectTrigger className="w-full bg-white/40 dark:bg-white/5 border-black/5 dark:border-white/5 rounded-xl text-sm hover:bg-white/60 dark:hover:bg-white/10 transition-colors focus:ring-0 text-foreground">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="glass-premium rounded-xl bg-background/95 border-black/5 dark:border-white/10">
                                {Object.entries(field.opts).map(([k, v]) => (
                                  <SelectItem key={k} value={k === 'funny' ? 'humorous' : k} className="text-sm cursor-pointer focus:bg-black/5 dark:focus:bg-white/10">{v}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                     </div>
                   </details>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Selection - Obsidian Cards */}
      <div className="space-y-10 animate-fade-in-up animation-delay-2000">
        <div className="flex items-center gap-4 mt-[30px]">
          <span className="flex items-center justify-center size-8 rounded-full border border-black/10 dark:border-white/10 text-xs font-serif italic text-muted-foreground dark:text-muted-foreground/80">03</span>
          <h3 className="text-xl font-medium text-foreground tracking-tight">
             {section.ai_models.title}
          </h3>
          <div className="h-px flex-1 bg-gradient-to-r from-black/10 dark:from-white/10 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {AI_MODELS.map((model) => {
            const isSelected = selectedModel === model.id;
            return (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`
                  relative group p-8 rounded-[2rem] text-left transition-all duration-500
                  ${isSelected 
                    ? 'bg-indigo-50 dark:bg-black/60 ring-1 ring-indigo-500 dark:ring-white/20 shadow-2xl shadow-indigo-500/20 dark:shadow-black/50' 
                    : 'bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10'
                  }
                `}
              >
                <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
                   {isSelected && <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-500/20 blur-[80px]" />}
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-8">
                    <span className={`text-4xl ${isSelected ? 'opacity-100' : 'opacity-50 grayscale group-hover:grayscale-0 transition-all'}`}>
                      {model.icon}
                    </span>
                    {isSelected && (
                      <div className="size-6 rounded-full bg-indigo-500 flex items-center justify-center">
                        <Icon name="check" className="size-3.5 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-auto space-y-3">
                    <h4 className={`text-lg font-bold tracking-tight ${isSelected ? 'text-indigo-900 dark:text-white' : 'text-foreground/70 dark:text-foreground/80 group-hover:text-foreground dark:group-hover:text-foreground'}`}>
                      {model.name}
                    </h4>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground/90 leading-relaxed font-medium">
                      {model.description}
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${model.badgeColor}`}>
                        {model.badge}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 dark:text-muted-foreground/80 font-medium">
                        {model.speed}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center pt-8 animate-fade-in-up animation-delay-3000">
         <div className="relative group w-full max-w-md">
          <Button
            onClick={handleGenerateClick}
            className="relative w-full h-20 rounded-full overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] animate-gradient text-white shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 text-xl font-bold tracking-wide border-none group/btn"
          >
             {/* Shimmer Overlay */}
             <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer pointer-events-none" />
             
             {/* Noise Texture */}
             <div className="absolute inset-0 bg-noise opacity-20 mix-blend-overlay pointer-events-none" />

             <div className="relative z-10 flex items-center justify-center gap-3">
                {isGenerating ? (
                  <>
                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="animate-pulse">{section.generate_button.generating}</span>
                  </>
                ) : (
                  <>
                    <Icon name="sparkles" className="size-6 group-hover/btn:animate-pulse text-indigo-100" />
                    <span>{section.generate_button.text}</span>
                    <Icon name="arrow-right" className="size-5 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300" />
                  </>
                )}
             </div>
           </Button>
           
           {/* Usage Hints */}
           <div className="mt-8 space-y-5 animate-fade-in-up animation-delay-3000">
             {/* Features Row */}
             <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground dark:text-muted-foreground/90">
               <div className="flex items-center gap-2">
                 <div className="size-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)] animate-pulse" />
                 <span><strong className="text-foreground/80 dark:text-foreground/90">{locale === 'zh' ? '免费额度' : 'Free Credit'}</strong> per story</span>
               </div>
               <div className="hidden sm:block w-px h-3 bg-black/10 dark:bg-white/10" />
               <div>
                 {locale === 'zh' ? '预计耗时: ~10秒' : 'Estimated: ~10 seconds'}
               </div>
               <div className="hidden sm:block w-px h-3 bg-black/10 dark:bg-white/10" />
               <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                 {locale === 'zh' ? '优质内容' : 'Premium Quality'}
               </div>
             </div>

             {/* Pro Tip */}
             <div className="flex items-start sm:items-center justify-center gap-2 text-xs text-muted-foreground/70 dark:text-muted-foreground/90 max-w-lg mx-auto text-center leading-relaxed px-4">
               <Icon name="lightbulb" className="size-3.5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
               <span>
                 <span className="font-semibold text-foreground/80 dark:text-foreground/90">{locale === 'zh' ? '提示:' : 'Tip:'}</span> {locale === 'zh' ? '提供具体的提示词可以获得更好的结果。您可以随时优化并重新生成！' : 'Be specific in your prompt for better results. You can always refine and regenerate!'}
               </span>
             </div>
           </div>
         </div>
      </div>

      {/* Generated Story Output */}
      {(isGenerating || generatedStory) && (
        <div className="mt-24 animate-fade-in-up">
          <div className="glass-premium rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between p-8 md:p-10 border-b border-black/5 dark:border-white/5 bg-white/40 dark:bg-white/5 gap-6">
              <div className="flex items-center gap-5">
                 <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-black/5 dark:border-white/10">
                   <Icon name="book-open" className="size-6 text-indigo-600 dark:text-indigo-400" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold tracking-tight text-foreground">{section.output.title}</h3>
                    {generatedStory && (
                      <div className="text-sm text-muted-foreground/60 dark:text-muted-foreground/80 font-light mt-1">
                        {wordCount.toLocaleString()} words • {section.output.status_complete}
                      </div>
                    )}
                 </div>
              </div>
              
              {generatedStory && !isGenerating && (
                <div className="flex items-center gap-3 flex-wrap justify-center">
                   <Button variant="ghost" size="sm" onClick={handleGenerateClick} className="rounded-full h-10 px-4 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground dark:text-muted-foreground/80 dark:hover:text-foreground border border-black/5 dark:border-white/5">
                     <Icon name="refresh-cw" className="size-4 mr-2" /> {locale === 'zh' ? '重新生成' : 'Regenerate'}
                   </Button>

                   <StoryShareButtons 
                     storyTitle={section.output.title}
                     wordCount={wordCount}
                     model={AI_MODELS.find(m => m.id === selectedModel)?.name || 'AI'}
                     locale={locale}
                     inviteCode={user?.invite_code}
                     translations={shareTranslations}
                   />

                   <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1" />

                   <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(generatedStory); toast.success(section.toasts.success_copied); }} className="rounded-full h-10 px-4 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground dark:text-muted-foreground/80 dark:hover:text-foreground border border-black/5 dark:border-white/5">
                     <Icon name="copy" className="size-4 mr-2" /> {section.output.button_copy}
                   </Button>
                   <Button variant="ghost" size="sm" onClick={handleExportPdf} disabled={isExportingPdf} className="rounded-full h-10 px-4 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground border border-black/5 dark:border-white/5">
                     <Icon name="download" className="size-4 mr-2" /> PDF
                   </Button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-8 md:p-16 bg-white/20 dark:bg-black/20 min-h-[400px]">
              {isGenerating && !generatedStory ? (
                <div className="h-full flex flex-col items-center justify-center gap-6 py-20">
                   <div className="relative size-20">
                     <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                     <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                     <Icon name="pen-tool" className="absolute inset-0 m-auto size-6 text-indigo-500 animate-pulse" />
                   </div>
                   <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground/60 dark:text-muted-foreground/80 animate-pulse">
                     {section.output.loading}
                   </p>
                </div>
              ) : (
                <div className="prose prose-lg md:prose-xl dark:prose-invert max-w-4xl mx-auto font-serif leading-loose tracking-wide text-foreground">
                   <div className="whitespace-pre-wrap">
                      {generatedStory}
                      {isGenerating && <span className="inline-block w-2 h-6 ml-1 bg-indigo-500 animate-pulse" />}
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  </section>
  );
}