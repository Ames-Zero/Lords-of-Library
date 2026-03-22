"use client";

import { useEffect, useState } from "react";
import { ConnectionsList } from "@/components/connections-list";
import { fetchConnectionProfiles } from "@/lib/client-api";
import type { ConnectionProfile } from "@/lib/types";

export function ConnectionsView() {
  const [profiles, setProfiles] = useState<ConnectionProfile[]>([]);
  const [source, setSource] = useState<"backend" | "mock" | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await fetchConnectionProfiles();
      if (!cancelled) {
        setProfiles(result.profiles);
        setSource(result.source);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-stone-900">Connections</h2>
        {/* <p className="mt-1 text-sm text-stone-600">
          {source === null
            ? "Loading…"
            : source === "backend"
              ? "Profiles from the backend."
              : "Backend unavailable. Showing hardcoded profiles from the frontend for now."}
        </p> */}
      </div>

      <ConnectionsList profiles={profiles} />
    </section>
  );
}
