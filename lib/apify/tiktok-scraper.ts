/**
 * Apify clockworks/tiktok-scraper helpers: run actor, poll completion, read dataset.
 */

const APIFY_API_BASE = "https://api.apify.com/v2";

/** Actor id in Apify REST URLs uses ~ instead of /. */
export const TIKTOK_SCRAPER_ACTOR_ID = "clockworks~tiktok-scraper";

export type ApifyRunRecord = {
  id: string;
  status: string;
  defaultDatasetId?: string;
};

function coerceNumber(value: unknown): number {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === "string") {
    const n = Number(value.replace(/,/g, ""));
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

/** Parses statsV2 entries like [{ key: 'playCount', value: '123' }, ...]. */
function countsFromStatsV2(item: Record<string, unknown>): Record<string, number> {
  const raw = item.statsV2;
  if (!Array.isArray(raw)) {
    return {};
  }
  const out: Record<string, number> = {};
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const e = entry as Record<string, unknown>;
    const key = typeof e.key === "string" ? e.key : "";
    if (!key) {
      continue;
    }
    out[key] = coerceNumber(e.value);
  }
  return out;
}

/** Pulls play/digg/comment/share/collect from flat fields, nested stats, or statsV2. */
export function extractVideoCounts(item: Record<string, unknown>): {
  playCount: number;
  diggCount: number;
  commentCount: number;
  shareCount: number;
  collectCount: number;
} {
  const v2 = countsFromStatsV2(item);
  const stats =
    item.stats && typeof item.stats === "object"
      ? (item.stats as Record<string, unknown>)
      : {};

  const playCount =
    coerceNumber(item.playCount) ||
    coerceNumber(stats.playCount) ||
    coerceNumber(v2.playCount);
  const diggCount =
    coerceNumber(item.diggCount) ||
    coerceNumber(stats.diggCount) ||
    coerceNumber(v2.diggCount);
  const commentCount =
    coerceNumber(item.commentCount) ||
    coerceNumber(stats.commentCount) ||
    coerceNumber(v2.commentCount);
  const shareCount =
    coerceNumber(item.shareCount) ||
    coerceNumber(stats.shareCount) ||
    coerceNumber(v2.shareCount);
  const collectCount =
    coerceNumber(item.collectCount) ||
    coerceNumber(stats.collectCount) ||
    coerceNumber(v2.collectCount);

  return {
    playCount,
    diggCount,
    commentCount,
    shareCount,
    collectCount,
  };
}

export function extractVideoUrl(item: Record<string, unknown>): string | null {
  const web = item.webVideoUrl;
  if (typeof web === "string" && web.startsWith("http")) {
    return web.trim();
  }
  const url = item.url;
  if (typeof url === "string" && url.startsWith("http")) {
    return url.trim();
  }
  return null;
}

export function extractPostedAtIso(item: Record<string, unknown>): string | null {
  const iso = item.createTimeISO;
  if (typeof iso === "string" && iso.length > 0) {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString();
    }
  }
  const ct = item.createTime;
  const n = coerceNumber(ct);
  if (n > 1e12) {
    return new Date(n).toISOString();
  }
  if (n > 1e9) {
    return new Date(n * 1000).toISOString();
  }
  return null;
}

/** Parses Apify JSON; unwraps `{ data: T }` when present; surfaces `{ error }` bodies. */
export async function apifyRequest<T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${APIFY_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const json = (await res.json()) as unknown;

  if (Array.isArray(json)) {
    return json as T;
  }

  const wrapped = json as {
    data?: T;
    error?: { message?: string; type?: string };
  };

  if (!res.ok) {
    const msg =
      wrapped?.error?.message ??
      wrapped?.error?.type ??
      `HTTP ${res.status}`;
    throw new Error(`Apify API ${path} failed: ${msg}`);
  }

  if (wrapped?.error) {
    throw new Error(
      `Apify API ${path} failed: ${wrapped.error.message ?? wrapped.error.type ?? "unknown"}`,
    );
  }

  if (
    wrapped &&
    typeof wrapped === "object" &&
    "data" in wrapped &&
    wrapped.data !== undefined
  ) {
    return wrapped.data as T;
  }

  return json as T;
}

type DatasetItemsPage = {
  items?: Record<string, unknown>[];
  count?: number;
  total?: number;
  limit?: number;
  offset?: number;
};

/** Starts actor run; optionally waits up to waitSeconds for finish. */
/** Profile scrape accepts a handle or full TikTok profile URL. */
function profileTarget(handleOrUrl: string): string {
  const raw = handleOrUrl.replace(/^@/, "").trim();
  if (raw.startsWith("http")) {
    return raw;
  }
  return `https://www.tiktok.com/@${raw}`;
}

export async function startTikTokProfileRun(
  token: string,
  profileHandle: string,
  waitSeconds: number,
): Promise<ApifyRunRecord> {
  const input = {
    profiles: [profileTarget(profileHandle)],
    resultsPerPage: 100,
    profileScrapeSections: ["videos"],
    profileSorting: "latest",
    excludePinnedPosts: false,
    proxyCountryCode: "None",
  };

  const qs = new URLSearchParams({
    waitForFinish: String(waitSeconds),
  });

  return apifyRequest<ApifyRunRecord>(
    token,
    `/acts/${TIKTOK_SCRAPER_ACTOR_ID}/runs?${qs.toString()}`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function getRun(token: string, runId: string): Promise<ApifyRunRecord> {
  return apifyRequest<ApifyRunRecord>(token, `/actor-runs/${runId}`);
}

/** Poll until run leaves RUNNING/READY or timeout. */
export async function waitForRunCompletion(
  token: string,
  runId: string,
  options: { pollMs: number; maxWaitMs: number },
): Promise<ApifyRunRecord> {
  const terminal = new Set([
    "SUCCEEDED",
    "FAILED",
    "ABORTED",
    "TIMED-OUT",
    "TIMED_OUT",
  ]);
  const start = Date.now();

  while (Date.now() - start < options.maxWaitMs) {
    const run = await getRun(token, runId);
    if (terminal.has(run.status)) {
      return run;
    }
    await new Promise((r) => setTimeout(r, options.pollMs));
  }

  throw new Error(
    `Apify run ${runId} did not finish within ${Math.round(options.maxWaitMs / 1000)}s`,
  );
}

export async function fetchDatasetItems(
  token: string,
  datasetId: string,
): Promise<Record<string, unknown>[]> {
  const pageSize = 1000;
  const all: Record<string, unknown>[] = [];
  let offset = 0;

  for (;;) {
    const qs = new URLSearchParams({
      clean: "true",
      format: "json",
      limit: String(pageSize),
      offset: String(offset),
    });

    const page = await apifyRequest<
      DatasetItemsPage | Record<string, unknown>[]
    >(token, `/datasets/${datasetId}/items?${qs.toString()}`);

    const batch = Array.isArray(page) ? page : page.items ?? [];
    if (!batch.length) {
      break;
    }
    all.push(...batch);
    const n = batch.length;
    if (n < pageSize) {
      break;
    }
    offset += pageSize;
  }

  return all;
}
