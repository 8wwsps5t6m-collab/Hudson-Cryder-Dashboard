/** Supabase/Cloudflare sometimes returns an HTML error page; never dump that into the UI. */
function sanitizeSupabaseMessage(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "Unknown error";
  }

  if (
    /<!DOCTYPE\s+html/i.test(trimmed) ||
    /<html[\s>]/i.test(trimmed) ||
    /cloudflare/i.test(trimmed)
  ) {
    if (/521|Web server is down/i.test(trimmed)) {
      return (
        "Supabase’s API returned HTTP 521 (origin unreachable). " +
        "That’s usually a short outage on Supabase’s side — wait a few minutes and retry. " +
        "Check https://status.supabase.com. Your app URL in .env should be https://YOUR-REF.supabase.co"
      );
    }
    if (/5\d{2}/.test(trimmed)) {
      return (
        "Supabase returned an error page instead of data (likely a temporary server issue). " +
        "Retry shortly; see https://status.supabase.com"
      );
    }
    return (
      "Could not reach Supabase (unexpected HTML response). " +
      "Verify NEXT_PUBLIC_SUPABASE_URL in .env.local and try again."
    );
  }

  return trimmed.length > 400 ? `${trimmed.slice(0, 397)}…` : trimmed;
}

/** Turns nested fetch / Undici errors into a readable string for the UI. */
export function describeFetchFailure(error: unknown): string {
  const parts: string[] = [];
  let cur: unknown = error;
  let depth = 0;

  while (cur && depth < 10) {
    if (cur instanceof Error) {
      parts.push(cur.message);
      cur = cur.cause;
    } else if (typeof cur === "object" && cur !== null && "message" in cur) {
      parts.push(String((cur as { message: unknown }).message));
      cur =
        "cause" in cur ? (cur as { cause?: unknown }).cause : undefined;
    } else {
      parts.push(String(cur));
      break;
    }
    depth++;
  }

  const joined = parts.filter(Boolean).join(" · ");
  if (!joined) {
    return "Unknown error";
  }

  if (/fetch failed/i.test(joined)) {
    return sanitizeSupabaseMessage(
      `${joined}. Confirm NEXT_PUBLIC_SUPABASE_URL (Dashboard → Settings → API), internet/VPN, and restart dev after editing .env.local.`,
    );
  }

  return sanitizeSupabaseMessage(joined);
}
