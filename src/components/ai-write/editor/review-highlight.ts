import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Editor } from "@tiptap/react";

const REVIEW_KEY = new PluginKey("reviewHighlight");

export const ReviewHighlight = Extension.create({
  name: "reviewHighlight",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: REVIEW_KEY,
        state: {
          init: () => ({ ranges: [] as Array<{ from: number; to: number }> }),
          apply: (tr, value) => {
            const meta = tr.getMeta(REVIEW_KEY);
            if (meta !== undefined) return meta;
            return value;
          },
        },
        props: {
          decorations: (state) => {
            const { ranges } = REVIEW_KEY.getState(state) || {};
            if (!ranges || ranges.length === 0) return DecorationSet.empty;

            const decorations = ranges.map(
              (r: { from: number; to: number }) =>
                Decoration.inline(r.from, r.to, {
                  style:
                    "background-color: rgba(34,197,94,0.22); border-radius: 2px;",
                })
            );

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

export function setReviewHighlights(
  editor: Editor,
  ranges: Array<{ from: number; to: number }>
) {
  const tr = editor.state.tr.setMeta(REVIEW_KEY, { ranges });
  editor.view.dispatch(tr);
}

export function clearReviewHighlights(editor: Editor) {
  const tr = editor.state.tr.setMeta(REVIEW_KEY, { ranges: [] });
  editor.view.dispatch(tr);
}
