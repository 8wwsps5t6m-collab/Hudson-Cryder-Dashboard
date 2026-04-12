"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  upsertVideoAction,
  type VideoActionState,
} from "@/app/(app)/videos/actions";
import { FORMAT_TYPES, formatTypeLabel } from "@/lib/format-types";
import { HOOK_TYPES, hookTypeLabel } from "@/lib/hook-types";
import type { VideoRow } from "@/lib/videos/types";

const NOTES_PLACEHOLDER =
  "e.g. Tried a new angle, filmed at golden hour, wanted to test a slower hook...";

const COUNT_PLACEHOLDER = "e.g. 12.5K, 1.2M, or 1200";

function SubmitLabel({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  if (pending) {
    return <span>Saving…</span>;
  }
  return <span>{isEdit ? "Save changes" : "Add video"}</span>;
}

// Manual upsert: shorthand counts, hook type, clears via remount + refresh on success.

export function VideoForm({ editing }: { editing?: VideoRow | null }) {
  const initial: VideoActionState = {};
  const [rawState, formAction] = useFormState(upsertVideoAction, initial);
  const state = rawState ?? initial;
  const isEdit = Boolean(editing);
  const router = useRouter();
  const [formVersion, setFormVersion] = useState(0);
  const successHandled = useRef(false);

  const defaultDate = editing
    ? new Date(editing.date_posted).toISOString().slice(0, 16)
    : new Date().toISOString().slice(0, 16);

  useEffect(() => {
    if (state.success) {
      if (!successHandled.current) {
        successHandled.current = true;
        setFormVersion((v) => v + 1);
        router.refresh();
        if (isEdit) {
          router.replace("/videos");
        }
      }
    } else {
      successHandled.current = false;
    }
  }, [state.success, isEdit, router]);

  return (
    <form
      key={formVersion}
      action={formAction}
      className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 sm:p-5"
    >
      {state.error ? (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success && !isEdit ? (
        <p className="text-sm text-emerald-400" role="status">
          Saved. Form cleared — add another or check the library below.
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

        {(
          [
            { name: "views" as const, val: editing?.views },
            { name: "likes" as const, val: editing?.likes },
            { name: "comments" as const, val: editing?.comments },
            { name: "shares" as const, val: editing?.shares },
            { name: "saves" as const, val: editing?.saves },
          ] as const
        ).map(({ name, val }) => (
          <label key={name} className="block">
            <span className="mb-1 block text-xs font-medium capitalize text-zinc-400">
              {name}
            </span>
            <input
              name={name}
              type="text"
              inputMode="decimal"
              required
              defaultValue={editing ? String(val ?? 0) : ""}
              placeholder={COUNT_PLACEHOLDER}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 focus:ring-2"
            />
          </label>
        ))}

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-zinc-400">
            Hook type
          </span>
          <select
            name="hook_type"
            required
            defaultValue={
              editing?.hook_type ? String(editing.hook_type) : "both"
            }
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 focus:ring-2"
          >
            {HOOK_TYPES.map((ht) => (
              <option key={ht} value={ht}>
                {hookTypeLabel[ht]}
              </option>
            ))}
          </select>
        </label>

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
            placeholder={NOTES_PLACEHOLDER}
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
