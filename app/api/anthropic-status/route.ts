import { NextResponse } from "next/server";

/** Reads env at request time so the UI can detect ANTHROPIC_API_KEY without relying on static RSC props. */
export const dynamic = "force-dynamic";

export async function GET() {
  const configured = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  return NextResponse.json({ configured });
}
