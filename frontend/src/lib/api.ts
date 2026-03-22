import { headers } from "next/headers";
import type { ConnectionProfile } from "@/lib/types";
import { mockConnections } from "@/lib/mock-data";

export type ViewerProfile = {
  username: string;
  avatarUrl: string | null;
};

async function getInternalApiOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Unable to resolve request host for internal API calls.");
  }

  return `${protocol}://${host}`;
}

export async function getViewerProfile(): Promise<ViewerProfile> {
  return {
    username: "Demo User",
    avatarUrl: null,
  };
}

export async function getConnectionProfiles(): Promise<{
  profiles: ConnectionProfile[];
  source: "backend" | "mock";
}> {
  try {
    const origin = await getInternalApiOrigin();
    const response = await fetch(`${origin}/api/connections`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch connections: ${response.status}`);
    }

    const payload = (await response.json()) as
      | Array<{
          name?: string;
          alias?: string;
          bio?: string;
          topics?: string[];
        }>
      | {
          connections?: Array<{
            name?: string;
            alias?: string;
            bio?: string;
            topics?: string[];
          }>;
        };

    const data = Array.isArray(payload) ? payload : payload.connections ?? [];

    return {
      profiles: data
        .map((profile) => ({
          name: profile.name,
          alias: profile.alias,
          bio: profile.bio ?? "",
          topics: Array.isArray(profile.topics) ? profile.topics : [],
        }))
        .filter((profile) => Boolean(profile.name ?? profile.alias)),
      source: "backend",
    };
  } catch {
    return {
      profiles: mockConnections,
      source: "mock",
    };
  }
}
