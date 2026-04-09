import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
        Dashboard
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        Your TikTok command center for @hudson.cryder — analytics, ideas, and
        workflow in one minimal surface. Overview cards and modules ship next.
      </p>
    </div>
  );
}
