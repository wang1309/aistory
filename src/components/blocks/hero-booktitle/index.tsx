"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Icon from "@/components/icon";
import { toast } from "sonner";
import { HeroBooktitle as HeroBooktitleType } from "@/types/blocks/hero-booktitle";
import { useLocale } from "next-intl";
import BookTitleBreadcrumb from "./breadcrumb";
import { cn } from "@/lib/utils";
import TurnstileInvisible, { TurnstileInvisibleHandle } from "@/components/TurnstileInvisible";

const defaultToastMessages = {
  error_no_description: "Please describe your book.",
  error_description_too_short: "Description is too short (minimum 10 characters).",
  error_description_too_long: "Description is too long (maximum 1000 characters).",
  error_no_keywords: "Please include story-related keywords such as characters, genre, or conflict.",
  error_description_too_simple: "Please provide a more detailed description with at least 5 words.",
  error_description_repetitive: "Your description repeats itself—add more variety before generating titles.",
  error_no_meaningful_content: "Please provide meaningful text content.",
  error_generate_failed: "Failed to generate titles. Please try again.",
  error_max_retry_reached: "Maximum retry attempts reached. Please try again later.",
  error_copy_failed: "Unable to copy the title. Please copy it manually.",
  success_generated: "Titles generated successfully!",
  success_copied: "Title copied to clipboard!",
  success_saved: "Saved to history!",
  success_cleared: "History cleared!",
} as const;

type ToastMessages = typeof defaultToastMessages;

const STORY_KEYWORD_REGEX = /\b(story|tale|adventure|journey|quest|novel|book|narrative|plot|character|protagonist|hero|villain|conflict|resolution|ending|beginning|world|setting|theme|genre|fiction|fantasy|romance|mystery|thriller|drama|biography|memoir|guide|manual|tutorial|course|lesson|chapter|section|part|volume|series|trilogy|saga|epic|legend|myth|fable|parable|allegory|satire|comedy|tragedy|horror|suspense|action|adventure|discovery|exploration|transformation|growth|change|challenge|obstacle|struggle|triumph|success|failure|loss|gain|love|hate|friendship|betrayal|revenge|forgiveness|redemption|salvation|damnation|hope|despair|joy|sorrow|anger|fear|courage|bravery|wisdom|ignorance|truth|lies|secrets|mysteries|puzzles|riddles|clues|evidence|proof|discovery|invention|creation|destruction|birth|death|life|death|beginning|end|start|finish|war|peace|good|evil|right|wrong|justice|injustice|freedom|oppression|rich|poor|strong|weak|young|old|past|present|future|time|space|reality|dream|fantasy|imagination|creativity|logic|reason|emotion|feeling|thought|mind|body|soul|spirit|heart|brain|memory|forgetting|remembering|knowing|learning|teaching|helping|hurting|healing|breaking|fixing|building|destroying|making|taking|giving|receiving|sharing|keeping|losing|finding|hiding|seeking|searching|looking|seeing|hearing|listening|speaking|talking|whispering|shouting|singing|dancing|running|walking|standing|sitting|lying|sleeping|waking|living|dying|being|becoming|changing|staying|leaving|arriving|going|coming|entering|exiting|opening|closing|starting|stopping|beginning|ending|winning|losing|trying|failing|succeeding|achieving|reaching|missing|hitting|missing|catching|dropping|holding|letting|pulling|pushing|moving|staying|waiting|rushing|slowing|speeding|delaying|hurrying|resting|working|playing|laughing|crying|smiling|frowning|loving|hating|liking|disliking|wanting|needing|having|getting|giving|taking|making|doing|being|having|doing|making|getting|giving|taking|coming|going|staying|leaving|entering|exiting|opening|closing|starting|stopping)\b/i;

// ========== INTERFACES ==========

interface GeneratedTitle {
  id: string;
  title: string;
  copied: boolean;
  isVisible?: boolean;
  animationDelay?: number;
}

interface SavedTitleHistory {
  id: string;
  titles: string[];
  description: string;
  genre: string;
  tone: string;
  style: string;
  timestamp: number;
}

// ========== HELPER FUNCTIONS ==========

// LocalStorage helper for title history
class TitleHistoryStorage {
  private static readonly STORAGE_KEY = "book_title_history";
  private static readonly MAX_HISTORY_ITEMS = 10;

  static saveHistory(item: Omit<SavedTitleHistory, "id" | "timestamp">): void {
    try {
      const history = this.getHistory();
      const newItem: SavedTitleHistory = {
        ...item,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };

      history.unshift(newItem);
      const trimmedHistory = history.slice(0, this.MAX_HISTORY_ITEMS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error("Failed to save title history:", error);
    }
  }

  static getHistory(): SavedTitleHistory[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to get title history:", error);
      return [];
    }
  }

  static clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear title history:", error);
    }
  }
}

// ========== COMPONENT ==========

export default function HeroBooktitle({ section }: { section: HeroBooktitleType }) {
  const locale = useLocale();
  const toastMessages = useMemo<ToastMessages>(
    () => ({
      ...defaultToastMessages,
      ...(section.toasts as Partial<ToastMessages>),
    }),
    [section.toasts]
  );

  // Form state
  const [description, setDescription] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("none");
  const [selectedTone, setSelectedTone] = useState("none");
  const [selectedStyle, setSelectedStyle] = useState("none");

  // Generation state
  const [generatedTitles, setGeneratedTitles] = useState<GeneratedTitle[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);

  // Collapsible examples state
  const [isExamplesExpanded, setIsExamplesExpanded] = useState(false);

  // Auto-collapse examples when user starts typing
  useEffect(() => {
    if (description.trim()) {
      setIsExamplesExpanded(false);
    }
  }, [description]);

  // Progressive title reveal animation
  useEffect(() => {
    if (generatedTitles.length > 0 && !isGenerating) {
      // Start progressive reveal
      generatedTitles.forEach((titleObj, index) => {
        setTimeout(() => {
          setGeneratedTitles(prev =>
            prev.map(t =>
              t.id === titleObj.id ? { ...t, isVisible: true } : t
            )
          );
        }, titleObj.animationDelay);
      });
    }
  }, [generatedTitles.length, isGenerating]);

  // Example prompts for inspiration from translations
  const examplePrompts = useMemo(() => {
    if (!section.form?.examples) return [];

    return [
      {
        category: section.form.examples.categories.fantasy,
        prompts: section.form.examples.prompts.fantasy
      },
      {
        category: section.form.examples.categories.romance,
        prompts: section.form.examples.prompts.romance
      },
      {
        category: section.form.examples.categories.mystery_thriller,
        prompts: section.form.examples.prompts.mystery_thriller
      },
      {
        category: section.form.examples.categories.self_help,
        prompts: section.form.examples.prompts.self_help
      }
    ];
  }, [section.form?.examples]);

  // Set example prompt
  const setExamplePrompt = useCallback((prompt: string) => {
    setDescription(prompt);
  }, []);

  // Enhanced validation with content quality checks
  const validateForm = useCallback((): boolean => {
    const trimmedDescription = description.trim();

    if (!trimmedDescription) {
      toast.error(toastMessages.error_no_description);
      return false;
    }

    if (trimmedDescription.length < 10) {
      toast.error(toastMessages.error_description_too_short);
      return false;
    }

    if (trimmedDescription.length > 1000) {
      toast.error(toastMessages.error_description_too_long);
      return false;
    }

    const normalizedLocale = locale?.toLowerCase() || "en";
    const shouldApplyEnglishChecks = normalizedLocale === "en" || normalizedLocale.startsWith("en-");

    if (shouldApplyEnglishChecks) {
      if (!STORY_KEYWORD_REGEX.test(trimmedDescription)) {
        toast.error(toastMessages.error_no_keywords);
        return false;
      }

      const words = trimmedDescription.match(/\b(\w+)\b/gi) || [];

      if (words.length < 5) {
        toast.error(toastMessages.error_description_too_simple);
        return false;
      }

      const repeatedWordCount = words.filter((word, index, array) => {
        const lowerWord = word.toLowerCase();
        return array.findIndex(item => item.toLowerCase() === lowerWord) !== index && lowerWord.length > 3;
      }).length;

      if (repeatedWordCount >= words.length * 0.3) {
        toast.error(toastMessages.error_description_repetitive);
        return false;
      }
    }

    // Check for meaningful content (not just random characters)
    const hasMeaningfulContent = /\p{L}{3,}/u.test(trimmedDescription);
    if (!hasMeaningfulContent) {
      toast.error(toastMessages.error_no_meaningful_content);
      return false;
    }

    return true;
  }, [description, locale, toastMessages]);

  // Handle verification success - start title generation
  const handleVerificationSuccess = useCallback(async (turnstileToken: string) => {
    console.log("=== Starting title generation after verification ===");
    console.log("Description:", description.substring(0, 100));
    console.log("Genre:", selectedGenre);
    console.log("Tone:", selectedTone);
    console.log("Style:", selectedStyle);
    console.log("Turnstile token:", `Present (${turnstileToken.length} chars)`);

    try {
      setIsGenerating(true);
      setGeneratedTitles([]);

      const requestBody = {
        description: description.trim(),
        genre: selectedGenre,
        tone: selectedTone,
        style: selectedStyle !== "none" ? selectedStyle : undefined,
        locale,
        turnstileToken: turnstileToken,
      };

      console.log("=== Request body to API ===", JSON.stringify(requestBody, null, 2));

      const response = await fetch("/api/book-title-generate", {
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
        toast.error(errorData.message || toastMessages.error_generate_failed);
        return;
      }

      console.log("=== Starting to read stream ===");

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        console.log("=== No reader available ===");
        toast.error(toastMessages.error_generate_failed);
        return;
      }

      let accumulatedText = "";
      let chunkCount = 0;
      let buffer = ""; // Buffer for incomplete lines
      let tempTitles: string[] = [];

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
                console.log("=== Accumulated text length ===", accumulatedText.length);

                // Split by newlines to get individual titles
                const lines = accumulatedText.split("\n").filter(l => l.trim().length > 0);

                // Create title objects for display
                const newTitles: GeneratedTitle[] = lines.map((title, index) => ({
                  id: `title-${Date.now()}-${index}`,
                  title: title.trim(),
                  copied: false,
                }));

                // Update display in real-time
                setGeneratedTitles(newTitles);
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
        // Final processing: extract clean titles
        const finalTitles = accumulatedText
          .split("\n")
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .filter(line => !line.match(/^\d+[\.\)]/)) // Remove numbered lines
          .map(line => line.replace(/^[-•*]\s*/, "")) // Remove bullet points
          .map(line => line.replace(/^["']|["']$/g, "")) // Remove quotes
          .slice(0, 8); // Ensure we only have 8 titles

        const titlesForDisplay: GeneratedTitle[] = finalTitles.map((title, index) => ({
          id: `title-final-${Date.now()}-${index}`,
          title,
          copied: false,
          isVisible: false,
          animationDelay: index * 150, // 150ms delay between each title
        }));

        setGeneratedTitles(titlesForDisplay);
        toast.success(toastMessages.success_generated);

        // Save to history
        TitleHistoryStorage.saveHistory({
          titles: finalTitles,
          description: description.trim(),
          genre: selectedGenre,
          tone: selectedTone,
          style: selectedStyle,
        });
      } else {
        console.log("=== No titles were generated ===");
        const errorMessage = toastMessages.error_generate_failed;
        setLastError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Title generation failed:", error);
      const errorMessage = error instanceof Error ? error.message : toastMessages.error_generate_failed;
      setLastError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [description, selectedGenre, selectedTone, selectedStyle, locale, toastMessages]);

  // Invisible Turnstile success handler - delegate to generation logic
  const handleTurnstileSuccess = useCallback((turnstileToken: string) => {
    console.log("✓ Turnstile verification successful (Book Title)");
    handleVerificationSuccess(turnstileToken);
  }, [handleVerificationSuccess]);

  // Invisible Turnstile error handler
  const handleTurnstileError = useCallback(() => {
    console.error("❌ Turnstile verification failed (Book Title)");
    setIsGenerating(false);
    toast.error(toastMessages.error_generate_failed);
  }, [toastMessages]);

  // Generate titles handler - trigger invisible Turnstile verification
  const handleGenerate = useCallback(() => {
    if (!validateForm()) return;

    // Start loading state while Turnstile verification is in progress
    setIsGenerating(true);
    setLastError(null);

    // Trigger invisible Turnstile verification
    // After verification succeeds, handleTurnstileSuccess will be called automatically
    turnstileRef.current?.execute();
  }, [validateForm]);

  // Retry handler with exponential backoff
  const handleRetry = useCallback(async () => {
    if (retryCount >= 3) {
      toast.error(toastMessages.error_max_retry_reached);
      return;
    }

    const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
    toast.info(`Retrying in ${delay / 1000} seconds... (${retryCount + 1}/3)`);

    setTimeout(() => {
      setRetryCount(prev => prev + 1);
      setLastError(null);
      handleGenerate();
    }, delay);
  }, [retryCount, handleGenerate, toastMessages]);

  // Reset retry state on successful generation
  useEffect(() => {
    if (generatedTitles.length > 0 && !isGenerating) {
      setRetryCount(0);
      setLastError(null);
    }
  }, [generatedTitles.length, isGenerating]);

  // Copy title to clipboard
  const handleCopyTitle = useCallback(async (titleId: string, titleText: string) => {
    try {
      await navigator.clipboard.writeText(titleText);

      // Update copied state
      setGeneratedTitles(prev =>
        prev.map(t => ({
          ...t,
          copied: t.id === titleId ? true : t.copied
        }))
      );

      toast.success(toastMessages.success_copied);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setGeneratedTitles(prev =>
          prev.map(t => ({
            ...t,
            copied: t.id === titleId ? false : t.copied
          }))
        );
      }, 2000);
    } catch (error) {
      console.error("Failed to copy title:", error);
      toast.error(toastMessages.error_copy_failed);
    }
  }, [toastMessages]);

  // Clear all titles
  const handleClearTitles = useCallback(() => {
    setGeneratedTitles([]);
  }, []);

  // Character count for description
  const descriptionLength = useMemo(() => description.length, [description]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-emerald-500/30">
      {/* Premium Background Layer - Regal Variant */}
      <div className="fixed inset-0 -z-20 bg-noise opacity-[0.15] pointer-events-none mix-blend-overlay" />
      
      <div className="fixed inset-0 -z-30 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] animate-blob mix-blend-multiply dark:mix-blend-screen" />
         <div className="absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-screen" />
         <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-background rounded-full blur-[150px] opacity-80" />
      </div>

      <div className="w-full max-w-5xl mx-auto px-6 pt-16 pb-24 sm:pt-24 sm:pb-32 relative">
        {/* Breadcrumb Navigation */}
        <div className="mb-10 flex justify-start animate-fade-in-up">
          <div className="glass-premium px-6 py-2 rounded-full">
            <BookTitleBreadcrumb
              homeText={section.breadcrumb.home}
              currentText={section.breadcrumb.current}
            />
          </div>
        </div>

        {/* Enhanced Header */}
        <div className="relative text-center mb-20 animate-fade-in-up animation-delay-1000">
          <div className="inline-flex items-center justify-center mb-8">
            <div className="p-px bg-gradient-to-br from-emerald-500/20 to-transparent rounded-2xl">
              <div className="glass-premium rounded-2xl p-4 bg-background/50">
                <Icon name="RiBookOpenLine" className="size-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <h1 className="text-6xl sm:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 dark:from-emerald-200 dark:via-teal-200 dark:to-emerald-400 animate-shimmer">
              {section.header.title}
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-muted-foreground/80 max-w-2xl mx-auto font-light tracking-wide leading-relaxed">
            {section.header.subtitle}
          </p>
        </div>

        {/* Main Crystal Monolith */}
        <div className="glass-premium rounded-[3rem] p-1 overflow-hidden shadow-2xl shadow-emerald-500/10 dark:shadow-black/20 ring-1 ring-black/5 dark:ring-white/10 animate-fade-in-up animation-delay-2000 mb-24">
          <div className="bg-background/40 backdrop-blur-xl rounded-[calc(3rem-4px)] p-8 sm:p-16">
            
            <div className="max-w-3xl mx-auto space-y-12">
                {/* Description Field */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-xl font-medium tracking-tight flex items-center gap-3 text-foreground">
                      <span className="flex items-center justify-center size-8 rounded-full border border-black/10 dark:border-white/10 text-xs font-serif italic text-muted-foreground">01</span>
                      {section.form.description.label}
                    </label>
                    {section.form.description.required && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-red-500/80 bg-red-500/10 px-2 py-1 rounded-full">Required</span>
                    )}
                  </div>

                  <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, section.form.description.max_length))}
                      placeholder={section.form.description.placeholder}
                      className="relative min-h-[200px] w-full bg-transparent border-0 border-b border-black/10 dark:border-white/10 focus:border-emerald-500/50 focus:ring-0 rounded-none px-0 text-2xl sm:text-3xl font-light leading-snug placeholder:text-muted-foreground/30 text-foreground resize-none transition-all duration-300"
                      style={{ boxShadow: 'none' }}
                    />
                    <div className="absolute bottom-0 right-0 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                      {descriptionLength} / {section.form.description.max_length} CHARS
                    </div>
                  </div>

                  {/* Example Prompts - Simplified */}
                  {!description && (
                    <div className="mt-4">
                      <Collapsible open={isExamplesExpanded} onOpenChange={setIsExamplesExpanded}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-2 px-0">
                            <Icon name="RiLightbulbLine" className="size-3" />
                            {section.form.examples?.title || "Need inspiration?"}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4 animate-slide-down">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {examplePrompts.map((category, index) => (
                                <div key={index} className="space-y-2">
                                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{category.category}</div>
                                  <div className="space-y-1">
                                    {category.prompts.map((prompt, promptIndex) => (
                                      <button
                                        key={promptIndex}
                                        onClick={() => {
                                          setExamplePrompt(prompt);
                                          setTimeout(() => setIsExamplesExpanded(false), 300);
                                        }}
                                        className="w-full text-left p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all text-sm text-muted-foreground hover:text-foreground line-clamp-2"
                                      >
                                        {prompt}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}
                </div>

                {/* Options Grid */}
                <div className="pt-12 border-t border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-4 mb-8">
                    <span className="flex items-center justify-center size-8 rounded-full border border-black/10 dark:border-white/10 text-xs font-serif italic text-muted-foreground">02</span>
                    <h3 className="text-xl font-medium tracking-tight text-foreground">{section.header.subtitle || "Customize Style"}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    {/* Genre */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">
                        {section.form.genre.label}
                      </label>
                      <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                        <SelectTrigger className="h-12 rounded-xl bg-white/40 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-colors focus:ring-0 text-foreground">
                          <SelectValue placeholder={section.form.genre.placeholder} />
                        </SelectTrigger>
                        <SelectContent className="glass-premium rounded-xl bg-background/95 border-black/5 dark:border-white/10">
                          {Object.entries(section.form.genre.options).map(([key, value]) => (
                            <SelectItem key={key} value={key} className="cursor-pointer focus:bg-black/5 dark:focus:bg-white/10">
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tone */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">
                        {section.form.tone.label}
                      </label>
                      <Select value={selectedTone} onValueChange={setSelectedTone}>
                        <SelectTrigger className="h-12 rounded-xl bg-white/40 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-colors focus:ring-0 text-foreground">
                          <SelectValue placeholder={section.form.tone.placeholder} />
                        </SelectTrigger>
                        <SelectContent className="glass-premium rounded-xl bg-background/95 border-black/5 dark:border-white/10">
                          {Object.entries(section.form.tone.options).map(([key, value]) => (
                            <SelectItem key={key} value={key} className="cursor-pointer focus:bg-black/5 dark:focus:bg-white/10">
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Style */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">
                        {section.form.style.label}
                      </label>
                      <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                        <SelectTrigger className="h-12 rounded-xl bg-white/40 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-colors focus:ring-0 text-foreground">
                          <SelectValue placeholder={section.form.style.placeholder} />
                        </SelectTrigger>
                        <SelectContent className="glass-premium rounded-xl bg-background/95 border-black/5 dark:border-white/10">
                          {Object.entries(section.form.style.options).map(([key, value]) => (
                            <SelectItem key={key} value={key} className="cursor-pointer focus:bg-black/5 dark:focus:bg-white/10">
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Generate Action */}
                <div className="pt-12 flex flex-col items-center gap-8">
                  <div className="relative group w-full max-w-md">
                    <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-cyan-500/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="relative w-full h-20 rounded-full bg-foreground text-background hover:bg-white hover:text-black dark:hover:bg-white dark:hover:text-black hover:scale-[1.02] transition-all duration-500 text-lg font-bold tracking-wide shadow-2xl border-none"
                    >
                      {isGenerating ? (
                        <div className="flex items-center gap-3">
                          <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span className="animate-pulse">{section.generate_button.generating}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Icon name="RiSparklingLine" className="size-5" />
                          {section.generate_button.text}
                        </div>
                      )}
                    </Button>
                  </div>

                  {/* Info Pills */}
                  <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-full border border-black/5 dark:border-white/5">
                      <Icon name="RiCheckLine" className="size-3 text-emerald-500" />
                      {section.generate_button.info.free}
                    </span>
                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-full border border-black/5 dark:border-white/5">
                      <Icon name="RiTimeLine" className="size-3 text-blue-500" />
                      {section.generate_button.info.time}
                    </span>
                  </div>

                  {/* Error & Retry */}
                  {lastError && !isGenerating && (
                    <div className="w-full max-w-md p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-between animate-shake">
                      <span className="text-sm text-red-500 font-medium flex items-center gap-2">
                        <Icon name="RiErrorWarningLine" className="size-4" />
                        {lastError}
                      </span>
                      {retryCount < 3 && (
                        <Button onClick={handleRetry} variant="ghost" size="sm" className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10">
                          Retry
                        </Button>
                      )}
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>

        {/* Generated Titles Output */}
        {(generatedTitles.length > 0 || isGenerating) && (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-12 px-4">
              <div className="flex items-center gap-4">
                 <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <Icon name="RiStarLine" className="size-6 text-emerald-600 dark:text-emerald-400" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-bold tracking-tight text-foreground">{section.output.title}</h3>
                    <p className="text-sm text-muted-foreground/60">{section.output.subtitle}</p>
                 </div>
              </div>
              {generatedTitles.length > 0 && (
                <Button
                  onClick={handleClearTitles}
                  variant="ghost"
                  className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full"
                >
                  <Icon name="RiCloseLine" className="size-4 mr-2" />
                  {section.output.clear_button}
                </Button>
              )}
            </div>

            {isGenerating ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="h-32 rounded-[2rem] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 overflow-hidden relative">
                     <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent animate-shimmer" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generatedTitles.map((titleObj, index) => (
                  <div
                    key={titleObj.id}
                    className={cn(
                      "group relative p-8 rounded-[2rem] bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-emerald-500/30 hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl",
                      titleObj.isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                    )}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex items-start gap-6">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-sm font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-500">
                            {index + 1}
                          </div>
                          <p className="text-2xl font-medium text-foreground/90 leading-tight tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300 font-serif">
                            {titleObj.title}
                          </p>
                      </div>
                      <Button
                        onClick={() => handleCopyTitle(titleObj.id, titleObj.title)}
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "flex-shrink-0 h-12 w-12 rounded-full transition-all duration-300",
                          titleObj.copied 
                            ? "bg-green-500 text-white shadow-lg shadow-green-500/20 scale-110" 
                            : "bg-black/5 dark:bg-white/5 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100"
                        )}
                      >
                        {titleObj.copied ? <Icon name="RiCheckLine" className="size-5" /> : <Icon name="RiFileCopyLine" className="size-5" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Invisible Turnstile for non-interactive verification */}
      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={handleTurnstileSuccess}
        onError={handleTurnstileError}
      />
    </section>
  );
}
