import Link from "next/link";
import { dashboardModules } from "@/lib/dashboard-modules";

// Full-card links so every pixel of each box navigates to the matching route.

export function DashboardModuleGrid() {
  return (
    <ul className="dashboard-module-grid mt-8 grid list-none gap-4 p-0 sm:grid-cols-2">
      {dashboardModules.map((module) => (
        <li key={module.href} className="relative min-h-[132px]">
          <div className="surface-card surface-card-hover relative min-h-[132px] overflow-hidden rounded-xl">
            <Link
              href={module.href}
              prefetch
              className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              aria-label={`Open ${module.title}`}
            />
            <div className="relative z-0 flex min-h-[132px] flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="text-lg font-semibold text-zinc-100">
                  {module.title}
                </span>
                <span className="pointer-events-none shrink-0 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-indigo-200">
                  {module.phaseLabel}
                </span>
              </div>
              <p className="pointer-events-none mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
                {module.description}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
