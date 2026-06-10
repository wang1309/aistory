"use client";

import GeneratorNavTabs from "@/components/generator-nav-tabs";
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
import { useGeneratorShortcuts } from "@/hooks/useGeneratorShortcuts";
import { GeneratorShortcutHints } from "@/components/generator-shortcut-hints";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";

const isDev = process.env.NODE_ENV === "development";
const devLog = (...args: any[]) => {
  if (isDev) {
    console.log(...args);
  }
};

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
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  useDraftAutoSave({
    key: `book-title-generator:description:${locale}`,
    value: description,
    onRestore: (draft) => setDescription(draft),
  });

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
    devLog("=== Starting title generation after verification ===");
    devLog("Description:", description.substring(0, 100));
    devLog("Genre:", selectedGenre);
    devLog("Tone:", selectedTone);
    devLog("Style:", selectedStyle);
    devLog("Turnstile token:", `Present (${turnstileToken.length} chars)`);

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

      devLog("=== Request body to API ===", JSON.stringify(requestBody, null, 2));

      const response = await fetch("/api/book-title-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      devLog("=== Response status ===", response.status, response.statusText);
      devLog("=== Response headers ===", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        devLog("=== Response not OK ===");
        const errorData = await response.json();
        devLog("Error data:", errorData);
        toast.error(errorData.message || toastMessages.error_generate_failed);
        return;
      }

      devLog("=== Starting to read stream ===");

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        devLog("=== No reader available ===");
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
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep last incomplete line

        for (const line of lines) {
          if (line.startsWith("0:")) {
            // Extract the text content from the data stream
            try {
              const jsonStr = line.slice(2); // Remove "0:" prefix
              devLog("=== Parsing line ===", jsonStr.substring(0, 50));
              const parsed = JSON.parse(jsonStr);

              if (typeof parsed === "string") {
                accumulatedText += parsed;
                devLog("=== Accumulated text length ===", accumulatedText.length);

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
              devLog("JSON Parse error:", e, "Line:", line.substring(0, 100));
            }
          }
        }
      }

      devLog("=== Final accumulated text length ===", accumulatedText.length);

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
        devLog("=== No titles were generated ===");
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
    devLog("✓ Turnstile verification successful (Book Title)");
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

  useGeneratorShortcuts({
    onGenerate: handleGenerate,
    onFocusInput: () => {
      if (descriptionRef.current) {
        descriptionRef.current.focus();
      }
    },
  });

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
    <section id="book_title_generator" className="min-h-screen overflow-hidden bg-background text-foreground selection:bg-orange-500/20">
      {/* Subtle warm top glow + dot texture */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.05_65),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.18_0.04_65),transparent)]" />
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-orange-500/[0.04] via-orange-500/[0.02] to-transparent" />
        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]" style={{ backgroundImage: 'var(--bg-grid)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative mx-auto w-full max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-8">
          <BookTitleBreadcrumb
            homeText={section.breadcrumb.home}
            currentText={section.breadcrumb.current}
          />
        </div>

        {/* Header */}
        <div className="mt-8 mx-auto max-w-3xl text-center mb-10">
          <h1 className="text-4xl font-display font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
            {section.header.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {section.header.subtitle}
          </p>
        </div>

        {/* Hero → Tool transition */}
        <div className="mb-8 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <GeneratorNavTabs />

        {/* Main Tool Card */}
        <div className="rounded-2xl border border-border bg-card shadow-sm mb-16">
          <div className="p-6 sm:p-10">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Description Field */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/10 text-[10px] font-bold tabular-nums text-orange-600 dark:text-orange-400">1</span>
                      {section.form.description.label}
                    </label>
                    <span className="text-xs text-muted-foreground/60">
                      {descriptionLength} / {section.form.description.max_length}
                    </span>
                  </div>

                  <div className="relative">
                    <Textarea
                      ref={descriptionRef}
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, section.form.description.max_length))}
                      placeholder={section.form.description.placeholder}
                      className="min-h-[140px] resize-none text-sm focus-visible:ring-orange-500/30"
                    />
                  </div>

                  {/* Example Prompts - Simplified */}
                  {!description && (
                    <div className="mt-4">
                      <Collapsible open={isExamplesExpanded} onOpenChange={setIsExamplesExpanded}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 gap-2 px-0">
                            <Icon name="RiLightbulbLine" className="size-3" />
                            {section.form.examples?.title || "Need inspiration?"}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4 animate-slide-down">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {examplePrompts.map((category, index) => (
                                <div key={index} className="space-y-2">
                                  <div className="text-xs font-medium tracking-wide text-muted-foreground/50">{category.category}</div>
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
                <div className="border-t border-border pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/10 text-[10px] font-bold tabular-nums text-orange-600 dark:text-orange-400">2</span>
                    <h3 className="text-sm font-medium text-foreground">{section.form.genre.label.split(" ")[0]} / {section.form.tone.label} / {section.form.style.label}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Genre */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        {section.form.genre.label}
                      </label>
                      <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder={section.form.genre.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(section.form.genre.options).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tone */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        {section.form.tone.label}
                      </label>
                      <Select value={selectedTone} onValueChange={setSelectedTone}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder={section.form.tone.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(section.form.tone.options).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Style */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        {section.form.style.label}
                      </label>
                      <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder={section.form.style.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(section.form.style.options).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Generate Action */}
                <div className="border-t border-border pt-6 flex flex-col items-center gap-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full h-14 rounded-xl text-base font-semibold bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-500 dark:hover:bg-orange-600 shadow-md shadow-orange-600/20 active:scale-[0.97] transition-all"
                  >
                    {isGenerating ? (
                      <div className="flex items-center gap-2">
                        <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>{section.generate_button.generating}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Icon name="RiSparklingLine" className="size-4" />
                        <span>{section.generate_button.text}</span>
                      </div>
                    )}
                  </Button>

                  <GeneratorShortcutHints />

                  {/* Info Pills */}
                  <div className="flex items-center gap-4 flex-wrap justify-center">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                      <Icon name="RiCheckLine" className="size-3 text-orange-500" />
                      {section.generate_button.info.free}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                      <Icon name="RiTimeLine" className="size-3 text-orange-500" />
                      {section.generate_button.info.time}
                    </span>
                  </div>

                  {/* Error & Retry */}
                  {lastError && !isGenerating && (
                    <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
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
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <Icon name="RiStarLine" className="size-5 text-orange-600 dark:text-orange-400" />
                 </div>
                 <div>
                    <h3 className="text-lg font-bold tracking-tight text-foreground">{section.output.title}</h3>
                    <p className="text-xs text-muted-foreground/60">{section.output.subtitle}</p>
                 </div>
              </div>
              {generatedTitles.length > 0 && (
                <Button
                  onClick={handleClearTitles}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 gap-1.5 text-xs"
                >
                  <Icon name="RiCloseLine" className="size-3.5" />
                  {section.output.clear_button}
                </Button>
              )}
            </div>

            {isGenerating ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="h-24 rounded-xl bg-muted/40 border border-border overflow-hidden relative animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedTitles.map((titleObj, index) => (
                  <div
                    key={titleObj.id}
                    className={cn(
                      "group relative p-5 rounded-xl bg-card border border-border hover:border-orange-500/30 hover:bg-orange-500/[0.02] card-hover-lift transition-all duration-300",
                      titleObj.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                    )}
                    style={{ transitionDelay: `${index * 80}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center text-xs font-bold text-orange-600 dark:text-orange-400 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                            {index + 1}
                          </div>
                          <p className="text-base font-medium text-foreground leading-snug tracking-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-200">
                            {titleObj.title}
                          </p>
                      </div>
                      <Button
                        onClick={() => handleCopyTitle(titleObj.id, titleObj.title)}
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "flex-shrink-0 h-8 w-8 rounded-lg transition-all duration-200",
                          titleObj.copied
                            ? "bg-green-500 text-white"
                            : "text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-500/10 opacity-0 group-hover:opacity-100"
                        )}
                      >
                        {titleObj.copied ? <Icon name="RiCheckLine" className="size-4" /> : <Icon name="RiFileCopyLine" className="size-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={handleTurnstileSuccess}
        onError={handleTurnstileError}
      />
    </section>
  );
}
