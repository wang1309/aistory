"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import type { Node as PmNode } from "@tiptap/pm/model";
import { useEffect, useMemo } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
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
  autocompleteOn?: boolean;
  onToggleAutocomplete?: () => void;
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
  autocompleteOn,
  onToggleAutocomplete,
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

  if (!editor) return null;

  return (
    <div className="relative">
      <Toolbar
        editor={editor}
        autocompleteOn={autocompleteOn}
        onToggleAutocomplete={onToggleAutocomplete}
        title={title}
        plainText={plainText}
        isAuthenticated={isAuthenticated}
        onSignIn={onSignIn}
      />
      <EditorContent editor={editor} />
      <SlashCommandMenu editor={editor} />
      {selectionActions && onProcessText && (
        <SelectionToolbar
          editor={editor}
          actions={selectionActions}
          onProcess={onProcessText}
          labels={reviewLabels}
          isAuthenticated={isAuthenticated}
          needLoginLabel={needLoginLabel}
        />
      )}
    </div>
  );
}
