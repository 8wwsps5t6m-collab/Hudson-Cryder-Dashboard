import Link from "next/link";
import { dashboardModules } from "@/lib/dashboard-modules";

// Renders roadmap cards linking into stub routes; keeps the dashboard scannable on mobile.

export function DashboardModuleGrid() {
  return (
    <ul className="mt-8 grid gap-3 sm:grid-cols-2">
      {dashboardModules.map((module) => (
        <li key={module.href}>
          <Link
            href={module.href}
            className="block rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/40"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-semibold text-zinc-100">
                {module.title}
              </h2>
              <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                {module.phaseLabel}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              {module.description}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
