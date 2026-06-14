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
}: RichTextEditorProps) {
  const locale = useLocale();
  const mainPlaceholder = placeholder || "Start writing...";
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
        placeholder: ({ editor }: { editor: Editor; node: PmNode; pos: number; hasAnchor: boolean }) => {
          if (editor.isEmpty) return mainPlaceholder;
          return slashHint;
        },
      }),
      InlineSuggestion,
      ReviewHighlight,
      SlashCommand,
    ],
    [mainPlaceholder, slashHint]
  );

  const editor = useEditor({
    extensions,
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none min-h-[460px] px-5 py-4 outline-none focus:outline-none dark:prose-invert prose-headings:font-semibold prose-p:leading-7 prose-p:text-[15px]",
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML(), e.getText());
    },
    onBlur: () => {
      if (editor) clearInlineSuggestion(editor);
    },
  }, [extensions]);

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
        />
      )}
    </div>
  );
}
