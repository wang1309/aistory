import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Editor } from "@tiptap/react";

const PLUGIN_KEY = new PluginKey("inlineSuggestion");

export const InlineSuggestion = Extension.create({
  name: "inlineSuggestion",

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        const state = PLUGIN_KEY.getState(this.editor.state);
        const suggestion = state?.suggestion;
        if (!suggestion) return false;

        const { from } = this.editor.state.selection;
        const tr = this.editor.state.tr.insertText(suggestion, from);
        tr.setMeta(PLUGIN_KEY, { suggestion: "" });
        this.editor.view.dispatch(tr);
        return true;
      },
      Escape: () => {
        const state = PLUGIN_KEY.getState(this.editor.state);
        if (!state?.suggestion) return false;

        const tr = this.editor.state.tr.setMeta(PLUGIN_KEY, {
          suggestion: "",
        });
        this.editor.view.dispatch(tr);
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: PLUGIN_KEY,
        state: {
          init: () => ({ suggestion: "" }),
          apply: (tr, value) => {
            const meta = tr.getMeta(PLUGIN_KEY);
            if (meta !== undefined) return meta;
            if (tr.docChanged) return { suggestion: "" };
            return value;
          },
        },
        props: {
          decorations: (state) => {
            const { suggestion } = PLUGIN_KEY.getState(state) || {};
            if (!suggestion) return DecorationSet.empty;

            const { from } = state.selection;
            const widget = Decoration.widget(
              from,
              () => {
                const span = document.createElement("span");
                span.textContent = suggestion;
                span.style.opacity = "0.35";
                span.style.pointerEvents = "none";
                return span;
              },
              { side: 1 }
            );

            return DecorationSet.create(state.doc, [widget]);
          },
        },
      }),
    ];
  },
});

export function setInlineSuggestion(editor: Editor, suggestion: string) {
  const tr = editor.state.tr.setMeta(PLUGIN_KEY, { suggestion });
  editor.view.dispatch(tr);
}

export function clearInlineSuggestion(editor: Editor) {
  const tr = editor.state.tr.setMeta(PLUGIN_KEY, { suggestion: "" });
  editor.view.dispatch(tr);
}
