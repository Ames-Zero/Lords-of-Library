"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { normalizeAppView, type AppView } from "@/lib/app-view";

const tabs: { view: AppView; label: string; icon: string; href: string }[] = [
  { view: "feed", label: "Feed", icon: "F", href: "/" },
  { view: "connections", label: "Connections", icon: "C", href: "/?view=connections" },
  { view: "saved", label: "Saved", icon: "S", href: "/?view=saved" },
];

export function AppNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = normalizeAppView(searchParams.get("view"));

  return (
    <nav className="mt-7 space-y-3" aria-label="Primary navigation">
      {tabs.map((tab) => {
        const isActive = pathname === "/" && currentView === tab.view;

        return (
          <Link
            key={tab.view}
            href={tab.href}
            className={`flex items-center gap-3 rounded-full px-4 py-3 text-sm font-extrabold tracking-[0.08em] transition ${
              isActive
                ? "bg-[#9e0000] text-white shadow-[0_3px_0_#520000]"
                : "text-stone-400 hover:bg-white/70 hover:text-stone-700"
            }`}
          >
            <span className={`grid h-5 w-5 place-items-center text-sm ${isActive ? "text-[#ffd53d]" : "text-stone-400"}`}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
