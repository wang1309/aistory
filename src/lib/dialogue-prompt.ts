import { DialogueGenerateOptions } from "@/types/dialogue";

const languageNames: Record<string, { native: string; english: string }> = {
  en: { native: "English", english: "English" },
  zh: { native: "中文", english: "Chinese" },
  de: { native: "Deutsch", english: "German" },
  ko: { native: "한국어", english: "Korean" },
  ja: { native: "日本語", english: "Japanese" },
  ru: { native: "Русский", english: "Russian" },
  es: { native: "Español", english: "Spanish" },
  fr: { native: "Français", english: "French" },
  pt: { native: "Português", english: "Portuguese" },
  it: { native: "Italiano", english: "Italian" },
  ar: { native: "العربية", english: "Arabic" },
  hi: { native: "हिन्दी", english: "Hindi" },
};

const dialogueTypeDescriptions: Record<string, { en: string; zh: string }> = {
  conversation: {
    en: "A natural, flowing conversation between characters",
    zh: "角色之间自然流畅的对话",
  },
  argument: {
    en: "A heated argument or debate with conflicting viewpoints",
    zh: "激烈的争论或辩论，观点冲突",
  },
  interview: {
    en: "A formal or informal interview format",
    zh: "正式或非正式的采访形式",
  },
  negotiation: {
    en: "A negotiation scene with give and take",
    zh: "有来有往的谈判场景",
  },
  confession: {
    en: "An emotional confession or revelation",
    zh: "情感告白或揭示真相",
  },
  comedy: {
    en: "A comedic exchange with humor and wit",
    zh: "幽默诙谐的喜剧对话",
  },
  dramatic: {
    en: "A dramatic, intense dialogue with high stakes",
    zh: "戏剧性的、紧张的高风险对话",
  },
  philosophical: {
    en: "A deep, philosophical discussion",
    zh: "深刻的哲学讨论",
  },
};

const toneDescriptions: Record<string, { en: string; zh: string }> = {
  casual: { en: "Casual and relaxed", zh: "随意轻松" },
  formal: { en: "Formal and professional", zh: "正式专业" },
  emotional: { en: "Emotional and heartfelt", zh: "情感真挚" },
  humorous: { en: "Humorous and witty", zh: "幽默风趣" },
  tense: { en: "Tense and suspenseful", zh: "紧张悬疑" },
  romantic: { en: "Romantic and tender", zh: "浪漫温柔" },
  mysterious: { en: "Mysterious and intriguing", zh: "神秘引人入胜" },
};

const lengthConfig: Record<string, { exchanges: string; description: string }> = {
  short: { exchanges: "5-10", description: "brief exchange" },
  medium: { exchanges: "15-25", description: "moderate conversation" },
  long: { exchanges: "30-50", description: "extended dialogue" },
};

export function buildDialoguePrompt(options: DialogueGenerateOptions): string {
  const {
    prompt,
    locale,
    characters = [],
    dialogueType = "conversation",
    tone = "casual",
    length = "medium",
    setting,
    includeNarration = true,
  } = options;

  const lang = languageNames[locale] || languageNames.en;
  const isZh = locale === "zh";

  const typeDesc = dialogueTypeDescriptions[dialogueType] || dialogueTypeDescriptions.conversation;
  const toneDesc = toneDescriptions[tone] || toneDescriptions.casual;
  const lengthConf = lengthConfig[length] || lengthConfig.medium;

  let characterSection = "";
  if (characters.length > 0) {
    const charDescriptions = characters
      .map((c, i) => {
        let desc = `Character ${i + 1}: ${c.name}`;
        if (c.personality) desc += ` - Personality: ${c.personality}`;
        if (c.role) desc += ` - Role: ${c.role}`;
        return desc;
      })
      .join("\n");
    characterSection = `
## Characters
${charDescriptions}
`;
  }

  const settingSection = setting
    ? `
## Setting
${setting}
`
    : "";

  const narrationInstruction = includeNarration
    ? "Include brief narrative descriptions between dialogue lines to set the scene, describe actions, and convey emotions."
    : "Focus purely on dialogue without narrative descriptions.";

  const systemPrompt = `You are an expert dialogue writer and screenwriter. Your task is to create compelling, realistic, and engaging dialogue based on the user's scenario.

## Output Requirements
- Write the dialogue in ${lang.english} (${lang.native})
- Create a ${isZh ? typeDesc.zh : typeDesc.en}
- Maintain a ${isZh ? toneDesc.zh : toneDesc.en} tone throughout
- Generate approximately ${lengthConf.exchanges} dialogue exchanges (${lengthConf.description})
- ${narrationInstruction}
- Each character should have a distinct voice and speaking style
- The dialogue should feel natural and authentic
- Include subtext and emotional undertones where appropriate
${characterSection}${settingSection}
## Formatting Guidelines
- Use character names followed by a colon for each line of dialogue
- Example format:
  **Character Name:** "Dialogue line here."
  
  *Brief narrative description if narration is enabled.*
  
  **Another Character:** "Response here."

- Make the dialogue flow naturally with realistic interruptions, pauses, and reactions
- Avoid exposition dumps - reveal information organically through conversation

## Scenario
${prompt}

Now write the dialogue based on the above scenario and requirements.`;

  return systemPrompt;
}
