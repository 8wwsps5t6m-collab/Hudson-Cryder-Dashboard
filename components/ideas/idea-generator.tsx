"use client";

import { useMemo, useState } from "react";
import type { GeneratedIdea } from "@/lib/ideas/types";

type SaveState = {
  saved: boolean;
  loading: boolean;
  error?: string;
};

type GenerateResponse = {
  ideas: GeneratedIdea[];
};

const initialSaveState: SaveState = {
  saved: false,
  loading: false,
};

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const json = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    const errorMessage = typeof json.error === "string" ? json.error : "Request failed";
    throw new Error(errorMessage);
  }
  return json;
}

export function IdeaGenerator() {
  const [topic, setTopic] = useState("");
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [saveByIndex, setSaveByIndex] = useState<Record<number, SaveState>>({});

  const hasIdeas = ideas.length > 0;

  const saveMap = useMemo(() => saveByIndex, [saveByIndex]);

  async function onGenerateIdeas() {
    setGenerateError(null);
    setIsGenerating(true);

    try {
      const res = await fetch("/api/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() || undefined }),
      });

      const data = await parseJsonOrThrow<GenerateResponse>(res);
      setIdeas(data.ideas);
      setSaveByIndex({});
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate ideas";
      setGenerateError(message);
      setIdeas([]);
    } finally {
      setIsGenerating(false);
    }
  }

  async function onSaveIdea(index: number) {
    const idea = ideas[index];
    if (!idea) {
      return;
    }

    setSaveByIndex((prev) => ({
      ...prev,
      [index]: { ...initialSaveState, loading: true },
    }));

    try {
      const res = await fetch("/api/save-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(idea),
      });

      await parseJsonOrThrow<{ ok: true }>(res);
      setSaveByIndex((prev) => ({
        ...prev,
        [index]: { saved: true, loading: false },
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save idea";
      setSaveByIndex((prev) => ({
        ...prev,
        [index]: { saved: false, loading: false, error: message },
      }));
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 sm:p-5">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Idea Generator
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Generate TikTok ideas from your recent performance. Add an optional theme
          to steer results.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 focus:ring-2"
            placeholder="Optional topic (e.g. morning routine, outfit ideas, gym motivation)"
          />
          <button
            type="button"
            onClick={onGenerateIdeas}
            disabled={isGenerating}
            className="accent-button shrink-0"
          >
            {isGenerating ? "Generating…" : "Generate Ideas"}
          </button>
        </div>

        {generateError ? (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {generateError}
          </p>
        ) : null}
      </section>

      <section>
        {hasIdeas ? (
          <ul className="grid gap-4 lg:grid-cols-2">
            {ideas.map((idea, index) => {
              const saveState = saveMap[index] ?? initialSaveState;

              return (
                <li
                  key={`${idea.title}-${index}`}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-semibold leading-tight text-zinc-100">
                      {idea.title}
                    </h2>
                    <span className="shrink-0 rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-300">
                      {idea.format_type}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Why it&apos;ll perform
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                        {idea.why_it_will_perform}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Filming notes
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                        {idea.filming_notes}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => onSaveIdea(index)}
                      disabled={saveState.loading || saveState.saved}
                      className="rounded-md border border-zinc-600 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-indigo-400/60 hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saveState.saved
                        ? "Saved"
                        : saveState.loading
                          ? "Saving…"
                          : "Save Idea"}
                    </button>
                    {saveState.error ? (
                      <p className="mt-2 text-xs text-red-400">{saveState.error}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-zinc-700 p-6 text-center text-sm text-zinc-500">
            Generate ideas to see cards here.
          </p>
        )}
      </section>
    </div>
  );
}
