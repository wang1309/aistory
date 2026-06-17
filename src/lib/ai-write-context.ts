export const TOKEN_BUDGET = {
  total: 256_000,
  reserveOverhead: 1_500,
  reserveOutput: 1_200,
  reserveDrift: 2_300,
  softCap: {
    system: 300,
    editor: 150_000,
    bible: 25_000,
    fingerprint: 300,
    history: 20_000,
    summary: 5_000,
    instruction: 4_000,
  },
  hardCap: {
    system: 600,
    editor: 180_000,
    bible: 40_000,
    fingerprint: 500,
    history: 30_000,
    summary: 8_000,
    instruction: 8_000,
  },
} as const;

export function tokenEstimate(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function charBudgetFor(tokens: number): number {
  return Math.max(0, Math.floor(tokens * 4));
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type EditorTruncationResult = {
  text: string;
  truncated: boolean;
  originalTokens: number;
  finalTokens: number;
};

export function truncateEditorContent(input: {
  text: string;
  tokenBudget: number;
  cursorOffset?: number;
  headRatio?: number;
  tailRatio?: number;
}): EditorTruncationResult {
  const { text, cursorOffset = text.length, headRatio = 0.25, tailRatio = 0.55 } = input;
  const originalTokens = tokenEstimate(text);

  if (originalTokens <= input.tokenBudget) {
    return { text, truncated: false, originalTokens, finalTokens: originalTokens };
  }

  const charBudget = charBudgetFor(input.tokenBudget);
  const omittedTokens = originalTokens - input.tokenBudget;
  const marker = `\n…[omitted ~${omittedTokens} tokens]…\n`;
  const markerChars = marker.length;
  const usable = Math.max(0, charBudget - markerChars * 2);

  const headChars = Math.floor(usable * headRatio);
  const tailChars = Math.floor(usable * tailRatio);
  const cursorChars = Math.max(0, usable - headChars - tailChars);

  const head = text.slice(0, headChars);
  const tail = text.slice(Math.max(0, text.length - tailChars));

  const cursorCenter = Math.min(
    Math.max(cursorOffset, headChars),
    Math.max(headChars, text.length - tailChars)
  );
  const cursorStart = Math.max(headChars, cursorCenter - Math.floor(cursorChars / 2));
  const cursorEnd = Math.min(text.length - tailChars, cursorStart + cursorChars);
  const cursorSlice = text.slice(cursorStart, cursorEnd);

  const parts = [head];
  if (cursorStart > headChars) parts.push(marker);
  parts.push(cursorSlice);
  if (cursorEnd < text.length - tailChars) parts.push(marker);
  parts.push(tail);

  const truncatedText = parts.join("");
  return {
    text: truncatedText,
    truncated: true,
    originalTokens,
    finalTokens: tokenEstimate(truncatedText),
  };
}

export function truncateBible(input: {
  bibleText: string;
  tokenBudget: number;
  instruction: string;
  characters: Array<{ name: string; block: string }>;
}): { text: string; truncated: boolean } {
  const full = input.bibleText;
  if (tokenEstimate(full) <= input.tokenBudget) {
    return { text: full, truncated: false };
  }

  const instLower = input.instruction.toLowerCase();
  const prioChars = input.characters.filter((c) =>
    c.name && instLower.includes(c.name.toLowerCase())
  );
  const others = input.characters.filter((c) => !prioChars.includes(c));

  const charBudget = charBudgetFor(input.tokenBudget);
  let remaining = Math.floor(charBudget * 0.75);

  const lines: string[] = ["== Characters =="];
  for (const c of prioChars) {
    lines.push(c.block);
    remaining -= c.block.length;
  }

  const share = others.length > 0 ? Math.floor(remaining / others.length) : remaining;
  for (const c of others) {
    if (remaining <= 0) {
      lines.push(`- ${c.name} [details omitted]`);
      continue;
    }
    if (c.block.length <= share) {
      lines.push(c.block);
      remaining -= c.block.length;
    } else {
      lines.push(c.block.slice(0, share) + " …");
      remaining -= share;
    }
  }

  return { text: lines.join("\n"), truncated: true };
}

export function truncateHistory(
  messages: ChatMessage[],
  tokenBudget: number
): { messages: ChatMessage[]; droppedCount: number } {
  const reversed: ChatMessage[] = [];
  let used = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const t = tokenEstimate(messages[i].content) + 4;
    if (used + t > tokenBudget && reversed.length > 0) break;
    used += t;
    reversed.unshift(messages[i]);
  }
  return { messages: reversed, droppedCount: messages.length - reversed.length };
}

export type BudgetPlan = {
  system: number;
  editor: number;
  bible: number;
  fingerprint: number;
  history: number;
  summary: number;
  instruction: number;
};

export function planBudget(measured: {
  system: number;
  fingerprint: number;
  instruction: number;
}): BudgetPlan {
  const contentTotal =
    TOKEN_BUDGET.total -
    TOKEN_BUDGET.reserveOverhead -
    TOKEN_BUDGET.reserveOutput -
    TOKEN_BUDGET.reserveDrift;

  const plan: BudgetPlan = {
    system: Math.min(Math.max(measured.system, 1), TOKEN_BUDGET.hardCap.system),
    fingerprint: Math.min(Math.max(measured.fingerprint, 1), TOKEN_BUDGET.hardCap.fingerprint),
    instruction: Math.min(Math.max(measured.instruction, 1), TOKEN_BUDGET.hardCap.instruction),
    bible: TOKEN_BUDGET.softCap.bible,
    history: TOKEN_BUDGET.softCap.history,
    summary: TOKEN_BUDGET.softCap.summary,
    editor: 0,
  };

  const fixed = plan.system + plan.fingerprint + plan.instruction + plan.bible + plan.history + plan.summary;
  plan.editor = Math.min(Math.max(contentTotal - fixed, 10_000), TOKEN_BUDGET.hardCap.editor);
  return plan;
}

export function shouldSummarize(droppedCount: number, summarizedUpTo: number): boolean {
  return droppedCount > 0 && droppedCount >= 10 && summarizedUpTo < droppedCount;
}

export function buildSummaryPrompt(oldSummary: string, droppedMessages: ChatMessage[]): string {
  const conversationText = droppedMessages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const base = oldSummary
    ? `Existing summary:\n${oldSummary}\n\nNew messages to incorporate:\n${conversationText}`
    : `Conversation to summarize:\n${conversationText}`;

  return `${base}\n\nSummarize the key points of this writing conversation in 3-5 sentences. Focus on: story direction discussed, character decisions, style preferences, and any unresolved questions. Return only the summary.`;
}
