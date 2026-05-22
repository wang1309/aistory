import { ComicGenerateOptions } from "@/types/comic";

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
};

const comicStyleDescriptions: Record<string, string> = {
  manga:
    "Japanese manga style — expressive characters, dramatic panel transitions, speed lines for action, and emotionally charged close-ups",
  webtoon:
    "Korean vertical-scroll webtoon style — clean art direction, emotional pacing suited for mobile reading, and natural character interactions",
  comic_strip:
    "Short-form comic strip — a tight setup with a clear punchline, twist, or emotional payoff in the final panel",
  graphic_novel:
    "Cinematic graphic novel style — rich scene-setting, layered dialogue, and deliberate visual storytelling beats",
  superhero:
    "Western superhero comic style — bold action beats, heroic dialogue, and high-stakes dramatic reveals",
  slice_of_life:
    "Slice-of-life style — everyday realism, subtle emotional moments, and understated character dynamics",
  humor:
    "Gag / humor comic — snappy comedic timing, physical comedy setups, and a strong punchline or visual gag at the end",
  drama:
    "Drama-focused comic — character-driven conflict, slow-burn tension, and emotionally resonant dialogue",
};

const narrationModeInstructions: Record<string, string> = {
  none: "Do NOT include any narration or caption boxes. Use only character dialogue.",
  light:
    "Include brief caption boxes only at major scene transitions or when setting up context.",
  cinematic:
    "Use cinematic narration boxes to set mood, describe passage of time, and bridge panels with atmospheric text.",
  webtoon:
    "Use webtoon-style caption bars — simple, emotionally direct text strips at the top or bottom of key panels.",
};

const readingFormatDescriptions: Record<string, string> = {
  ltr: "Left to right (standard Western comic format)",
  rtl: "Right to left (traditional manga format)",
  vertical: "Vertical scroll (webtoon format, designed for mobile)",
};

export function buildComicPrompt(options: ComicGenerateOptions): string {
  const {
    prompt,
    locale,
    characters = [],
    comicStyle = "manga",
    panelCount = "6",
    tone = "dramatic",
    setting,
    narrationMode = "light",
    sceneGoal,
    readingFormat = "ltr",
  } = options;

  const lang = languageNames[locale] || languageNames.en;
  const styleDesc = comicStyleDescriptions[comicStyle] || comicStyleDescriptions.manga;
  const narrationInst =
    narrationModeInstructions[narrationMode] || narrationModeInstructions.light;
  const readingDesc =
    readingFormatDescriptions[readingFormat] || readingFormatDescriptions.ltr;

  const characterSection =
    characters.filter((c) => c.name?.trim()).length > 0
      ? `## Characters\n${characters
          .filter((c) => c.name?.trim())
          .map((c, i) => {
            let desc = `Character ${i + 1}: ${c.name}`;
            if (c.personality) desc += ` — Personality: ${c.personality}`;
            if (c.role) desc += ` — Role: ${c.role}`;
            return desc;
          })
          .join("\n")}\n\n`
      : "";

  const settingSection = setting?.trim()
    ? `## Setting / Location\n${setting}\n\n`
    : "";

  const sceneGoalSection = sceneGoal?.trim()
    ? `## Scene Goal\nThis scene should build toward: ${sceneGoal}\n\n`
    : "";

  return `You are a professional comic script writer with deep expertise in manga, webtoon, and western comics. Your task is to generate a structured, panel-by-panel comic script.

## Story Idea
${prompt}

## Comic Style
${styleDesc}

## Panel Structure
Generate exactly ${panelCount} panels.
Reading format: ${readingDesc}

## Tone
${tone}

## Narration Style
${narrationInst}

${characterSection}${settingSection}${sceneGoalSection}## Output Format — Follow this EXACTLY for every panel:

**Panel [N]**
- **Action:** [Describe the visual scene: character positions, expressions, environment, camera angle, and mood]
- **Dialogue:**
  - [Character Name]: "[Spoken line — keep under 25 words for speech-bubble readability]"
  - [Character Name]: "[Response — keep concise and in-character]"
- **Narration/Caption:** [Caption text or "None"]

## Script Writing Rules
1. Keep dialogue concise — each speech bubble should be under 25 words. Avoid walls of text.
2. Vary panel pacing: mix action-heavy panels, dialogue panels, and silent/reaction panels.
3. Every character must have a distinct speaking voice based on their personality.
4. Use the final panel for a strong emotional payoff, punchline, or cliffhanger.
5. Action descriptions should be vivid but brief — think in terms of what an artist needs to draw.
6. ⚠️ IMPORTANT: Write the ENTIRE script in ${lang.english} (${lang.native}). Do NOT mix languages.

Now generate the complete ${panelCount}-panel comic script:`;
}
