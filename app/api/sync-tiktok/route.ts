import { NextResponse } from "next/server";
import type { ApifyRunRecord } from "@/lib/apify/tiktok-scraper";
import {
  extractPostedAtIso,
  extractVideoCounts,
  extractVideoUrl,
  fetchDatasetItems,
  startTikTokProfileRun,
  waitForRunCompletion,
} from "@/lib/apify/tiktok-scraper";
import { engagementRate, computePerformanceScore } from "@/lib/metrics";
import { createSupabaseClient } from "@/lib/supabase/client";

/** Apify can take several minutes for profile scrapes; extend on Vercel if needed. */
export const maxDuration = 300;

const DEFAULT_PROFILE = "hudson_cryder";

/** Normalize TikTok video URLs for stable deduplication. */
function canonicalVideoUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    u.search = "";
    let path = u.pathname.replace(/\/+$/, "");
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }
    u.pathname = path || "/";
    return u.toString();
  } catch {
    return raw.trim();
  }
}

function syncRates(
  views: number,
  likes: number,
  comments: number,
  shares: number,
  saves: number,
) {
  const v = Math.max(views, 0);
  const engagement_rate = engagementRate(likes, comments, shares, saves, views);
  const save_rate = v === 0 ? 0 : saves / v;
  const comment_rate = v === 0 ? 0 : comments / v;
  const share_rate = v === 0 ? 0 : shares / v;
  return { engagement_rate, save_rate, comment_rate, share_rate };
}

export async function POST() {
  const token = process.env.APIFY_API_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Missing APIFY_API_TOKEN. Add it to .env.local for TikTok sync.",
      },
      { status: 503 },
    );
  }

  const profile =
    process.env.TIKTOK_SYNC_PROFILE?.trim().replace(/^@/, "") ||
    DEFAULT_PROFILE;

  const initialWaitSec = 300;
  const pollBudgetMs = 12 * 60 * 1000;

  let run: ApifyRunRecord;

  try {
    run = await startTikTokProfileRun(token, profile, initialWaitSec);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to start Apify scraper run.";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 502 },
    );
  }

  const terminalBad = new Set(["FAILED", "ABORTED", "TIMED-OUT", "TIMED_OUT"]);
  if (terminalBad.has(run.status)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Apify run ended with status ${run.status}. Check the run in the Apify console.`,
      },
      { status: 502 },
    );
  }

  if (run.status !== "SUCCEEDED") {
    try {
      run = await waitForRunCompletion(token, run.id, {
        pollMs: 5000,
        maxWaitMs: pollBudgetMs,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Apify run timed out.";
      return NextResponse.json({ ok: false, error: message }, { status: 504 });
    }
  }

  if (run.status !== "SUCCEEDED") {
    return NextResponse.json(
      {
        ok: false,
        error: `Apify run finished with status ${run.status ?? "unknown"}.`,
      },
      { status: 502 },
    );
  }

  const datasetId = run.defaultDatasetId;
  if (!datasetId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Apify run succeeded but returned no dataset id.",
      },
      { status: 502 },
    );
  }

  let items: Record<string, unknown>[];
  try {
    items = await fetchDatasetItems(token, datasetId);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load Apify dataset.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }

  const supabase = createSupabaseClient();
  const nowIso = new Date().toISOString();

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const raw of items) {
    const item = raw as Record<string, unknown>;
    const urlRaw = extractVideoUrl(item);
    if (!urlRaw) {
      skipped += 1;
      continue;
    }

    const url = canonicalVideoUrl(urlRaw);
    const postedAt = extractPostedAtIso(item);
    if (!postedAt) {
      skipped += 1;
      continue;
    }

    const counts = extractVideoCounts(item);
    const views = Math.round(counts.playCount);
    const likes = Math.round(counts.diggCount);
    const comments = Math.round(counts.commentCount);
    const shares = Math.round(counts.shareCount);
    const saves = Math.round(counts.collectCount);

    const rates = syncRates(views, likes, comments, shares, saves);
    const performance_score = computePerformanceScore(
      views,
      likes,
      comments,
      shares,
      saves,
    );

    const syncFields = {
      url,
      views,
      likes,
      comments,
      shares,
      saves,
      date_posted: postedAt,
      performance_score,
      engagement_rate: rates.engagement_rate,
      save_rate: rates.save_rate,
      comment_rate: rates.comment_rate,
      share_rate: rates.share_rate,
      updated_at: nowIso,
    };

    const { data: existing, error: selectError } = await supabase
      .from("videos")
      .select("id")
      .eq("url", url)
      .maybeSingle();

    if (selectError) {
      return NextResponse.json(
        {
          ok: false,
          error: `Database error while checking existing video: ${selectError.message}`,
        },
        { status: 503 },
      );
    }

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from("videos")
        .update(syncFields)
        .eq("id", existing.id);

      if (updateError) {
        return NextResponse.json(
          {
            ok: false,
            error: `Failed to update video: ${updateError.message}`,
          },
          { status: 503 },
        );
      }
      updated += 1;
    } else {
      const { error: insertError } = await supabase.from("videos").insert({
        ...syncFields,
        hook_type: "both",
        format_type: "other",
        hook_text: null,
        notes: null,
      });

      if (insertError) {
        return NextResponse.json(
          {
            ok: false,
            error: `Failed to insert video: ${insertError.message}`,
          },
          { status: 503 },
        );
      }
      inserted += 1;
    }
  }

  const synced = inserted + updated;

  return NextResponse.json({
    ok: true,
    profile,
    synced,
    inserted,
    updated,
    skipped,
    totalItems: items.length,
  });
}
