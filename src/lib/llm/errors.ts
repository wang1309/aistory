export function publicErrorMessage(status: number): string {
  if (status === 401 || status === 403 || status === 402) {
    // Provider auth/quota problems are internal: never surface them as the
    // user's own credit or permission issue.
    return "AI service is temporarily unavailable";
  }
  if (status === 429) {
    return "AI service is busy, please retry";
  }
  if (status >= 500) {
    return "AI service temporarily unavailable";
  }
  return "AI request failed";
}
