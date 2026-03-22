import type { ConnectionProfile } from "@/lib/types";

type ConnectionsListProps = {
  profiles: ConnectionProfile[];
};

function ConnectionCard({ profile }: { profile: ConnectionProfile }) {
  const displayName = profile.name ?? profile.alias ?? "Unknown";
  const avatarLetters = getAvatarLetters(displayName);

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-stone-900 text-sm font-bold text-stone-50">
          {avatarLetters}
        </div>
        <h3 className="text-base font-semibold text-stone-900">{displayName}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-stone-700">{profile.bio}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {profile.topics.map((topic) => (
          <span key={topic} className="rounded-full bg-stone-900 px-2 py-1 text-xs text-stone-50">
            {topic}
          </span>
        ))}
      </div>
    </article>
  );
}

function getAvatarLetters(name: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let hash = 0;

  for (let i = 0; i < name.length; i += 1) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }

  const first = alphabet[Math.abs(hash) % alphabet.length];
  const second = alphabet[Math.abs(hash * 7) % alphabet.length];
  return `${first}${second}`;
}

export function ConnectionsList({ profiles }: ConnectionsListProps) {
  if (profiles.length === 0) {
    return <p className="text-sm text-stone-600">No profiles available yet.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {profiles.map((profile) => (
        <ConnectionCard key={profile.name ?? profile.alias ?? profile.bio} profile={profile} />
      ))}
    </div>
  );
}
