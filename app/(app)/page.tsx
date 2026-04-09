import type { Metadata } from "next";
import { DashboardModuleGrid } from "@/components/dashboard-module-grid";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
        Dashboard
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
        Your TikTok command center for @hudson.cryder — one screen per job.
        Open a module below or use the sidebar.
      </p>
      <DashboardModuleGrid />
    </div>
  );
}
