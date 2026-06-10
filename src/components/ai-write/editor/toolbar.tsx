"use client";

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
} from "react-icons/ri";
import { cn } from "@/lib/utils";

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
  };
}

type ToolbarProps = {
  editor: Editor;
  autocompleteOn?: boolean;
  onToggleAutocomplete?: () => void;
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

export function Toolbar({ editor, autocompleteOn, onToggleAutocomplete }: ToolbarProps) {
  const locale = useLocale();
  const copy = getCopy(locale);

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
