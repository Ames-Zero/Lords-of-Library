"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Feed", icon: "D" },
  { href: "/connections", label: "Analytics", icon: "A" },
  { href: "/onboarding", label: "Profile", icon: "P" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-7 space-y-3" aria-label="Primary navigation">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-3 rounded-full px-4 py-3 text-sm font-extrabold uppercase tracking-[0.08em] transition ${
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
