"use client";

import { Check, Copy, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { HOOK_BANK } from "@/lib/hooks/hook-bank";

type ScriptResult = { script: string; duration: string };

type ChatTurn = { role: "user" | "assistant"; content: string };

/** Hook list → generate script → inline studio (script + chat editor). */
export function HookBank() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [topicByIndex, setTopicByIndex] = useState<Record<number, string>>({});
  const [resultByIndex, setResultByIndex] = useState<
    Record<number, ScriptResult>
  >({});
  const [errorByIndex, setErrorByIndex] = useState<Record<number, string>>({});
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const [studioIndex, setStudioIndex] = useState<number | null>(null);
  const [studioScript, setStudioScript] = useState("");
  const [studioDuration, setStudioDuration] = useState("");
  const [editChat, setEditChat] = useState<ChatTurn[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [studioCopied, setStudioCopied] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [editChat, editLoading]);

  const closeStudio = useCallback(() => {
    setStudioIndex(null);
    setStudioScript("");
    setStudioDuration("");
    setEditChat([]);
    setChatDraft("");
    setEditLoading(false);
    setStudioCopied(false);
  }, []);

  const openStudioFromResult = useCallback((i: number) => {
    const result = resultByIndex[i];
    if (!result) {
      return;
    }
    setStudioIndex(i);
    setStudioScript(result.script);
    setStudioDuration(result.duration);
    setEditChat([]);
    setChatDraft("");
    setStudioCopied(false);
  }, [resultByIndex]);

  const toggle = useCallback(
    (i: number) => {
      if (studioIndex !== null) {
        return;
      }
      setOpenIndex((cur) => (cur === i ? null : i));
      setStudioCopied(false);
    },
    [studioIndex],
  );

  const setTopic = useCallback((i: number, value: string) => {
    setTopicByIndex((prev) => ({ ...prev, [i]: value }));
  }, []);

  const generate = useCallback(async (i: number) => {
    const hook = HOOK_BANK[i];
    const topic = (topicByIndex[i] ?? "").trim();
    if (!topic) {
      setErrorByIndex((prev) => ({
        ...prev,
        [i]: "Add what your video is about first.",
      }));
      return;
    }

    setLoadingIndex(i);
    setErrorByIndex((prev) => {
      const next = { ...prev };
      delete next[i];
      return next;
    });

    try {
      const res = await fetch("/api/generate-hook-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hook, topic }),
      });
      const data = (await res.json()) as ScriptResult & { error?: string };

      if (!res.ok || data.error) {
        setErrorByIndex((prev) => ({
          ...prev,
          [i]: data.error ?? "Could not generate script.",
        }));
        return;
      }

      setResultByIndex((prev) => ({
        ...prev,
        [i]: { script: data.script, duration: data.duration },
      }));
      setStudioIndex(i);
      setStudioScript(data.script);
      setStudioDuration(data.duration);
      setEditChat([]);
      setChatDraft("");
    } catch {
      setErrorByIndex((prev) => ({
        ...prev,
        [i]: "Network error. Try again.",
      }));
    } finally {
      setLoadingIndex(null);
    }
  }, [topicByIndex]);

  const copyStudioScript = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(studioScript);
      setStudioCopied(true);
      window.setTimeout(() => setStudioCopied(false), 2000);
    } catch {
      setStudioCopied(false);
    }
  }, [studioScript]);

  const sendEdit = useCallback(async () => {
    const text = chatDraft.trim();
    if (!text || studioIndex === null || editLoading) {
      return;
    }

    const historySnapshot = [...editChat];
    const scriptSnapshot = studioScript;
    setChatDraft("");
    setEditChat((prev) => [...prev, { role: "user", content: text }]);
    setEditLoading(true);

    try {
      const res = await fetch("/api/edit-hook-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentScript: scriptSnapshot,
          userMessage: text,
          chatHistory: historySnapshot,
        }),
      });
      const data = (await res.json()) as {
        script?: string;
        message?: string;
        error?: string;
      };

      if (!res.ok || data.error || !data.script || !data.message) {
        setEditChat((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              data.error ??
              "Couldn’t apply that edit. Try rephrasing or shortening the request.",
          },
        ]);
        return;
      }

      const nextScript = data.script;
      const assistantMessage = data.message;

      setStudioScript(nextScript);
      setResultByIndex((prev) => ({
        ...prev,
        [studioIndex]: {
          script: nextScript,
          duration: prev[studioIndex]?.duration ?? studioDuration,
        },
      }));
      setEditChat((prev) => [
        ...prev,
        { role: "assistant", content: assistantMessage },
      ]);
    } catch {
      setEditChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Network error. Try again.",
        },
      ]);
    } finally {
      setEditLoading(false);
    }
  }, [chatDraft, studioIndex, editLoading, editChat, studioScript, studioDuration]);

  const studioHook =
    studioIndex !== null ? HOOK_BANK[studioIndex] : "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Hook Bank
        </h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-400">
          20 proven hooks. Click one to build a script around it.
        </p>
      </div>

      {studioIndex !== null ? (
        <div className="rounded-xl border border-zinc-700/90 bg-zinc-950/80 shadow-xl shadow-black/40">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800 px-4 py-3 sm:px-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                  Hook {studioIndex + 1}
                </span>
                {studioDuration ? (
                  <span className="text-xs text-zinc-500">
                    Est. {studioDuration} to deliver
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-200">
                &ldquo;{studioHook}&rdquo;
              </p>
            </div>
            <button
              type="button"
              onClick={closeStudio}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-600 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Close
            </button>
          </div>

          <div className="grid gap-0 lg:grid-cols-5 lg:divide-x lg:divide-zinc-800">
            <div className="flex min-h-[min(70vh,640px)] flex-col border-b border-zinc-800 p-4 sm:p-5 lg:col-span-3 lg:border-b-0">
              <div className="mb-4 flex shrink-0 justify-end">
                <button
                  type="button"
                  onClick={() => void copyStudioScript()}
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
                >
                  {studioCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden />
                      Copy Script
                    </>
                  )}
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4 sm:p-6">
                <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-zinc-100 sm:text-lg sm:leading-relaxed">
                  {studioScript}
                </pre>
              </div>
            </div>

            <div className="flex min-h-[min(50vh,480px)] flex-col lg:col-span-2">
              <div className="border-b border-zinc-800 px-4 py-2 sm:px-5">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Edit with chat
                </h2>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4">
                <div className="space-y-3">
                  {editChat.length === 0 && !editLoading ? (
                    <p className="text-xs text-zinc-500">
                      Ask for changes — shorter, stronger ending, swap an exercise,
                      remove something you don&apos;t do, etc.
                    </p>
                  ) : null}
                  {editChat.map((m, idx) => (
                    <div
                      key={`${idx}-${m.role}`}
                      className={`rounded-lg px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "ml-4 border border-zinc-700/80 bg-zinc-800/60 text-zinc-100"
                          : "mr-4 border border-indigo-500/20 bg-indigo-500/10 text-indigo-100/95"
                      }`}
                    >
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                        {m.role === "user" ? "You" : "Assistant"}
                      </span>
                      {m.content}
                    </div>
                  ))}
                  {editLoading ? (
                    <div className="flex items-center gap-2 rounded-lg border border-zinc-700/60 px-3 py-2 text-sm text-zinc-400">
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                      Updating script…
                    </div>
                  ) : null}
                  <div ref={chatEndRef} />
                </div>
              </div>
              <div className="border-t border-zinc-800 p-3 sm:p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatDraft}
                    onChange={(e) => setChatDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendEdit();
                      }
                    }}
                    placeholder="e.g. Make the ending stronger…"
                    disabled={editLoading}
                    className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    disabled={editLoading || !chatDraft.trim()}
                    onClick={() => void sendEdit()}
                    className="shrink-0 rounded-md border border-indigo-500/40 bg-indigo-500/20 px-3 py-2 text-xs font-medium text-indigo-100 transition hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {studioIndex === null ? (
        <ol className="list-none space-y-3">
          {HOOK_BANK.map((hook, i) => {
            const isOpen = openIndex === i;
            const topic = topicByIndex[i] ?? "";
            const result = resultByIndex[i];
            const err = errorByIndex[i];
            const loading = loadingIndex === i;

            return (
              <li key={i}>
                <div
                  className={`rounded-lg border transition-colors ${
                    isOpen
                      ? "border-indigo-500/40 bg-indigo-500/[0.06]"
                      : "border-zinc-800 bg-zinc-950/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-zinc-900/40"
                    aria-expanded={isOpen}
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold tabular-nums text-zinc-300">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-medium leading-relaxed text-zinc-100">
                      &ldquo;{hook}&rdquo;
                    </span>
                  </button>

                  {isOpen ? (
                    <div className="space-y-4 border-t border-zinc-800/80 px-4 py-4">
                      <div>
                        <label
                          htmlFor={`hook-topic-${i}`}
                          className="mb-2 block text-xs font-medium text-zinc-400"
                        >
                          What&apos;s your video about?
                        </label>
                        <textarea
                          id={`hook-topic-${i}`}
                          value={topic}
                          onChange={(e) => setTopic(i, e.target.value)}
                          rows={3}
                          placeholder="e.g. morning routine, leg day mistakes, building a capsule wardrobe…"
                          className="w-full resize-y rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                        />
                      </div>

                      {err ? (
                        <p className="text-sm text-red-400" role="alert">
                          {err}
                        </p>
                      ) : null}

                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => void generate(i)}
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-indigo-500/40 bg-indigo-500/15 px-4 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating…
                          </>
                        ) : (
                          "Generate Script"
                        )}
                      </button>

                      {result && !loading ? (
                        <button
                          type="button"
                          onClick={() => openStudioFromResult(i)}
                          className="inline-flex items-center gap-2 rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
                        >
                          Open script studio
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}
