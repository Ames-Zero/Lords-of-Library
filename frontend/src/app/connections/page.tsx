import { ConnectionsList } from "@/components/connections-list";
import { getConnectionProfiles } from "@/lib/api";

export default async function ConnectionsPage() {
  const { profiles, source } = await getConnectionProfiles();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-stone-900">Connections</h2>
        <p className="mt-1 text-sm text-stone-600">
          {source === "backend"
            ? "Profiles from the backend."
            : "Backend unavailable. Showing hardcoded profiles from the frontend for now."}
        </p>
      </div>

      <ConnectionsList profiles={profiles} />
    </section>
  );
}
