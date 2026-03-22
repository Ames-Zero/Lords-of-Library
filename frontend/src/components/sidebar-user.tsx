"use client";

import { useEffect, useMemo, useState } from "react";
import { onboardingProfileKey } from "@/lib/storage-keys";

type SidebarUserProps = {
  fallbackUsername: string;
  avatarUrl: string | null;
};

export function SidebarUser({ fallbackUsername, avatarUrl }: SidebarUserProps) {
  const [username, setUsername] = useState(fallbackUsername);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const rawProfile = window.localStorage.getItem(onboardingProfileKey);

    if (!rawProfile) {
      return;
    }

    try {
      const parsed = JSON.parse(rawProfile) as { name?: string; avatarUrl?: string; avatar_url?: string };
      const storedName = typeof parsed.name === "string" ? parsed.name.trim() : "";
      const storedAvatar =
        typeof parsed.avatarUrl === "string"
          ? parsed.avatarUrl.trim()
          : typeof parsed.avatar_url === "string"
            ? parsed.avatar_url.trim()
            : "";

      if (storedName) {
        setUsername(storedName);
      }
      if (storedAvatar) {
        setLocalAvatarUrl(storedAvatar);
      }
    } catch {
      window.localStorage.removeItem(onboardingProfileKey);
    }
  }, []);

  const robohashUrl = useMemo(() => `https://robohash.org/${username}`, [username]);
  const displayAvatarUrl = localAvatarUrl || avatarUrl || robohashUrl;

  return (
    <div className="mb-8 pb-8 border-b border-[#e8e3dd]">
      <div className="flex items-center gap-3">
        <img src={displayAvatarUrl} alt={`${username} avatar`} className="w-10 h-10 rounded object-cover" />
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-[#8b8b8b]">Executive Avatar</div>
          <div className="text-sm font-semibold text-[#252525]">{username}</div>
        </div>
      </div>
    </div>
  );
}
