"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { normalizeAppView, type AppView } from "@/lib/app-view";

const tabs: { view: AppView; label: string; href: string }[] = [
  { view: "feed", label: "Feed", href: "/" },
  { view: "saved", label: "Saved", href: "/?view=saved" },
  { view: "connections", label: "Connections", href: "/?view=connections" },
  { view: "profile", label: "Profile", href: "/?view=profile" },
];

function isTabActive(pathname: string, currentView: AppView, tabView: AppView): boolean {
  if (pathname !== "/") {
    return false;
  }
  return currentView === tabView;
}

export function DesktopLayoutNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = normalizeAppView(searchParams.get("view"));

  return (
    <nav className="flex-1 space-y-1 mb-8">
      {tabs.map((tab) => {
        const active = isTabActive(pathname, currentView, tab.view);

        return (
          <Link
            key={tab.view}
            href={tab.href}
            className={`flex items-center gap-3 px-3 py-2 rounded text-sm font-semibold transition-colors ${
              active ? "text-[#8b1f1f] bg-[#f5f1eb]" : "text-[#8b8b8b] hover:bg-[#f5f1eb]"
            }`}
          >
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileLayoutNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = normalizeAppView(searchParams.get("view"));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-4 bg-white/70 backdrop-blur-xl border-t border-[#e8e3dd] rounded-t-3xl">
      {tabs.map((tab) => {
        const active = isTabActive(pathname, currentView, tab.view);

        return (
          <Link
            key={tab.view}
            href={tab.href}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              active ? "text-[#8b1f1f]" : "text-[#8b8b8b] hover:text-[#8b1f1f] opacity-70"
            }`}
          >
            <span className="text-[10px] font-semibold tracking-tight">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
