"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Icon from "@/components/icon";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";
import { PlotStorage } from "@/lib/plot-storage";
import { StoryStorage } from "@/lib/story-storage";
import type { PlotData } from "@/types/plot";
import { useRouter } from "@/i18n/navigation";

interface PlotToStoryDialogProps {
  plotId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  translations: any; // Pass translations from parent component
}

export default function PlotToStoryDialog({
  plotId,
  open,
  onOpenChange,
  translations
}: PlotToStoryDialogProps) {
  const router = useRouter();
  const { setShowVerificationModal, setVerificationCallback } = useAppContext();

  // Helper function to get nested translations from translations data
  const t = (path: string) => {
    const keys = path.split('.');
    let value = translations as any;
    for (const key of keys) {
      value = value?.[key];
    }
    return value || path;
  };

  // Get plot data
  const plot = plotId ? PlotStorage.getPlotById(plotId) : null;

  // Override parameters
  const [selectedModel, setSelectedModel] = useState(plot?.model || 'standard');
  const [selectedFormat, setSelectedFormat] = useState('prose');
  const [selectedLength, setSelectedLength] = useState('medium');
  const [selectedLanguage, setSelectedLanguage] = useState(plot?.locale || 'en');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState("");
  const [showStoryOutput, setShowStoryOutput] = useState(false);

  // Use ref for latest values
  const overridesRef = useRef({
    model: 'standard',
    format: 'prose',
    length: 'medium',
    locale: 'en'
  });

  // Update ref when values change
  useRef(() => {
    overridesRef.current = {
      model: selectedModel,
      format: selectedFormat,
      length: selectedLength,
      locale: selectedLanguage
    };
  });

  const handleGenerateStory = useCallback(() => {
    if (!plot) {
      toast.error(t('errors.plot_not_found'));
      return;
    }

    // Set verification callback and show modal
    setVerificationCallback(() => handleVerificationSuccess);
    setShowVerificationModal(true);
  }, [plot, setVerificationCallback, setShowVerificationModal, translations]);

  const handleVerificationSuccess = useCallback(async (turnstileToken: string) => {
    if (!plot) return;

    console.log("=== Starting Story Generation from Plot ===");
    console.log("Plot ID:", plot.id);
    console.log("Plot Title:", plot.title);

    setIsGenerating(true);
    setGeneratedStory("");
    setShowStoryOutput(true);

    try {
      const requestBody = {
        plotData: plot,
        plotId: plot.id,
        overrides: {
          model: selectedModel,
          format: selectedFormat,
          length: selectedLength,
          locale: selectedLanguage,
          genre: plot.genre,
          tone: plot.tone,
          perspective: plot.perspective
        },
        turnstileToken
      };

      console.log("Request body:", JSON.stringify(requestBody, null, 2));

      const response = await fetch("/api/story-generate-from-plot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim().startsWith('0:"')) {
            try {
              const content = line.slice(3, -1)
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');

              accumulatedContent += content;
              setGeneratedStory(accumulatedContent);
            } catch (e) {
              console.error("Parse error:", e);
            }
          }
        }
      }

      // Save story to LocalStorage
      if (accumulatedContent.trim()) {
        const wordCount = accumulatedContent.split(/\s+/).length;

        const savedStory = StoryStorage.saveStory({
          title: plot.title + " - Story",
          prompt: plot.prompt,
          content: accumulatedContent,
          wordCount,
          model: selectedModel,
          format: selectedFormat,
          genre: plot.genre,
          tone: plot.tone
        });

        // Link plot to story
        PlotStorage.linkPlotToStory(plot.id, savedStory.id);

        toast.success(t('success.story_generated'));

        // Navigate to home or story page after a delay
        setTimeout(() => {
          onOpenChange(false);
          router.push('/');
        }, 2000);
      }

    } catch (error) {
      console.error("Story generation error:", error);
      toast.error(`${t('errors.generation_failed')} ${error}`);
    } finally {
      setIsGenerating(false);
    }
  }, [plot, selectedModel, selectedFormat, selectedLength, selectedLanguage, onOpenChange, router, translations]);

  if (!plot) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('dialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">

          {/* Plot Summary */}
          <Card className="p-4 bg-muted/50">
            <h3 className="font-semibold mb-2">{t('dialog.source_plot')}</h3>
            <div className="text-sm space-y-1">
              <div><span className="text-muted-foreground">{t('dialog.title_label')}</span> {plot.title}</div>
              <div><span className="text-muted-foreground">{t('dialog.complexity_label')}</span> {plot.complexity}</div>
              <div><span className="text-muted-foreground">{t('dialog.characters_label')}</span> {plot.mainCharacterCount} main, {plot.supportingCharacterCount} supporting</div>
              <div><span className="text-muted-foreground">{t('dialog.plot_points_label')}</span> {plot.plotPointCount}</div>
              <div><span className="text-muted-foreground">{t('dialog.subplots_label')}</span> {plot.subPlotCount}</div>
            </div>
          </Card>

          {/* Story Parameters */}
          {!showStoryOutput && (
            <div className="grid grid-cols-2 gap-4">

              {/* AI Model */}
              <div className="space-y-2">
                <Label>{t('ui.ai_model')}</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fast">⚡ {t('ai_models.fast')}</SelectItem>
                    <SelectItem value="standard">✨ {t('ai_models.standard')} (Recommended)</SelectItem>
                    <SelectItem value="creative">🎨 {t('ai_models.creative')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Format */}
              <div className="space-y-2">
                <Label>{t('dialog.format')}</Label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prose">{t('format.prose')}</SelectItem>
                    <SelectItem value="screenplay">{t('format.screenplay')}</SelectItem>
                    <SelectItem value="short-story">{t('format.short_story')}</SelectItem>
                    <SelectItem value="diary">{t('format.diary')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Length */}
              <div className="space-y-2">
                <Label>{t('dialog.length')}</Label>
                <Select value={selectedLength} onValueChange={setSelectedLength}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">{t('length.short')}</SelectItem>
                    <SelectItem value="medium">{t('length.medium')}</SelectItem>
                    <SelectItem value="long">{t('length.long')}</SelectItem>
                    <SelectItem value="extend">{t('length.extended')}</SelectItem>
                    <SelectItem value="epic-short">{t('length.epic_short')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label>{t('ui.output_language')}</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                    <SelectItem value="zh">🇨🇳 中文</SelectItem>
                    <SelectItem value="ja">🇯🇵 日本語</SelectItem>
                    <SelectItem value="ko">🇰🇷 한국어</SelectItem>
                    <SelectItem value="es">🇪🇸 Español</SelectItem>
                    <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
          )}

          {/* Story Output */}
          {showStoryOutput && (
            <Card className="p-4 max-h-[400px] overflow-y-auto">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {generatedStory ? (
                  <pre className="whitespace-pre-wrap font-sans">{generatedStory}</pre>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Icon name="loading" className="animate-spin mx-auto mb-2" />
                    <p>{t('dialog.generating')} {t('plot_to_story.generate_story')}...</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
            >
              {showStoryOutput ? t('dialog.close') : t('dialog.cancel')}
            </Button>
            {!showStoryOutput && (
              <Button
                onClick={handleGenerateStory}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Icon name="loading" className="mr-2 animate-spin" />
                    {t('dialog.generating')}...
                  </>
                ) : (
                  <>
                    ✨ {t('dialog.generate_story')}
                  </>
                )}
              </Button>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
