import { createClient } from "@supabase/supabase-js";

/** Retries transient TLS/DNS blips that surface as `TypeError: fetch failed` in Node. */
function createRetryFetch(base: typeof fetch): typeof fetch {
  return async (input, init) => {
    let lastError: unknown;

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 200 * attempt));
      }

      try {
        return await base(input, init);
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError;
  };
}

function normalizeSupabaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(
      "Invalid NEXT_PUBLIC_SUPABASE_URL — copy the Project URL from Supabase → Settings → API",
    );
  }

  if (parsed.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must use https");
  }

  return trimmed;
}

// Builds a Supabase client using the public anon / publishable key. Safe for browser
// or server Route Handlers when only anon access is required.

export function createSupabaseClient() {
  const urlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!urlRaw || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  const url = normalizeSupabaseUrl(urlRaw);
  const fetchImpl = createRetryFetch(globalThis.fetch.bind(globalThis));

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: fetchImpl,
    },
  });
}
