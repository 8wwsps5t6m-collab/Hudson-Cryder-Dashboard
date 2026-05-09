"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type HashtagGroups = {
  broad: string[];
  mid: string[];
  niche: string[];
};

type GenerateHashtagsSuccess = {
  hashtags: HashtagGroups;
};

type GenerateHashtagsError = {
  error?: string;
};

const EMPTY_GROUPS: HashtagGroups = {
  broad: [],
  mid: [],
  niche: [],
};

function formatHashtagsForCopy(hashtags: string[]) {
  return hashtags.join(" ");
}

function tierLabel(tier: keyof HashtagGroups) {
  if (tier === "broad") return "Broad";
  if (tier === "mid") return "Mid";
  return "Niche";
}

export function HashtagGenerator({ isEnabled }: { isEnabled: boolean }) {
  const [topic, setTopic] = useState("");
  const [hashtags, setHashtags] = useState<HashtagGroups>(EMPTY_GROUPS);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedKey, setCopiedKey] = useState("");
  /** Live check from /api/anthropic-status — avoids stale SSR when .env.local has the key. */
  const [remoteConfigured, setRemoteConfigured] = useState<boolean | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/anthropic-status")
      .then((res) => res.json())
      .then((data: { configured?: boolean }) => {
        if (!cancelled) setRemoteConfigured(Boolean(data.configured));
      })
      .catch(() => {
        if (!cancelled) setRemoteConfigured(isEnabled);
      });
    return () => {
      cancelled = true;
    };
  }, [isEnabled]);

  const enabled =
    remoteConfigured !== undefined ? remoteConfigured : isEnabled;

  const showMissingKeyBanner =
    !enabled && remoteConfigured !== undefined;

  const fullRecommendedSet = useMemo(
    () => [...hashtags.broad, ...hashtags.mid, ...hashtags.niche],
    [hashtags],
  );

  async function copyText(value: string, key: string) {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? "" : current));
      }, 1200);
    } catch {
      setErrorMessage("Could not copy right now. Please try again.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setCopiedKey("");

    if (!enabled) {
      setErrorMessage("Hashtag generation is disabled until API keys are enabled.");
      return;
    }

    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setErrorMessage("Please enter a topic first.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/generate-hashtags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: trimmedTopic }),
      });

      const payload = (await response.json()) as
        | GenerateHashtagsSuccess
        | GenerateHashtagsError;

      if (!response.ok || !("hashtags" in payload)) {
        const maybeError = (payload as GenerateHashtagsError).error;
        setHashtags(EMPTY_GROUPS);
        setErrorMessage(maybeError ?? "Failed to generate hashtags.");
        return;
      }

      setHashtags(payload.hashtags);
    } catch {
      setHashtags(EMPTY_GROUPS);
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        {showMissingKeyBanner ? (
          <p className="rounded-md border border-amber-900/70 bg-amber-950/20 p-3 text-sm text-amber-300">
            Coming soon: add your Anthropic API key in <code>.env.local</code> to
            enable hashtag generation.
          </p>
        ) : null}
        <label className="block">
          <span className="mb-1 block text-xs text-zinc-500">Topic</span>
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            type="text"
            placeholder="morning routine"
            disabled={!enabled}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={!enabled || isLoading}
            className="accent-button"
          >
            {isLoading ? "Generating…" : "Generate Hashtags"}
          </button>
          <button
            type="button"
            disabled={fullRecommendedSet.length === 0}
            onClick={() =>
              copyText(formatHashtagsForCopy(fullRecommendedSet), "all")
            }
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition-colors hover:border-indigo-400/60 hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {copiedKey === "all" ? "Copied!" : "Copy All"}
          </button>
        </div>
      </form>

      {errorMessage ? (
        <p className="text-sm text-red-400" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        {(["broad", "mid", "niche"] as const).map((tier) => (
          <section
            key={tier}
            className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-zinc-200">
                {tierLabel(tier)}
              </h3>
              <button
                type="button"
                disabled={hashtags[tier].length === 0}
                onClick={() =>
                  copyText(
                    formatHashtagsForCopy(hashtags[tier]),
                    `tier-${tier}`,
                  )
                }
                className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 transition-colors hover:border-indigo-400/60 hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {copiedKey === `tier-${tier}` ? "Copied!" : "Copy All"}
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {hashtags[tier].length} hashtags
            </p>
            <ul className="mt-3 space-y-1">
              {hashtags[tier].length > 0 ? (
                hashtags[tier].map((hashtag) => (
                  <li key={`${tier}-${hashtag}`} className="text-sm text-zinc-300">
                    {hashtag}
                  </li>
                ))
              ) : (
                <li className="text-sm text-zinc-500">No hashtags yet.</li>
              )}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
