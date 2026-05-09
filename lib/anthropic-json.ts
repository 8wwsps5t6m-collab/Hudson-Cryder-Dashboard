/** Strips markdown code fences before JSON.parse when Claude wraps output in ```json blocks. */
export function cleanClaudeJsonText(text: string): string {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return cleaned;
}
