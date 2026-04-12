/**
 * Parses shorthand counts: "1200", "1,200", "16.7K", "1.2M" (case-insensitive).
 * Returns a non-negative integer, or NaN if the value cannot be parsed.
 */
export function parseCountShorthand(input: unknown): number {
  if (input === null || input === undefined) {
    return 0;
  }
  const raw = String(input).trim().replace(/,/g, "");
  if (raw === "") {
    return 0;
  }

  const m = raw.match(/^(\d+(?:\.\d+)?)\s*([kKmM]?)$/);
  if (!m) {
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) {
      return Number.NaN;
    }
    return Math.floor(n);
  }

  const base = Number(m[1]);
  if (!Number.isFinite(base) || base < 0) {
    return Number.NaN;
  }

  const suffix = (m[2] || "").toLowerCase();
  const mult = suffix === "k" ? 1000 : suffix === "m" ? 1_000_000 : 1;
  if (suffix !== "" && suffix !== "k" && suffix !== "m") {
    return Number.NaN;
  }

  return Math.round(base * mult);
}
