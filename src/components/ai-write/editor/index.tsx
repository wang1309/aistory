"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { TextAlign } from "@tiptap/extension-text-align";
import { Link } from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import type { Node as PmNode } from "@tiptap/pm/model";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Toolbar } from "./toolbar";
import { InlineSuggestion } from "./inline-suggestion";
import { clearInlineSuggestion } from "./inline-suggestion";
import { ReviewHighlight } from "./review-highlight";
import {
  SelectionToolbar,
  type SelectionAction,
} from "./selection-toolbar";
import { SlashCommand } from "./slash-command";
import { SlashCommandMenu } from "./slash-command-menu";
import { SearchReplace } from "./search-replace";
import { DragHandle } from "./drag-handle";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function getLocalizedImageCopy(locale: string) {
  if (locale.startsWith("zh")) {
    return {
      tooLarge: "图片过大，请选择小于 5MB 的图片",
      failed: "图片读取失败",
    };
  }
  if (locale.startsWith("de")) {
    return {
      tooLarge: "Bild zu gross (max 5MB)",
      failed: "Bild konnte nicht gelesen werden",
    };
  }
  return {
    tooLarge: "Image too large (max 5MB)",
    failed: "Failed to read image",
  };
}

function readImageFileAsBase64(
  file: File,
  locale: string
): Promise<string | null> {
  return new Promise((resolve) => {
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(getLocalizedImageCopy(locale).tooLarge);
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      resolve(typeof result === "string" ? result : null);
    };
    reader.onerror = () => {
      toast.error(getLocalizedImageCopy(locale).failed);
      resolve(null);
    };
    reader.readAsDataURL(file);
  });
}

function insertImageAtPos(view: import("@tiptap/pm/view").EditorView, pos: number, src: string) {
  const node = view.state.schema.nodes.image.create({ src });
  const tr = view.state.tr.insert(pos, node);
  view.dispatch(tr);
}

type RichTextEditorProps = {
  content: string;
  onChange: (html: string, text: string) => void;
  placeholder?: string;
  editorRef?: React.MutableRefObject<import("@tiptap/react").Editor | null>;
  selectionActions?: SelectionAction[];
  onProcessText?: (text: string, prompt: string) => Promise<string>;
  onAskAi?: (selectedText: string) => void;
  askAiLabel?: string;
  autocompleteOn?: boolean;
  onToggleAutocomplete?: () => void;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
  onSlashAI?: (action: "continue" | "improve" | "expand" | "summarize") => void;
  title?: string;
  plainText?: string;
  isAuthenticated?: boolean;
  onSignIn?: () => void;
  reviewLabels?: {
    processing?: string;
    accept?: string;
    retry?: string;
    reject?: string;
  };
  needLoginLabel?: string;
};

export function RichTextEditor({
  content,
  onChange,
  placeholder,
  editorRef,
  selectionActions,
  onProcessText,
  onAskAi,
  askAiLabel,
  autocompleteOn,
  onToggleAutocomplete,
  focusMode,
  onToggleFocusMode,
  onSlashAI,
  title,
  plainText,
  isAuthenticated,
  onSignIn,
  reviewLabels,
  needLoginLabel,
}: RichTextEditorProps) {
  const locale = useLocale();
  const slashHint = useMemo(() => {
    if (locale.startsWith("zh")) return "输入 “/” 唤起命令菜单";
    if (locale.startsWith("de")) return "Tippe “/” fuer Befehle";
    return "Type “/” for commands";
  }, [locale]);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-orange-600 underline underline-offset-2 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 cursor-pointer",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full my-4",
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList.configure({
        HTMLAttributes: {
          class: "not-prose pl-0 list-none",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "flex items-start gap-2 my-1",
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto my-2",
        },
      }),
      Placeholder.configure({
        placeholder: () => slashHint,
      }),
      InlineSuggestion,
      ReviewHighlight,
      SlashCommand,
      DragHandle,
    ],
    [slashHint]
  );

  const editor = useEditor({
    extensions,
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none min-h-[460px] px-5 py-4 outline-none focus:outline-none dark:prose-invert prose-headings:font-semibold prose-p:leading-7 prose-p:text-[15px]",
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (!item.type.startsWith("image/")) continue;
          const file = item.getAsFile();
          if (!file) continue;
          event.preventDefault();
          void readImageFileAsBase64(file, locale).then((src) => {
            if (!src) return;
            const pos = view.state.selection.from;
            insertImageAtPos(view, pos, src);
          });
          return true;
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        let handled = false;
        for (const file of Array.from(files)) {
          if (!file.type.startsWith("image/")) continue;
          handled = true;
          event.preventDefault();
          void readImageFileAsBase64(file, locale).then((src) => {
            if (!src) return;
            try {
              const dropPos = view.posAtCoords({
                left: (event as DragEvent).clientX,
                top: (event as DragEvent).clientY,
              })?.pos ?? view.state.selection.from;
              insertImageAtPos(view, dropPos, src);
            } catch {
              insertImageAtPos(view, view.state.selection.from, src);
            }
          });
        }
        return handled;
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML(), e.getText());
    },
    onBlur: () => {
      if (editor) clearInlineSuggestion(editor);
    },
  }, [extensions, locale]);

  useEffect(() => {
    if (editorRef && editor) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!editor || !focusMode) {
      const existing = editor?.view.dom.querySelectorAll(".has-focus");
      existing?.forEach((el) => el.classList.remove("has-focus"));
      return;
    }
    const updateFocus = () => {
      const dom = editor.view.dom;
      dom.querySelectorAll(".has-focus").forEach((el) => el.classList.remove("has-focus"));
      const { $from } = editor.state.selection;
      const depth = $from.depth;
      if (depth < 1) return;
      const resolvedPos = editor.state.doc.resolve($from.before(1));
      const domNode = editor.view.nodeDOM(resolvedPos.pos);
      if (domNode instanceof HTMLElement) {
        domNode.classList.add("has-focus");
      }
    };
    editor.on("selectionUpdate", updateFocus);
    updateFocus();
    return () => {
      editor.off("selectionUpdate", updateFocus);
      editor.view.dom.querySelectorAll(".has-focus").forEach((el) => el.classList.remove("has-focus"));
    };
  }, [editor, focusMode]);

  if (!editor) return null;

  return (
    <div className={cn("relative", focusMode && "focus-mode")}>
      <Toolbar
        editor={editor}
        autocompleteOn={autocompleteOn}
        onToggleAutocomplete={onToggleAutocomplete}
        focusMode={focusMode}
        onToggleFocusMode={onToggleFocusMode}
        title={title}
        plainText={plainText}
        isAuthenticated={isAuthenticated}
        onSignIn={onSignIn}
      />
      {showSearch && (
        <SearchReplace editor={editor} onClose={() => setShowSearch(false)} />
      )}
      <EditorContent editor={editor} />
      <SlashCommandMenu editor={editor} onAIAction={onSlashAI} />
      {selectionActions && onProcessText && (
        <SelectionToolbar
          editor={editor}
          actions={selectionActions}
          onProcess={onProcessText}
          onAskAi={onAskAi}
          askAiLabel={askAiLabel}
          labels={reviewLabels}
          isAuthenticated={isAuthenticated}
          needLoginLabel={needLoginLabel}
        />
      )}
    </div>
  );
}
