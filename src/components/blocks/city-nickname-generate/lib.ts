export function pickRandomCityNicknamePreset<T>(presets: T[]) {
  if (!presets.length) return null;
  return presets[Math.floor(Math.random() * presets.length)];
}
