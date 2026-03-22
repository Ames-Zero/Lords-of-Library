"use client";

import { useEffect, useState } from "react";
import { mockFeed } from "@/lib/mock-data";
import { fetchSavedPapers } from "@/lib/client-api";
import type { Paper } from "@/lib/types";

export function SavedView() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSavedPapers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const savedPapers = await fetchSavedPapers();
        setPapers(savedPapers.slice(0, 10));
      } catch (err) {
        console.error("Failed to load saved papers:", err);
        setError("Failed to load saved papers. Using demo data.");
        setPapers(mockFeed.slice(0, 2));
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedPapers();
  }, []);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-stone-900">Saved Papers</h2>
        <p className="mt-1 text-sm text-stone-600">
          {error ? error : "Papers you've saved for later."}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="card-panel rounded-2xl p-4 animate-pulse">
              <div className="h-4 w-20 rounded bg-stone-200" />
              <div className="mt-3 h-6 rounded bg-stone-200" />
              <div className="mt-2 h-4 w-40 rounded bg-stone-200" />
            </div>
          ))}
        </div>
      ) : papers.length === 0 ? (
        <div className="card-panel rounded-2xl p-6 text-center">
          <p className="text-sm text-stone-600">No saved papers yet. Start swiping to save your favorites!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {papers.map((paper) => (
            <article key={paper.id} className="card-panel rounded-2xl p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-stone-900 px-2 py-1 text-xs font-semibold text-stone-50">
                  {paper.primaryCategory}
                </span>
                <span className="text-xs text-stone-500">
                  {new Date(paper.publishedAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-stone-900">{paper.title}</h3>
              <p className="mt-2 text-sm text-stone-700">
                {paper.abstract.length > 220 ? `${paper.abstract.slice(0, 220)}...` : paper.abstract}
              </p>
              <p className="mt-2 text-sm text-stone-600">{paper.authors.join(", ")}</p>
              <a
                href={paper.arxivUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-full bg-stone-900 px-3 py-1.5 text-sm font-medium text-stone-50 transition hover:bg-stone-800"
              >
                Open on arXiv
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
