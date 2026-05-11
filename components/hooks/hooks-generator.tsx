"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { HOOK_FORMULAS } from "@/lib/hooks/formulas";

type FormulaResult = {
  hooks: string[];
  error?: string;
};

/** Grid of hook formulas + generate + stacked results (all formulas keep their last run). */
export function HooksGenerator() {
  const [byFormula, setByFormula] = useState<Record<string, FormulaResult>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const formulasWithResults = useMemo(() => {
    return HOOK_FORMULAS.filter((f) => (byFormula[f.id]?.hooks?.length ?? 0) > 0);
  }, [byFormula]);

  const orderedResults = useMemo(() => {
    const withHooks = formulasWithResults;
    if (!activeId) {
      return withHooks;
    }
    const active = withHooks.find((f) => f.id === activeId);
    const rest = withHooks.filter((f) => f.id !== activeId);
    return active ? [active, ...rest] : withHooks;
  }, [formulasWithResults, activeId]);

  const generate = useCallback(async (formulaId: string) => {
    const formula = HOOK_FORMULAS.find((f) => f.id === formulaId);
    if (!formula) {
      return;
    }

    setActiveId(formulaId);
    setLoadingId(formulaId);
    setByFormula((prev) => ({
      ...prev,
      [formulaId]: { hooks: prev[formulaId]?.hooks ?? [], error: undefined },
    }));

    try {
      const res = await fetch("/api/generate-hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formulaType: formula.name,
          formulaDescription: formula.description,
        }),
      });
      const data = (await res.json()) as { hooks?: string[]; error?: string };

      if (!res.ok || data.error) {
        setByFormula((prev) => ({
          ...prev,
          [formulaId]: {
            hooks: prev[formulaId]?.hooks ?? [],
            error: data.error ?? "Something went wrong.",
          },
        }));
        return;
      }

      const hooks = Array.isArray(data.hooks) ? data.hooks : [];
      setByFormula((prev) => ({
        ...prev,
        [formulaId]: { hooks, error: undefined },
      }));
    } catch {
      setByFormula((prev) => ({
        ...prev,
        [formulaId]: {
          hooks: prev[formulaId]?.hooks ?? [],
          error: "Network error. Try again.",
        },
      }));
    } finally {
      setLoadingId(null);
    }
  }, []);

  const copyHook = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      setCopiedKey(null);
    }
  }, []);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Hooks
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Pick a psychological formula, then generate 10 on-camera openers in your
          voice. Results stay on screen per formula so you can compare runs.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {HOOK_FORMULAS.map((f) => {
          const isActive = activeId === f.id;
          const isLoading = loadingId === f.id;
          return (
            <article
              key={f.id}
              className={`flex flex-col rounded-lg border bg-zinc-950/50 p-4 transition-colors ${
                isActive
                  ? "border-indigo-500/50 ring-1 ring-indigo-500/20"
                  : "border-zinc-800"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold text-zinc-100">{f.name}</h2>
                {isActive ? (
                  <span className="shrink-0 rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-indigo-200">
                    Active
                  </span>
                ) : null}
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
                {f.description}
              </p>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => void generate(f.id)}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Generating…
                  </>
                ) : (
                  "Generate Hooks"
                )}
              </button>
              {byFormula[f.id]?.error ? (
                <p className="mt-2 text-xs text-red-400" role="alert">
                  {byFormula[f.id]?.error}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      {orderedResults.length > 0 ? (
        <section aria-labelledby="generated-hooks-heading" className="space-y-6">
          <h2
            id="generated-hooks-heading"
            className="text-sm font-medium text-zinc-300"
          >
            Generated hooks
          </h2>
          {orderedResults.map((f) => {
            const result = byFormula[f.id];
            if (!result?.hooks?.length) {
              return null;
            }
            const isActiveBlock = activeId === f.id;
            return (
              <div
                key={f.id}
                className={`rounded-lg border p-4 ${
                  isActiveBlock
                    ? "border-indigo-500/40 bg-indigo-500/[0.06]"
                    : "border-zinc-800 bg-zinc-950/40"
                }`}
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-zinc-100">{f.name}</h3>
                  {isActiveBlock ? (
                    <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-indigo-200">
                      Active
                    </span>
                  ) : null}
                </div>
                <ul className="divide-y divide-zinc-800/80 rounded-md border border-zinc-800/80 bg-zinc-950/60">
                  {result.hooks.map((hook, i) => {
                    const key = `${f.id}-${i}`;
                    const copied = copiedKey === key;
                    return (
                      <li
                        key={key}
                        className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      >
                        <p className="min-w-0 flex-1 text-sm leading-relaxed text-zinc-200">
                          {hook}
                        </p>
                        <button
                          type="button"
                          onClick={() => void copyHook(hook, key)}
                          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-zinc-600 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800 sm:self-start"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" aria-hidden />
                              Copy
                            </>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </section>
      ) : (
        <p className="text-sm text-zinc-500">
          Choose a formula above and click{" "}
          <span className="font-medium text-zinc-400">Generate Hooks</span> to see
          lines here.
        </p>
      )}
    </div>
  );
}
