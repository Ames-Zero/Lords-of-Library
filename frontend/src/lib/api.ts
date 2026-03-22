import { headers } from "next/headers";

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
  try {
    const origin = await getInternalApiOrigin();
    const response = await fetch(`${origin}/api/user/me`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch viewer profile: ${response.status}`);
    }

    const data = (await response.json()) as {
      username?: string;
      avatar_url?: string | null;
      avatarUrl?: string | null;
    };

    return {
      username: data.username ?? "Demo User",
      avatarUrl: data.avatar_url ?? data.avatarUrl ?? null,
    };
  } catch {
    return {
      username: "Demo User",
      avatarUrl: null,
    };
  }
}
