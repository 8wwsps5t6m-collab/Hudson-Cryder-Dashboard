import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/client";

// Smoke test: env vars set and database reachable; expects `videos` to exist.

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
      },
      { status: 503 },
    );
  }

  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("videos").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
