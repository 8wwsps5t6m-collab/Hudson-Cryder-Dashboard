"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SyncResponse = {
  ok?: boolean;
  error?: string;
  synced?: number;
  inserted?: number;
  updated?: number;
};

/** Calls `/api/sync-tiktok` and refreshes the library when finished. */
export function TikTokSyncButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  async function handleClick() {
    setPending(true);
    setNotice(null);
    try {
      const res = await fetch("/api/sync-tiktok", { method: "POST" });
      const body = (await res.json()) as SyncResponse;
      if (!res.ok || body.ok === false) {
        setNotice({
          tone: "error",
          text: body.error ?? "Sync failed.",
        });
        return;
      }
      const synced = body.synced ?? 0;
      const inserted = body.inserted ?? 0;
      const updated = body.updated ?? 0;
      setNotice({
        tone: "success",
        text: `Synced ${synced} video${synced === 1 ? "" : "s"} (${inserted} new, ${updated} updated).`,
      });
      router.refresh();
    } catch (err) {
      setNotice({
        tone: "error",
        text:
          err instanceof Error ? err.message : "Something went wrong while syncing.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 shadow-sm transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            Syncing…
          </>
        ) : (
          "Sync TikTok"
        )}
      </button>
      {notice?.tone === "success" ? (
        <p className="text-sm text-emerald-400" role="status">
          {notice.text}
        </p>
      ) : null}
      {notice?.tone === "error" ? (
        <p className="text-sm text-red-400" role="alert">
          {notice.text}
        </p>
      ) : null}
    </div>
  );
}
