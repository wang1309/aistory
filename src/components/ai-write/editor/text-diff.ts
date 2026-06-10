type Token = { text: string; start: number; end: number };

function tokenizeWords(text: string): Token[] {
  const tokens: Token[] = [];
  const regex = /\S+/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    tokens.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return tokens;
}

function lcsMarkNew(oldWords: string[], newWords: string[]): Set<number> {
  const m = oldWords.length;
  const n = newWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

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

function mergeRanges(
  ranges: Array<{ from: number; to: number }>
): Array<{ from: number; to: number }> {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.from - b.from);
  const merged: Array<{ from: number; to: number }> = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i].from <= last.to + 1) {
      last.to = Math.max(last.to, sorted[i].to);
    } else {
      merged.push({ ...sorted[i] });
    }
  }
  return merged;
}

export function computeDiffRanges(
  original: string,
  modified: string
): Array<{ from: number; to: number }> {
  if (original === modified) return [];

  const oldTokens = tokenizeWords(original);
  const newTokens = tokenizeWords(modified);

  if (newTokens.length === 0) return [];
  if (oldTokens.length === 0) {
    return [{ from: 0, to: modified.length }];
  }

  const commonNewIdx = lcsMarkNew(
    oldTokens.map((t) => t.text.toLowerCase()),
    newTokens.map((t) => t.text.toLowerCase())
  );

  const ranges: Array<{ from: number; to: number }> = [];
  for (let i = 0; i < newTokens.length; i++) {
    if (!commonNewIdx.has(i)) {
      ranges.push({ from: newTokens[i].start, to: newTokens[i].end });
    }
  }

  return mergeRanges(ranges);
}
