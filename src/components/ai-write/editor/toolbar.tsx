"use client";

import { useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { useLocale } from "next-intl";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RiBold,
  RiItalic,
  RiUnderline,
  RiStrikethrough,
  RiH1,
  RiH2,
  RiListUnordered,
  RiListOrdered,
  RiDoubleQuotesL,
  RiCodeLine,
  RiSeparator,
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiMagicLine,
  RiDownload2Line,
  RiFileTextLine,
  RiMarkdownLine,
  RiFilePdf2Line,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function getCopy(locale: string) {
  if (locale.startsWith("zh")) {
    return {
      bold: "粗体",
      italic: "斜体",
      underline: "下划线",
      strikethrough: "删除线",
      heading1: "标题 1",
      heading2: "标题 2",
      bulletList: "无序列表",
      orderedList: "有序列表",
      quote: "引用",
      codeBlock: "代码块",
      divider: "分割线",
      autocomplete: "自动补全 · Tab 接受 · Esc 取消",
      undo: "撤销",
      redo: "重做",
      exportMarkdown: "Export Markdown",
      exportTxt: "Export TXT",
      exportPdf: "Export PDF",
      exported: "导出成功",
      exportEmpty: "没有可导出的内容",
      exportFailed: "导出失败",
    };
  }
  return {
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    strikethrough: "Strikethrough",
    heading1: "Heading 1",
    heading2: "Heading 2",
    bulletList: "Bullet List",
    orderedList: "Ordered List",
    quote: "Quote",
    codeBlock: "Code Block",
    divider: "Divider",
    autocomplete: "Autocomplete · Tab to accept · Esc to dismiss",
    undo: "Undo",
    redo: "Redo",
    exportMarkdown: "Export Markdown",
    exportTxt: "Export TXT",
    exportPdf: "Export PDF",
    exported: "Exported",
    exportEmpty: "Nothing to export",
    exportFailed: "Export failed",
  };
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getExportFilename(title: string, ext: string) {
  const safe = (title || "untitled").replace(/[^\w一-鿿]/g, "_").substring(0, 40);
  return `${safe}.${ext}`;
}

type ToolbarProps = {
  editor: Editor;
  autocompleteOn?: boolean;
  onToggleAutocomplete?: () => void;
  title?: string;
  plainText?: string;
  isAuthenticated?: boolean;
  onSignIn?: () => void;
};

function ToolbarButton({
  command,
  icon: Icon,
  label,
  isActive,
}: {
  command: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive?: boolean;
}) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <Toggle
          size="sm"
          pressed={isActive}
          onPressedChange={command}
          className="size-9 rounded-md p-0 sm:size-8 data-[state=on]:bg-orange-100 data-[state=on]:text-orange-700 dark:data-[state=on]:bg-orange-900/30 dark:data-[state=on]:text-orange-300"
        >
          <Icon className="size-4" />
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs z-[100]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-border/60" />;
}

export function Toolbar({ editor, autocompleteOn, onToggleAutocomplete, title, plainText, isAuthenticated, onSignIn }: ToolbarProps) {
  const locale = useLocale();
  const copy = getCopy(locale);

  const needLogin = locale.startsWith("zh") ? "请先登录后再导出" : "Please sign in to export";

  const handleExport = useCallback(async (format: "markdown" | "txt" | "pdf") => {
    if (!isAuthenticated) {
      onSignIn?.();
      toast.error(needLogin);
      return;
    }

    const text = plainText ?? editor.getText();
    if (!text.trim()) {
      toast.error(copy.exportEmpty);
      return;
    }
    const t = title ?? "";

    try {
      if (format === "markdown") {
        const md = editor.getHTML();
        downloadFile(md, getExportFilename(t, "md"), "text/markdown;charset=utf-8");
      } else if (format === "txt") {
        downloadFile(text, getExportFilename(t, "txt"), "text/plain;charset=utf-8");
      } else if (format === "pdf") {
        const { exportStoryToPdf } = await import("@/lib/pdf-export");
        await exportStoryToPdf(text, {
          title: t || "Untitled",
          prompt: "",
          wordCount: text.length,
          generatedAt: new Date(),
        }, locale.startsWith("zh") ? "zh" : "en", {
          generated_at: locale.startsWith("zh") ? "生成时间" : "Generated at",
          word_count_label: locale.startsWith("zh") ? "字数" : "Words",
          ai_model: locale.startsWith("zh") ? "AI 模型" : "AI Model",
          story_format: locale.startsWith("zh") ? "格式" : "Format",
          story_genre: locale.startsWith("zh") ? "类型" : "Genre",
          story_tone: locale.startsWith("zh") ? "语气" : "Tone",
          prompt: locale.startsWith("zh") ? "提示词" : "Prompt",
          footer_text: "AI Story Generator",
          page_indicator: locale.startsWith("zh") ? "第 {current} 页 / 共 {total} 页" : "Page {current} / {total}",
        });
      }
      toast.success(copy.exported);
    } catch {
      toast.error(copy.exportFailed);
    }
  }, [copy, editor, plainText, title, locale, isAuthenticated, onSignIn, needLogin]);

  return (
    <TooltipProvider>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-border/40 bg-background px-2 py-2 sm:px-3">
        <ToolbarButton
          command={() => editor.chain().focus().toggleBold().run()}
          icon={RiBold}
          label={copy.bold}
          isActive={editor.isActive("bold")}
        />
        <ToolbarButton
          command={() => editor.chain().focus().toggleItalic().run()}
          icon={RiItalic}
          label={copy.italic}
          isActive={editor.isActive("italic")}
        />
        <ToolbarButton
          command={() => editor.chain().focus().toggleUnderline().run()}
          icon={RiUnderline}
          label={copy.underline}
          isActive={editor.isActive("underline")}
        />
        <ToolbarButton
          command={() => editor.chain().focus().toggleStrike().run()}
          icon={RiStrikethrough}
          label={copy.strikethrough}
          isActive={editor.isActive("strike")}
        />

        <Divider />

        <ToolbarButton
          command={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          icon={RiH1}
          label={copy.heading1}
          isActive={editor.isActive("heading", { level: 1 })}
        />
        <ToolbarButton
          command={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          icon={RiH2}
          label={copy.heading2}
          isActive={editor.isActive("heading", { level: 2 })}
        />

        <Divider />

        <ToolbarButton
          command={() => editor.chain().focus().toggleBulletList().run()}
          icon={RiListUnordered}
          label={copy.bulletList}
          isActive={editor.isActive("bulletList")}
        />
        <ToolbarButton
          command={() => editor.chain().focus().toggleOrderedList().run()}
          icon={RiListOrdered}
          label={copy.orderedList}
          isActive={editor.isActive("orderedList")}
        />

        <Divider />

        <ToolbarButton
          command={() => editor.chain().focus().toggleBlockquote().run()}
          icon={RiDoubleQuotesL}
          label={copy.quote}
          isActive={editor.isActive("blockquote")}
        />
        <ToolbarButton
          command={() => editor.chain().focus().toggleCodeBlock().run()}
          icon={RiCodeLine}
          label={copy.codeBlock}
          isActive={editor.isActive("codeBlock")}
        />

        <Divider />

        <ToolbarButton
          command={() => editor.chain().focus().setHorizontalRule().run()}
          icon={RiSeparator}
          label={copy.divider}
        />

        <div className="flex-1" />

        <DropdownMenu>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex size-9 items-center justify-center rounded-md text-sm text-muted-foreground transition hover:bg-muted sm:size-8"
                >
                  <RiDownload2Line className="size-4" />
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs z-[100]">
              {copy.exportMarkdown.replace("Markdown", "")}
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            <DropdownMenuItem onClick={() => void handleExport("markdown")}>
              <RiMarkdownLine className="mr-2 size-4" />
              {copy.exportMarkdown}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleExport("txt")}>
              <RiFileTextLine className="mr-2 size-4" />
              {copy.exportTxt}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleExport("pdf")}>
              <RiFilePdf2Line className="mr-2 size-4" />
              {copy.exportPdf}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Divider />

        {onToggleAutocomplete && (
          <>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleAutocomplete}
                  className={cn(
                    "inline-flex size-9 items-center justify-center rounded-md text-sm transition hover:bg-muted sm:size-8",
                    autocompleteOn
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                      : "text-muted-foreground"
                  )}
                >
                  <RiMagicLine className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs z-[100]">
                {copy.autocomplete}
              </TooltipContent>
            </Tooltip>

            <Divider />
          </>
        )}

        <ToolbarButton
          command={() => editor.chain().focus().undo().run()}
          icon={RiArrowGoBackLine}
          label={copy.undo}
        />
        <ToolbarButton
          command={() => editor.chain().focus().redo().run()}
          icon={RiArrowGoForwardLine}
          label={copy.redo}
        />
      </div>
    </TooltipProvider>
  );
}
