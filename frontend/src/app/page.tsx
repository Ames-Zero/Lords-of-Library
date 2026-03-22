"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { mockFeed } from "@/lib/mock-data";

const onboardingKey = "lol.onboarding.topics";

export default function Home() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [currentReadTime, setCurrentReadTime] = useState(12);
  const [nextReadTime, setNextReadTime] = useState(12);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const raw = window.localStorage.getItem(onboardingKey);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as string[];
      setSelectedTopics(parsed);
    } catch {
      window.localStorage.removeItem(onboardingKey);
    }
  }, []);

  useEffect(() => {
    setCurrentReadTime(Math.floor(Math.random() * 20) + 5);
    setNextReadTime(Math.floor(Math.random() * 20) + 5);
  }, [cardIndex]);

  const filteredFeed = useMemo(() => {
    if (selectedTopics.length === 0) {
      return mockFeed;
    }

    return mockFeed.filter((paper) => paper.categories.some((category) => selectedTopics.includes(category)));
  }, [selectedTopics]);

  const currentPaper = filteredFeed[cardIndex % filteredFeed.length];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const distX = touchStartX.current - touchEndX;
    const distY = touchStartY.current - touchEndY;

    if (Math.abs(distX) > Math.abs(distY) && Math.abs(distX) > 30) {
      if (distX > 0) {
        handleSwipe("left");
      } else {
        handleSwipe("right");
      }
    }
  };

  const handleSwipe = (direction: "left" | "right") => {
    setSwipeDirection(direction);
    setTimeout(() => {
      setCardIndex((prev) => prev + 1);
      setSwipeDirection(null);
    }, 200);
  };

  const getCardTransform = () => {
    if (swipeDirection === "left") {
      return "translate-x-full opacity-0";
    } else if (swipeDirection === "right") {
      return "-translate-x-full opacity-0";
    }
    return "translate-x-0 opacity-100";
  };

  const nextPaper = filteredFeed[(cardIndex + 1) % filteredFeed.length];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#8b8b8b]">Current Expedition</p>
          <h1 className="text-4xl lg:text-5xl font-black italic text-[#252525] leading-tight mt-1">
            Morning Intel Triage
          </h1>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8b8b8b]">Daily Goal: 1,628 documents</p>
            <div className="h-1 w-48 bg-[#e8e3dd] rounded-full overflow-hidden">
              <div className="h-full bg-[#8b1f1f] rounded-full" style={{ width: "79%" }} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8b8b8b]">79% CLARIFIED</p>
            <p className="text-sm text-[#8b8b8b] max-w-sm leading-relaxed">
              Sift through the ethereal flow of intelligence. Swipe to prioritize or archive the latest global shifts.
            </p>
          </div>
        </div>
        <div className="h-px bg-[#252525]" />
      </div>

      {/* Featured Paper Card Stack */}
      <div className="relative">
        <article
          className={`bg-white rounded-lg border border-[#e8e3dd] overflow-hidden shadow-md transition-all duration-200 ${getCardTransform()}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Header */}
          <div className="p-6 lg:p-8 border-b border-[#e8e3dd] space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="inline-block px-2 py-1 bg-[#8b1f1f] text-white text-xs font-bold uppercase tracking-wide rounded">
                  {currentPaper.primaryCategory === "cs.CV" ? "MARKET TREND" : "TECH INSIGHT"}
                </span>
                <h2 className="text-3xl lg:text-4xl font-black text-[#252525] leading-tight mt-3">
                  {currentPaper.title}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-[#8b8b8b]">ISSUE NO</p>
                <p className="text-lg font-bold text-[#252525]">DQ-2024-0{(cardIndex % 1000).toString().padStart(3, "0")}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-[#8b8b8b]">
                <span>✎ {currentPaper.authors[0]}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#8b8b8b]">
                <span>📅 {new Date(currentPaper.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 lg:p-8 space-y-6">
            <p className="text-base italic text-[#8b8b8b] leading-relaxed border-l-4 border-[#d4a574] pl-4">
              "{currentPaper.abstract}"
            </p>

            {/* Metadata */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {[...Array(Math.min(2, 5))].map((_, i) => (
                  <div
                    key={i}
                    className="avatar-dot"
                    style={{ backgroundColor: `hsl(${(i * 120) % 360}, 70%, 50%)` }}
                  />
                ))}
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#8b8b8b]">
                READ TIME: {currentReadTime} minutes
              </p>
            </div>
          </div>
        </article>

        {swipeDirection && (
          <article className="absolute inset-0 bg-white rounded-lg border border-[#e8e3dd] overflow-hidden shadow-md pointer-events-none">
            <div
              className={`p-6 lg:p-8 border-b border-[#e8e3dd] space-y-4 transition-all duration-200 ${
                swipeDirection === "left" ? "-translate-x-full" : "translate-x-full"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="inline-block px-2 py-1 bg-[#8b1f1f] text-white text-xs font-bold uppercase tracking-wide rounded">
                    {nextPaper.primaryCategory === "cs.CV" ? "MARKET TREND" : "TECH INSIGHT"}
                  </span>
                  <h2 className="text-3xl lg:text-4xl font-black text-[#252525] leading-tight mt-3">
                    {nextPaper.title}
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#8b8b8b]">ISSUE NO</p>
                  <p className="text-lg font-bold text-[#252525]">DQ-2024-0{((cardIndex + 1) % 1000).toString().padStart(3, "0")}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-[#8b8b8b]">
                  <span>✎ {nextPaper.authors[0]}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#8b8b8b]">
                  <span>📅 {new Date(nextPaper.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
              </div>
            </div>

            <div className="p-6 lg:p-8 space-y-6">
              <p className="text-base italic text-[#8b8b8b] leading-relaxed border-l-4 border-[#d4a574] pl-4">
                "{nextPaper.abstract}"
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {[...Array(Math.min(2, 5))].map((_, i) => (
                    <div
                      key={i}
                      className="avatar-dot"
                      style={{ backgroundColor: `hsl(${(i * 120) % 360}, 70%, 50%)` }}
                    />
                  ))}
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#8b8b8b]">
                  READ TIME: {nextReadTime} minutes
                </p>
              </div>
            </div>
          </article>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 py-6">
        <button
          className="action-pill text-[#8b1f1f] hover:bg-[#f5f1eb]"
          onClick={() => handleSwipe("left")}
          aria-label="Archive"
        >
          ✕
        </button>
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs font-bold uppercase tracking-widest text-[#8b8b8b]">Decision Pending</p>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-[#d4a574]" />
            <div className="w-2 h-2 rounded-full bg-[#e8e3dd]" />
            <div className="w-2 h-2 rounded-full bg-[#e8e3dd]" />
          </div>
        </div>
        <button
          className="action-pill text-[#8b1f1f] hover:bg-[#f5f1eb]"
          onClick={() => handleSwipe("right")}
          aria-label="Save"
        >
          ✓
        </button>
      </div>
    </div>
  );
}
