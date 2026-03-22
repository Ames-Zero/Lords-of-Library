import { mockConnections } from "@/lib/mock-data";

export default function ConnectionsPage() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-stone-900">Connections</h2>
        <p className="mt-1 text-sm text-stone-600">Static profiles for the demo frontend scope.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {mockConnections.map((profile) => (
          <article key={profile.alias} className="card-panel rounded-2xl p-4">
            <h3 className="text-base font-semibold text-stone-900">{profile.alias}</h3>
            <p className="mt-1 text-sm text-stone-700">{profile.bio}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.topics.map((topic) => (
                <span key={topic} className="rounded-full bg-stone-900 px-2 py-1 text-xs text-stone-50">
                  {topic}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
