"use client";

import { useCallback, useRef, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  RiImageLine,
  RiLink,
  RiUpload2Line,
  RiAlignLeft,
  RiAlignCenter,
  RiAlignRight,
  RiAlignJustify,
  RiPaintFill,
  RiMarkPenLine,
  RiTableLine,
  RiListCheck2,
  RiLinkUnlink,
  RiFocusLine,
  RiFileWordLine,
  RiBookLine,
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
      focusMode: "专注模式",
      undo: "撤销",
      redo: "重做",
      alignLeft: "左对齐",
      alignCenter: "居中",
      alignRight: "右对齐",
      alignJustify: "两端对齐",
      textColor: "文字颜色",
      highlight: "高亮",
      clearColor: "清除颜色",
      clearHighlight: "清除高亮",
      link: "链接",
      linkEdit: "编辑链接",
      linkRemove: "移除链接",
      linkDialogTitle: "插入链接",
      linkUrlLabel: "链接地址",
      linkUrlPlaceholder: "https://...",
      linkInsertBtn: "确定",
      linkCancelBtn: "取消",
      linkEmptyUrl: "请填写链接地址",
      linkInvalidUrl: "链接地址不合法",
      table: "表格",
      tableInsert: "插入表格",
      tableDeleteRow: "删除行",
      tableDeleteCol: "删除列",
      tableAddRowBefore: "上方插入行",
      tableAddRowAfter: "下方插入行",
      tableAddColBefore: "左侧插入列",
      tableAddColAfter: "右侧插入列",
      tableDelete: "删除表格",
      taskList: "任务列表",
      exportMarkdown: "Export Markdown",
      exportTxt: "Export TXT",
      exportPdf: "Export PDF",
      exportDocx: "Export DOCX",
      exportEpub: "Export ePub",
      exported: "导出成功",
      exportEmpty: "没有可导出的内容",
      exportFailed: "导出失败",
      image: "插入图片",
      imageByUrl: "通过链接插入",
      imageUpload: "本地上传",
      imageDialogUrlTitle: "插入图片",
      imageDialogUrlDesc: "粘贴图片地址（https:// 或 data:）",
      imageUrlLabel: "图片地址",
      imageAltLabel: "替代文本（可选）",
      imageInsertBtn: "插入",
      imageCancelBtn: "取消",
      imageEmptyUrl: "请填写图片地址",
      imageInvalidUrl: "图片地址不合法",
      imageUploadFailed: "图片读取失败",
      imageTooLarge: "图片过大，请选择小于 5MB 的图片",
      imageInserted: "图片已插入",
      imageReloadNeeded: "图片扩展未生效，请刷新页面后重试",
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
    focusMode: "Focus Mode",
    undo: "Undo",
    redo: "Redo",
    alignLeft: "Align Left",
    alignCenter: "Center",
    alignRight: "Align Right",
    alignJustify: "Justify",
    textColor: "Text Color",
    highlight: "Highlight",
    clearColor: "Clear Color",
    clearHighlight: "Clear Highlight",
    link: "Link",
    linkEdit: "Edit Link",
    linkRemove: "Remove Link",
    linkDialogTitle: "Insert Link",
    linkUrlLabel: "URL",
    linkUrlPlaceholder: "https://...",
    linkInsertBtn: "Insert",
    linkCancelBtn: "Cancel",
    linkEmptyUrl: "Please enter a URL",
    linkInvalidUrl: "Invalid URL",
    table: "Table",
    tableInsert: "Insert Table",
    tableDeleteRow: "Delete Row",
    tableDeleteCol: "Delete Column",
    tableAddRowBefore: "Add Row Above",
    tableAddRowAfter: "Add Row Below",
    tableAddColBefore: "Add Column Left",
    tableAddColAfter: "Add Column Right",
    tableDelete: "Delete Table",
    taskList: "Task List",
    exportMarkdown: "Export Markdown",
    exportTxt: "Export TXT",
    exportPdf: "Export PDF",
    exportDocx: "Export DOCX",
    exportEpub: "Export ePub",
    exported: "Exported",
    exportEmpty: "Nothing to export",
    exportFailed: "Export failed",
    image: "Insert Image",
    imageByUrl: "Insert from URL",
    imageUpload: "Upload from device",
    imageDialogUrlTitle: "Insert Image",
    imageDialogUrlDesc: "Paste an image URL (https:// or data:)",
    imageUrlLabel: "Image URL",
    imageAltLabel: "Alt text (optional)",
    imageInsertBtn: "Insert",
    imageCancelBtn: "Cancel",
    imageEmptyUrl: "Please enter an image URL",
    imageInvalidUrl: "Invalid image URL",
    imageUploadFailed: "Failed to read image",
    imageTooLarge: "Image too large (max 5MB)",
    imageInserted: "Image inserted",
    imageReloadNeeded: "Image extension not active. Please reload the page.",
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
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
  title?: string;
  plainText?: string;
  isAuthenticated?: boolean;
  onSignIn?: () => void;
};

function ToolbarButton({
  command,
  icon: Icon,
  label,
  shortcut,
  isActive,
}: {
  command: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
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
        <span>{label}</span>
        {shortcut && <kbd className="ml-1.5 rounded border border-border/60 bg-background px-1 py-0.5 font-mono text-[10px] text-foreground/70">{shortcut}</kbd>}
      </TooltipContent>
    </Tooltip>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-border/60" />;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export function Toolbar({ editor, autocompleteOn, onToggleAutocomplete, focusMode, onToggleFocusMode, title, plainText, isAuthenticated, onSignIn }: ToolbarProps) {
  const locale = useLocale();
  const copy = getCopy(locale);

  const needLogin = locale.startsWith("zh") ? "请先登录后再导出" : "Please sign in to export";

  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const insertImage = useCallback(
    (src: string, alt?: string) => {
      const chain = editor.chain().focus();
      const hasImageSchema = Boolean(
        (editor.schema.nodes as any)?.image
      );
      if (!hasImageSchema) {
        toast.error(copy.imageReloadNeeded);
        return;
      }
      if (typeof (chain as any).setImage === "function") {
        (chain as any)
          .setImage({ src, alt: alt || undefined })
          .run();
      } else {
        chain
          .insertContent({
            type: "image",
            attrs: { src, alt: alt || null, title: alt || null },
          })
          .run();
      }
      toast.success(copy.imageInserted);
    },
    [editor, copy.imageInserted, copy.imageReloadNeeded]
  );

  const handleConfirmImageUrl = useCallback(() => {
    const trimmed = imageUrl.trim();
    if (!trimmed) {
      toast.error(copy.imageEmptyUrl);
      return;
    }
    const isHttp = /^https?:\/\//i.test(trimmed);
    const isData = /^data:image\//i.test(trimmed);
    if (!isHttp && !isData) {
      toast.error(copy.imageInvalidUrl);
      return;
    }
    insertImage(trimmed, imageAlt);
    setImageUrl("");
    setImageAlt("");
    setImageDialogOpen(false);
  }, [imageUrl, imageAlt, copy.imageEmptyUrl, copy.imageInvalidUrl, insertImage]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(copy.imageTooLarge);
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          insertImage(result, file.name);
        }
      };
      reader.onerror = () => toast.error(copy.imageUploadFailed);
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [copy.imageTooLarge, copy.imageUploadFailed, insertImage]
  );

  const openLinkDialog = useCallback(() => {
    const existingHref = editor.getAttributes("link").href as string | undefined;
    setLinkUrl(existingHref ?? "");
    setLinkDialogOpen(true);
  }, [editor]);

  const handleConfirmLink = useCallback(() => {
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      toast.error(copy.linkEmptyUrl);
      return;
    }
    if (!/^https?:\/\//i.test(trimmed) && !/^mailto:/i.test(trimmed)) {
      toast.error(copy.linkInvalidUrl);
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
    setLinkUrl("");
    setLinkDialogOpen(false);
  }, [editor, linkUrl, copy.linkEmptyUrl, copy.linkInvalidUrl]);

  const handleRemoveLink = useCallback(() => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
  }, [editor]);

  const handleExport = useCallback(async (format: "markdown" | "txt" | "pdf" | "docx" | "epub") => {
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
        const TurndownService = (await import("turndown")).default;
        const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
        const md = turndown.turndown(editor.getHTML());
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
      } else if (format === "docx") {
        const { exportToDocx } = await import("@/lib/docx-export");
        await exportToDocx({ title: t || "Untitled", html: editor.getHTML() });
      } else if (format === "epub") {
        const { exportToEpub } = await import("@/lib/epub-export");
        await exportToEpub({ title: t || "Untitled", html: editor.getHTML(), locale });
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
          shortcut="⌘B"
          isActive={editor.isActive("bold")}
        />
        <ToolbarButton
          command={() => editor.chain().focus().toggleItalic().run()}
          icon={RiItalic}
          label={copy.italic}
          shortcut="⌘I"
          isActive={editor.isActive("italic")}
        />
        <ToolbarButton
          command={() => editor.chain().focus().toggleUnderline().run()}
          icon={RiUnderline}
          label={copy.underline}
          shortcut="⌘U"
          isActive={editor.isActive("underline")}
        />
        <ToolbarButton
          command={() => editor.chain().focus().toggleStrike().run()}
          icon={RiStrikethrough}
          label={copy.strikethrough}
          shortcut="⌘⇧X"
          isActive={editor.isActive("strike")}
        />

        <Divider />

        <ToolbarButton
          command={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          icon={RiH1}
          label={copy.heading1}
          shortcut="⌘⌥1"
          isActive={editor.isActive("heading", { level: 1 })}
        />
        <ToolbarButton
          command={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          icon={RiH2}
          label={copy.heading2}
          shortcut="⌘⌥2"
          isActive={editor.isActive("heading", { level: 2 })}
        />

        <Divider />

        <ToolbarButton
          command={() => editor.chain().focus().toggleBulletList().run()}
          icon={RiListUnordered}
          label={copy.bulletList}
          shortcut="⌘⇧8"
          isActive={editor.isActive("bulletList")}
        />
        <ToolbarButton
          command={() => editor.chain().focus().toggleOrderedList().run()}
          icon={RiListOrdered}
          label={copy.orderedList}
          shortcut="⌘⇧7"
          isActive={editor.isActive("orderedList")}
        />

        <Divider />

        <ToolbarButton
          command={() => editor.chain().focus().toggleBlockquote().run()}
          icon={RiDoubleQuotesL}
          label={copy.quote}
          shortcut="⌘⇧B"
          isActive={editor.isActive("blockquote")}
        />
        <ToolbarButton
          command={() => editor.chain().focus().toggleCodeBlock().run()}
          icon={RiCodeLine}
          label={copy.codeBlock}
          shortcut="⌘⌥C"
          isActive={editor.isActive("codeBlock")}
        />

        <Divider />

        <ToolbarButton
          command={() => editor.chain().focus().setHorizontalRule().run()}
          icon={RiSeparator}
          label={copy.divider}
        />

        <DropdownMenu>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex size-9 items-center justify-center rounded-md text-sm text-muted-foreground transition hover:bg-muted sm:size-8"
                >
                  <RiImageLine className="size-4" />
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs z-[100]">
              {copy.image}
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" className="min-w-[180px]">
            <DropdownMenuItem onClick={() => setImageDialogOpen(true)}>
              <RiLink className="mr-2 size-4" />
              {copy.imageByUrl}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <RiUpload2Line className="mr-2 size-4" />
              {copy.imageUpload}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Divider />

        {/* Text Color */}
        <DropdownMenu>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex size-9 items-center justify-center rounded-md text-sm text-muted-foreground transition hover:bg-muted sm:size-8"
                >
                  <RiPaintFill className="size-4" />
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs z-[100]">
              {copy.textColor}
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" className="min-w-[140px]">
            {[
              { color: "#dc2626", label: "Red" },
              { color: "#ea580c", label: "Orange" },
              { color: "#ca8a04", label: "Yellow" },
              { color: "#16a34a", label: "Green" },
              { color: "#2563eb", label: "Blue" },
              { color: "#7c3aed", label: "Purple" },
            ].map((item) => (
              <DropdownMenuItem
                key={item.color}
                onClick={() => editor.chain().focus().setColor(item.color).run()}
              >
                <span className="mr-2 inline-block size-3 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={() => editor.chain().focus().unsetColor().run()}>
              {copy.clearColor}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Highlight */}
        <DropdownMenu>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "inline-flex size-9 items-center justify-center rounded-md text-sm transition hover:bg-muted sm:size-8",
                    editor.isActive("highlight")
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                      : "text-muted-foreground"
                  )}
                >
                  <RiMarkPenLine className="size-4" />
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs z-[100]">
              {copy.highlight}
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" className="min-w-[140px]">
            {[
              { color: "#fef08a", label: "Yellow" },
              { color: "#bbf7d0", label: "Green" },
              { color: "#bfdbfe", label: "Blue" },
              { color: "#e9d5ff", label: "Purple" },
              { color: "#fecaca", label: "Red" },
              { color: "#fed7aa", label: "Orange" },
            ].map((item) => (
              <DropdownMenuItem
                key={item.color}
                onClick={() => editor.chain().focus().toggleHighlight({ color: item.color }).run()}
              >
                <span className="mr-2 inline-block size-3 rounded" style={{ backgroundColor: item.color }} />
                {item.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={() => editor.chain().focus().unsetHighlight().run()}>
              {copy.clearHighlight}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Divider />

        {/* Text Align */}
        <ToolbarButton
          command={() => editor.chain().focus().setTextAlign("left").run()}
          icon={RiAlignLeft}
          label={copy.alignLeft}
          isActive={editor.isActive({ textAlign: "left" })}
        />
        <ToolbarButton
          command={() => editor.chain().focus().setTextAlign("center").run()}
          icon={RiAlignCenter}
          label={copy.alignCenter}
          isActive={editor.isActive({ textAlign: "center" })}
        />
        <ToolbarButton
          command={() => editor.chain().focus().setTextAlign("right").run()}
          icon={RiAlignRight}
          label={copy.alignRight}
          isActive={editor.isActive({ textAlign: "right" })}
        />

        <Divider />

        {/* Link */}
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={editor.isActive("link") ? handleRemoveLink : openLinkDialog}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-md text-sm transition hover:bg-muted sm:size-8",
                editor.isActive("link")
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                  : "text-muted-foreground"
              )}
            >
              {editor.isActive("link") ? <RiLinkUnlink className="size-4" /> : <RiLink className="size-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs z-[100]">
            {editor.isActive("link") ? copy.linkRemove : copy.link}
          </TooltipContent>
        </Tooltip>

        {/* Table */}
        <DropdownMenu>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "inline-flex size-9 items-center justify-center rounded-md text-sm transition hover:bg-muted sm:size-8",
                    editor.isActive("table")
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                      : "text-muted-foreground"
                  )}
                >
                  <RiTableLine className="size-4" />
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs z-[100]">
              {copy.table}
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" className="min-w-[160px]">
            <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
              {copy.tableInsert}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addRowBefore().run()}
              disabled={!editor.can().addRowBefore()}
            >
              {copy.tableAddRowBefore}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addRowAfter().run()}
              disabled={!editor.can().addRowAfter()}
            >
              {copy.tableAddRowAfter}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              disabled={!editor.can().addColumnBefore()}
            >
              {copy.tableAddColBefore}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              disabled={!editor.can().addColumnAfter()}
            >
              {copy.tableAddColAfter}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteRow().run()}
              disabled={!editor.can().deleteRow()}
            >
              {copy.tableDeleteRow}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteColumn().run()}
              disabled={!editor.can().deleteColumn()}
            >
              {copy.tableDeleteCol}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteTable().run()}
              disabled={!editor.can().deleteTable()}
              className="text-destructive"
            >
              {copy.tableDelete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Task List */}
        <ToolbarButton
          command={() => editor.chain().focus().toggleTaskList().run()}
          icon={RiListCheck2}
          label={copy.taskList}
          isActive={editor.isActive("taskList")}
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
              {copy.exportMarkdown}
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
            <DropdownMenuItem onClick={() => void handleExport("docx")}>
              <RiFileWordLine className="mr-2 size-4" />
              {copy.exportDocx}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleExport("epub")}>
              <RiBookLine className="mr-2 size-4" />
              {copy.exportEpub}
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

        {onToggleFocusMode && (
          <>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleFocusMode}
                  className={cn(
                    "inline-flex size-9 items-center justify-center rounded-md text-sm transition hover:bg-muted sm:size-8",
                    focusMode
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                      : "text-muted-foreground"
                  )}
                >
                  <RiFocusLine className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs z-[100]">
                {copy.focusMode}
              </TooltipContent>
            </Tooltip>

            <Divider />
          </>
        )}

        <ToolbarButton
          command={() => editor.chain().focus().undo().run()}
          icon={RiArrowGoBackLine}
          label={copy.undo}
          shortcut="⌘Z"
        />
        <ToolbarButton
          command={() => editor.chain().focus().redo().run()}
          icon={RiArrowGoForwardLine}
          label={copy.redo}
          shortcut="⌘⇧Z"
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <Dialog
        open={imageDialogOpen}
        onOpenChange={(open) => {
          setImageDialogOpen(open);
          if (!open) {
            setImageUrl("");
            setImageAlt("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{copy.imageDialogUrlTitle}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {copy.imageDialogUrlDesc}
            </p>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="image-url-input">{copy.imageUrlLabel}</Label>
              <Input
                id="image-url-input"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirmImageUrl();
                  }
                }}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="image-alt-input">{copy.imageAltLabel}</Label>
              <Input
                id="image-alt-input"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirmImageUrl();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImageDialogOpen(false)}
            >
              {copy.imageCancelBtn}
            </Button>
            <Button onClick={handleConfirmImageUrl}>
              {copy.imageInsertBtn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={linkDialogOpen}
        onOpenChange={(open) => {
          setLinkDialogOpen(open);
          if (!open) setLinkUrl("");
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{copy.linkDialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="link-url-input">{copy.linkUrlLabel}</Label>
              <Input
                id="link-url-input"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder={copy.linkUrlPlaceholder}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirmLink();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              {copy.linkCancelBtn}
            </Button>
            <Button onClick={handleConfirmLink}>
              {copy.linkInsertBtn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
