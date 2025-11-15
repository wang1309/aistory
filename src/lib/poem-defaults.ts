/**
 * Smart Default Values System for Poem Generator
 * Provides intelligent defaults based on poem type to reduce cognitive load in Simple Mode
 */

export interface PoemDefaults {
  length: 'short' | 'medium' | 'long';
  rhymeScheme: string | null;
  theme: string | null;
  mood: string | null;
  style: string | null;
  cipai: string | null;
  strictTone: boolean;
}

/**
 * Get default options for a specific poem type
 */
export function getDefaultOptions(poemType: 'modern' | 'classical' | 'format' | 'lyric'): PoemDefaults {
  const defaults: Record<string, PoemDefaults> = {
    modern: {
      length: 'medium',
      rhymeScheme: 'free',
      theme: null, // Let user's prompt determine theme
      mood: null, // Let user's prompt determine mood
      style: 'modernism',
      cipai: null,
      strictTone: false,
    },
    classical: {
      length: 'short',
      rhymeScheme: '七言绝句',
      theme: null,
      mood: null,
      style: 'classical',
      cipai: null,
      strictTone: true,
    },
    format: {
      length: 'short',
      rhymeScheme: 'haiku',
      theme: null,
      mood: null,
      style: 'minimalism',
      cipai: null,
      strictTone: false,
    },
    lyric: {
      length: 'medium',
      rhymeScheme: 'verse_chorus',
      theme: null,
      mood: 'joyful',
      style: 'romantic',
      cipai: null,
      strictTone: false,
    },
  };

  return defaults[poemType] || defaults.modern;
}

/**
 * Get recommended model for Simple Mode based on poem type
 */
export function getRecommendedModel(poemType: 'modern' | 'classical' | 'format' | 'lyric'): string {
  const recommendations: Record<string, string> = {
    modern: 'creative', // Modern poetry benefits from creative thinking
    classical: 'standard', // Classical requires balance of tradition and quality
    format: 'fast', // Format poetry has strict rules, fast is sufficient
    lyric: 'creative', // Lyrics need catchiness and creativity
  };

  return recommendations[poemType] || 'standard';
}

/**
 * Mode preference storage key
 */
export const MODE_STORAGE_KEY = 'poem-generator-mode';

/**
 * Get saved mode preference
 */
export function getSavedMode(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const saved = localStorage.getItem(MODE_STORAGE_KEY);
    return saved === 'advanced';
  } catch {
    return false;
  }
}

/**
 * Save mode preference
 */
export function saveMode(advancedMode: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(MODE_STORAGE_KEY, advancedMode ? 'advanced' : 'simple');
  } catch (error) {
    console.error('Failed to save mode preference:', error);
  }
}
