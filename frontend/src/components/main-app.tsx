"use client";

import { useSearchParams } from "next/navigation";
import { ConnectionsView } from "@/components/connections-view";
import { FeedView } from "@/components/feed-view";
import { ProfileInterestsView } from "@/components/profile-interests-view";
import { SavedView } from "@/components/saved-view";
import { normalizeAppView } from "@/lib/app-view";

export function MainApp() {
  const searchParams = useSearchParams();
  const view = normalizeAppView(searchParams.get("view"));

  return (
    <div className="h-full min-h-0 min-w-0">
      <div
        className={view === "feed" ? "h-full min-h-0 min-w-0 overflow-x-hidden" : "hidden"}
        aria-hidden={view !== "feed"}
      >
        <FeedView />
      </div>
      <div
        className={view === "saved" ? "h-full min-h-0 overflow-y-auto" : "hidden"}
        aria-hidden={view !== "saved"}
      >
        <SavedView />
      </div>
      <div
        className={view === "connections" ? "h-full min-h-0 overflow-y-auto" : "hidden"}
        aria-hidden={view !== "connections"}
      >
        <ConnectionsView />
      </div>
      <div
        className={view === "profile" ? "h-full min-h-0 overflow-y-auto" : "hidden"}
        aria-hidden={view !== "profile"}
      >
        <ProfileInterestsView />
      </div>
    </div>
  );
}
