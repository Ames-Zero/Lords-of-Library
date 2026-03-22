"use client";

import { useEffect, useState } from "react";
import { topics } from "@/lib/mock-data";

const storageKey = "lol.onboarding.topics";

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as string[];
      setSelected(parsed);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  function toggleTopic(topic: string) {
    setSaved(false);
    setSelected((current) =>
      current.includes(topic) ? current.filter((entry) => entry !== topic) : [...current, topic],
    );
  }

  function saveChoices() {
    window.localStorage.setItem(storageKey, JSON.stringify(selected));
    setSaved(true);
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-stone-900">Onboarding</h2>
        <p className="mt-1 text-sm text-stone-600">Pick initial interest topics for the feed warm-start.</p>
      </div>

      <div className="card-panel rounded-2xl p-4">
        <p className="text-sm text-stone-700">Select one or more categories:</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {topics.map((topic) => {
            const active = selected.includes(topic);
            return (
              <button
                key={topic}
                type="button"
                onClick={() => toggleTopic(topic)}
                className={`rounded-full px-3 py-2 text-sm transition ${
                  active
                    ? "bg-teal-700 text-white"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {topic}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={saveChoices}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-stone-800"
          >
            Save interests
          </button>
          {saved ? <span className="text-sm text-teal-700">Saved locally.</span> : null}
        </div>
      </div>
    </section>
  );
}
