import type { Metadata } from "next";
import { HashtagGenerator } from "@/components/ideas/hashtag-generator";

export const metadata: Metadata = {
  title: "Trends",
};

// Must be dynamic: Anthropic key is read at runtime from .env.local. If this page
// is static, `isEnabled` is frozen from build time and stays false after you add the key.
export const dynamic = "force-dynamic";

export default function TrendsPage() {
  const hasAnthropicApiKey = Boolean(process.env.ANTHROPIC_API_KEY?.trim());

  return (
    <div className="space-y-8">
      <div>
        <h1>Trends</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Generate tiered hashtag sets for your next post and copy them by tier
          or as a full stack.
        </p>
      </div>

      <section className="surface-card p-4 sm:p-5">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-50">
          Hashtag Generator
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Use broad, mid, and niche hashtags together for stronger distribution.
        </p>
        <div className="mt-5">
          <HashtagGenerator isEnabled={hasAnthropicApiKey} />
        </div>
      </section>
    </div>
  );
}
