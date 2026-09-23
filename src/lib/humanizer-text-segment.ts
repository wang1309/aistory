/**
 * Language-aware diff tokenizer for AI Humanizer. Kept separate from
 * src/components/ai-write/editor/text-diff.ts (still used by
 * paragraph-rewriter) rather than modifying that file's tokenizer contract —
 * see plan §3 for rationale.
 */

const CJK_REGEX = /[一-鿿㐀-䶿぀-ゟ゠-ヿ가-힯]/g;

function isCJKHeavy(text: string): boolean {
  if (!text) return false;
  const cjkCount = (text.match(CJK_REGEX) || []).length;
  return cjkCount / text.length > 0.3;
}

type Token = { text: string; start: number; end: number };

function tokenizeWhitespace(text: string): Token[] {
  const tokens: Token[] = [];
  const regex = /\S+/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    tokens.push({ text: match[0], start: match.index, end: match.index + match[0].length });
  }
  return tokens;
}

function tokenizeSegmenter(text: string): Token[] {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });
  const tokens: Token[] = [];
  for (const { segment, index, isWordLike } of segmenter.segment(text)) {
    if (!isWordLike && !segment.trim()) continue;
    tokens.push({ text: segment, start: index, end: index + segment.length });
  }
  return tokens;
}

const hasIntlSegmenter = typeof Intl !== "undefined" && "Segmenter" in Intl;

/** CJK-heavy text is tokenized word-by-word via Intl.Segmenter; other text falls back to whitespace splitting. */
export function tokenizeForDiff(text: string): Token[] {
  if (hasIntlSegmenter && isCJKHeavy(text)) return tokenizeSegmenter(text);
  return tokenizeWhitespace(text);
}

function lcsMarkNew(oldWords: string[], newWords: string[]): Set<number> {
  const m = oldWords.length;
  const n = newWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const commonNew = new Set<number>();
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (oldWords[i - 1] === newWords[j - 1]) {
      commonNew.add(j - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return commonNew;
}

export type DiffSegment = { text: string; changed: boolean };

export type UnifiedDiffType = "unchanged" | "added" | "removed";
export type UnifiedDiffSegment = { text: string; type: UnifiedDiffType };

export type HumanizerDiff = {
  original: DiffSegment[];
  modified: DiffSegment[];
  unified: UnifiedDiffSegment[];
};

const HUMANIZER_DIFF_MAX_TOKEN_PAIRS = 250_000;

function segmentsFromTokens(text: string, tokens: Token[], commonTokenIndexes: Set<number>): DiffSegment[] {
  if (tokens.length === 0) return text ? [{ text, changed: true }] : [];

  const segments: DiffSegment[] = [];
  let cursor = 0;
  const append = (value: string, changed: boolean) => {
    if (!value) return;
    const previous = segments.at(-1);
    if (previous && previous.changed === changed) previous.text += value;
    else segments.push({ text: value, changed });
  };

  tokens.forEach((token, index) => {
    append(text.slice(cursor, token.start), false);
    append(token.text, !commonTokenIndexes.has(index));
    cursor = token.end;
  });
  append(text.slice(cursor), false);
  return segments;
}

/**
 * Computes an inline unified stream of diff tokens:
 * unchanged text, removed text (original deleted), and added text (new replacement).
 */
function computeUnifiedSegments(
  original: string,
  modified: string,
  origTokens: Token[],
  modTokens: Token[]
): UnifiedDiffSegment[] {
  const m = origTokens.length;
  const n = modTokens.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origTokens[i - 1].text.toLowerCase() === modTokens[j - 1].text.toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  type TraceOp = { type: UnifiedDiffType; origIdx?: number; modIdx?: number };
  const ops: TraceOp[] = [];

  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      origTokens[i - 1].text.toLowerCase() === modTokens[j - 1].text.toLowerCase()
    ) {
      ops.push({ type: "unchanged", origIdx: i - 1, modIdx: j - 1 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: "added", modIdx: j - 1 });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      ops.push({ type: "removed", origIdx: i - 1 });
      i--;
    }
  }

  ops.reverse();

  const segments: UnifiedDiffSegment[] = [];
  const appendUnified = (text: string, type: UnifiedDiffType) => {
    if (!text) return;
    const prev = segments.at(-1);
    if (prev && prev.type === type) {
      prev.text += text;
    } else {
      segments.push({ text, type });
    }
  };

  let origCursor = 0;
  let modCursor = 0;

  for (const op of ops) {
    if (op.type === "unchanged" && op.origIdx !== undefined && op.modIdx !== undefined) {
      const origTok = origTokens[op.origIdx];
      const modTok = modTokens[op.modIdx];
      // Include any leading whitespace/punctuation from modified stream
      if (modTok.start > modCursor) {
        appendUnified(modified.slice(modCursor, modTok.start), "unchanged");
      }
      appendUnified(modTok.text, "unchanged");
      origCursor = origTok.end;
      modCursor = modTok.end;
    } else if (op.type === "removed" && op.origIdx !== undefined) {
      const origTok = origTokens[op.origIdx];
      if (origTok.start > origCursor) {
        const leading = original.slice(origCursor, origTok.start);
        if (leading.trim()) {
          appendUnified(leading, "removed");
        }
      }
      appendUnified(origTok.text, "removed");
      origCursor = origTok.end;
    } else if (op.type === "added" && op.modIdx !== undefined) {
      const modTok = modTokens[op.modIdx];
      if (modTok.start > modCursor) {
        const leading = modified.slice(modCursor, modTok.start);
        if (leading) {
          appendUnified(leading, "added");
        }
      }
      appendUnified(modTok.text, "added");
      modCursor = modTok.end;
    }
  }

  // Append any trailing whitespace
  if (modCursor < modified.length) {
    appendUnified(modified.slice(modCursor), "unchanged");
  }

  return segments;
}

export function computeHumanizerDiff(original: string, modified: string): HumanizerDiff {
  if (original === modified) {
    return {
      original: original ? [{ text: original, changed: false }] : [],
      modified: modified ? [{ text: modified, changed: false }] : [],
      unified: original ? [{ text: original, type: "unchanged" }] : [],
    };
  }

  const originalTokens = tokenizeForDiff(original);
  const modifiedTokens = tokenizeForDiff(modified);

  if (originalTokens.length * modifiedTokens.length > HUMANIZER_DIFF_MAX_TOKEN_PAIRS) {
    return {
      original: original ? [{ text: original, changed: true }] : [],
      modified: modified ? [{ text: modified, changed: true }] : [],
      unified: [
        ...(original ? [{ text: original, type: "removed" as const }] : []),
        ...(modified ? [{ text: modified, type: "added" as const }] : []),
      ],
    };
  }

  const originalCommon = lcsMarkNew(
    modifiedTokens.map((token) => token.text.toLowerCase()),
    originalTokens.map((token) => token.text.toLowerCase())
  );
  const modifiedCommon = lcsMarkNew(
    originalTokens.map((token) => token.text.toLowerCase()),
    modifiedTokens.map((token) => token.text.toLowerCase())
  );

  const unified = computeUnifiedSegments(original, modified, originalTokens, modifiedTokens);

  return {
    original: segmentsFromTokens(original, originalTokens, originalCommon),
    modified: segmentsFromTokens(modified, modifiedTokens, modifiedCommon),
    unified,
  };
}
