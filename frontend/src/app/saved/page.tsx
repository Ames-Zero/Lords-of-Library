import { mockFeed } from "@/lib/mock-data";

export default function SavedPage() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-stone-900">Saved Papers</h2>
        <p className="mt-1 text-sm text-stone-600">MVP list view with sorting to be added in the next step.</p>
      </div>

      <div className="space-y-3">
        {mockFeed.slice(0, 2).map((paper) => (
          <article key={paper.id} className="card-panel rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{paper.primaryCategory}</p>
            <h3 className="mt-1 text-base font-semibold text-stone-900">{paper.title}</h3>
            <p className="mt-1 text-sm text-stone-700">{paper.authors.join(", ")}</p>
            <a
              href={paper.arxivUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-sm font-medium text-teal-700 hover:text-teal-800"
            >
              Open on arXiv
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
