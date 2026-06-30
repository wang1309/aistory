/**
 * Lightweight content filter for public story shares.
 *
 * Blocks obvious illegal / high-risk categories before a share is persisted.
 * Uses word-boundary regex to avoid false positives on normal text (e.g.
 * "tcp", "pediatric"). This is a first line of defense only — it is trivially
 * bypassable (whitespace, leetspeak, unicode), so the real backstop is the
 * in-page report button (sg_feedbacks) + admin takedown (status=banned).
 */

// English patterns — anchored with word boundaries to avoid false positives.
const BANNED_PATTERNS: RegExp[] = [
  // CSAM / underage sexual content (hard illegal everywhere)
  /\bchild\s*(porn|pornography|nude|nudes|abuse|exploit)/i,
  /\bunderage\s*(nude|nudes|porn|sex|exploit)/i,
  /\bpre-?teen\s*(nude|porn|sex)/i,
  /\b(lolli|loli|shota)con\b/i,
  /\bpedophile\b|\bpedophilia\b/i,
  // terrorism / mass-casualty instructions
  /\bhow\s+to\s+(make|build)\s+(a\s+)?bomb\b/i,
  /\bterror(ist|ism)\s+(attack|plot|bomb)\b/i,
  /\bmass\s+shooting\s+(plan|plot)\b/i,
  // non-consensual / sexual-violence instructions
  /\bhow\s+to\s+(drug|roofie)\s+/i,
  /\bdate[-\s]?rape\s+drug\b/i,
  // doxxing / swatting
  /\bswatting\b/i,
];

// Chinese patterns — category keywords.
const BANNED_PATTERNS_ZH: RegExp[] = [
  /儿童(色情|裸照|裸体|剥削)/,
  /萝莉(控|色情)?/,
  /正太(控)?/,
  /制作(炸弹|爆炸物)/,
  /恐怖(袭击|爆炸)/,
  /迷(奸|药)/,
  /人肉搜索/,
];

export interface FilterResult {
  hit: boolean;
  matched?: string;
}

export function containsBannedContent(text: string): FilterResult {
  const source = text || "";

  for (const re of BANNED_PATTERNS) {
    const m = source.match(re);
    if (m) {
      return { hit: true, matched: m[0] };
    }
  }
  for (const re of BANNED_PATTERNS_ZH) {
    const m = source.match(re);
    if (m) {
      return { hit: true, matched: m[0] };
    }
  }

  return { hit: false };
}
