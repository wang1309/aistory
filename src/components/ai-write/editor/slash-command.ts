import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";

type SlashRange = { from: number; to: number };

type SlashState = {
  active: boolean;
  range: SlashRange;
  query: string;
};

type SlashStorage = {
  onNext?: () => void;
  onPrev?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
};

const SLASH_KEY = new PluginKey<SlashState>("slashCommand");

const INACTIVE_STATE: SlashState = {
  active: false,
  range: { from: -1, to: -1 },
  query: "",
};

const TRAILING_SLASH_RE = /(?:^|\s)\/([^\s/]{0,20})$/;

function getSlashStorage(editor: Editor): SlashStorage {
  const storage = (editor.storage as unknown) as Record<string, unknown>;
  return (storage.slashCommand as SlashStorage | undefined) ?? {};
}

function setSlashStorage(editor: Editor, value: SlashStorage) {
  const storage = (editor.storage as unknown) as Record<string, unknown>;
  storage.slashCommand = value;
}

export const SlashCommand = Extension.create<Record<string, never>, SlashStorage>({
  name: "slashCommand",

  addStorage() {
    return {};
  },

  addKeyboardShortcuts() {
    const isActive = () => {
      const state = SLASH_KEY.getState(this.editor.state);
      return Boolean(state?.active);
    };

    return {
      ArrowUp: () => {
        if (!isActive()) return false;
        const onPrev = getSlashStorage(this.editor).onPrev;
        if (!onPrev) return false;
        onPrev();
        return true;
      },
      ArrowDown: () => {
        if (!isActive()) return false;
        const onNext = getSlashStorage(this.editor).onNext;
        if (!onNext) return false;
        onNext();
        return true;
      },
      Enter: () => {
        if (!isActive()) return false;
        const onEnter = getSlashStorage(this.editor).onEnter;
        if (!onEnter) return false;
        onEnter();
        return true;
      },
      Escape: () => {
        if (!isActive()) return false;
        const onEscape = getSlashStorage(this.editor).onEscape;
        if (!onEscape) return false;
        onEscape();
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: SLASH_KEY,
        state: {
          init: () => INACTIVE_STATE,
          apply(tr, value) {
            const meta = tr.getMeta(SLASH_KEY);
            if (meta?.close) return INACTIVE_STATE;

            if (!tr.docChanged && !tr.selectionSet) return value;

            const { selection, doc } = tr;
            const $head = selection.$head;
            if (!$head) return INACTIVE_STATE;

            const lineStart = $head.start();
            const textBefore = doc.textBetween(lineStart, $head.pos, "\n");

            const match = TRAILING_SLASH_RE.exec(textBefore);
            if (!match) return INACTIVE_STATE;

            const slashOffsetInText =
              match.index + match[0].length - match[1].length - 1;
            const slashPosInDoc = lineStart + slashOffsetInText;

            return {
              active: true,
              range: { from: slashPosInDoc, to: $head.pos },
              query: match[1],
            };
          },
        },
      }),
    ];
  },
});

export function getSlashCommandState(editor: Editor): SlashState {
  return SLASH_KEY.getState(editor.state) ?? INACTIVE_STATE;
}

export function closeSlashCommand(editor: Editor) {
  const tr = editor.state.tr.setMeta(SLASH_KEY, { close: true });
  editor.view.dispatch(tr);
}

export { getSlashStorage, setSlashStorage };
export type { SlashState, SlashRange, SlashStorage };
