"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  upsertVideoAction,
  type VideoActionState,
} from "@/app/(app)/videos/actions";
import { FORMAT_TYPES, formatTypeLabel } from "@/lib/format-types";
import type { VideoRow } from "@/lib/videos/types";

function SubmitLabel({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  if (pending) {
    return <span>Saving…</span>;
  }
  return <span>{isEdit ? "Save changes" : "Add video"}</span>;
}

// Manual upsert form; uses server action for validation and redirect on success.

export function VideoForm({ editing }: { editing?: VideoRow | null }) {
  const initial: VideoActionState = {};
  const [state, formAction] = useFormState(upsertVideoAction, initial);
  const isEdit = Boolean(editing);

  const defaultDate = editing
    ? new Date(editing.date_posted).toISOString().slice(0, 16)
    : new Date().toISOString().slice(0, 16);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 sm:p-5"
    >
      {state.error ? (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      {isEdit ? (
        <input type="hidden" name="id" value={editing!.id} />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-zinc-400">
            TikTok URL
          </span>
          <input
            name="url"
            type="url"
            required
            defaultValue={editing?.url ?? ""}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 focus:ring-2"
            placeholder="https://www.tiktok.com/@…/video/…"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-400">
            Posted
          </span>
          <input
            name="date_posted"
            type="datetime-local"
            required
            defaultValue={defaultDate}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-400">
            Format
          </span>
          <select
            name="format_type"
            required
            defaultValue={
              editing?.format_type
                ? String(editing.format_type)
                : "talking_head"
            }
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 focus:ring-2"
          >
            {FORMAT_TYPES.map((ft) => (
              <option key={ft} value={ft}>
                {formatTypeLabel[ft]}
              </option>
            ))}
          </select>
        </label>

        {(["views", "likes", "comments", "shares"] as const).map((field) => (
          <label key={field} className="block">
            <span className="mb-1 block text-xs font-medium capitalize text-zinc-400">
              {field}
            </span>
            <input
              name={field}
              type="number"
              min={0}
              required
              defaultValue={editing?.[field] ?? 0}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 focus:ring-2"
            />
          </label>
        ))}

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-zinc-400">
            Hook (first line / idea)
          </span>
          <input
            name="hook_text"
            type="text"
            defaultValue={editing?.hook_text ?? ""}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 focus:ring-2"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-zinc-400">
            Notes
          </span>
          <textarea
            name="notes"
            rows={3}
            defaultValue={editing?.notes ?? ""}
            className="w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 focus:ring-2"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-60"
        >
          <SubmitLabel isEdit={isEdit} />
        </button>
        {isEdit ? (
          <Link
            href="/videos"
            className="rounded-md border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </Link>
        ) : null}
      </div>
    </form>
  );
}
