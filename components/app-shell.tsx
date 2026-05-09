"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import * as LucideIcons from "lucide-react";
import { mainNavItems } from "@/lib/nav-items";

function isNavActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const navIconNameByHref = {
  "/": "Home",
  "/analytics": "BarChart3",
  "/videos": "Video",
  "/ideas": "Lightbulb",
  "/trends": "Sparkles",
  "/analyze": "Compass",
  "/calendar": "CalendarDays",
} as const;

function getNavIcon(
  href: string,
): React.ComponentType<{ className?: string; "aria-hidden"?: boolean }> {
  const requestedName =
    navIconNameByHref[href as keyof typeof navIconNameByHref] ?? "Home";
  const maybeIcon = (LucideIcons as Record<string, unknown>)[requestedName];
  const homeIcon = (LucideIcons as Record<string, unknown>).Home;
  if (typeof maybeIcon === "function") {
    return maybeIcon as React.ComponentType<{
      className?: string;
      "aria-hidden"?: boolean;
    }>;
  }
  if (typeof homeIcon === "function") {
    return homeIcon as React.ComponentType<{
      className?: string;
      "aria-hidden"?: boolean;
    }>;
  }
  return () => null;
}

// Sidebar nav links shared by desktop aside and mobile drawer.
function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation">
      <ul className="flex flex-col gap-0.5">
        {mainNavItems.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = getNavIcon(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                prefetch
                onClick={onNavigate}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors duration-150 ease-out ${
                  active
                    ? "border border-indigo-500/40 bg-indigo-500/15 text-indigo-200"
                    : "border border-transparent text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/60 hover:text-zinc-200"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Warm route payloads on idle so tab clicks feel instant.
  useEffect(() => {
    const hrefs = mainNavItems.map((item) => item.href);
    const prefetchAll = () => {
      for (const href of hrefs) {
        router.prefetch(href);
      }
    };

    if (typeof window === "undefined") {
      return;
    }

    const win = window;
    if (typeof win.requestIdleCallback === "function") {
      const id = win.requestIdleCallback(prefetchAll, { timeout: 2500 });
      return () => win.cancelIdleCallback(id);
    }

    const timeoutId = win.setTimeout(prefetchAll, 120);
    return () => win.clearTimeout(timeoutId);
  }, [router]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="creator-shell flex min-h-screen bg-background">
      {/* One sidebar in the DOM: off-canvas on small screens, static column on lg+ (avoids duplicate nav if CSS is slow) */}
      <aside
        id="mobile-nav-drawer"
        data-open={mobileOpen}
        className={`creator-sidebar fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-950/80 transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        aria-label="CreatorDash navigation"
      >
        <div className="flex h-14 shrink-0 items-center border-b border-zinc-800/80 px-4">
          <span className="text-base font-semibold tracking-tight text-zinc-100">
            CreatorDash
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className="flex min-h-screen flex-1 flex-col lg:min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-800/80 bg-zinc-950/70 px-4 backdrop-blur-sm lg:hidden">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span className="sr-only">Open menu</span>
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
          <span className="text-sm font-semibold text-zinc-100">CreatorDash</span>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 bg-[radial-gradient(80%_60%_at_60%_-10%,rgba(99,102,241,0.14),transparent_60%),radial-gradient(60%_50%_at_0%_100%,rgba(99,102,241,0.08),transparent_65%)] px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
