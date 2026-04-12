"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  upsertSnapshotAction,
  type SnapshotActionState,
} from "@/app/(app)/analytics/snapshot-actions";

function SubmitSnapshot() {
  const { pending } = useFormStatus();
  return pending ? "Saving…" : "Save snapshot";
}

export function SnapshotForm() {
  const initial: SnapshotActionState = {};
  const [rawState, formAction] = useFormState(upsertSnapshotAction, initial);
  const state = rawState ?? initial;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      action={formAction}
      className="mt-3 grid max-w-md gap-3 sm:grid-cols-2"
    >
      {state.error ? (
        <p className="sm:col-span-2 text-sm text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="sm:col-span-2 text-sm text-emerald-400">Snapshot saved.</p>
      ) : null}

      <label className="block">
        <span className="mb-1 block text-xs text-zinc-500">Date</span>
        <input
          name="snapshot_date"
          type="date"
          required
          defaultValue={today}
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-zinc-500">Follower count</span>
        <input
          name="follower_count"
          type="number"
          min={0}
          required
          defaultValue={0}
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-xs text-zinc-500">
          Avg views (optional — your rough account average that day)
        </span>
        <input
          name="avg_views"
          type="number"
          min={0}
          step="any"
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        />
      </label>
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-700"
        >
          <SubmitSnapshot />
        </button>
      </div>
    </form>
  );
}
