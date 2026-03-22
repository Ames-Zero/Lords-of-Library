"use client";

import { useEffect, useState, useRef } from "react";
import { topics } from "@/lib/mock-data";
import { onboardingModalSeenKey, onboardingProfileKey, onboardingTopicsKey } from "@/lib/storage-keys";
import { fetchNextPapers, logSwipe } from "@/lib/client-api";
import type { Paper } from "@/lib/types";

const eli5MaxChars = 200;

function hashPaperId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function truncateAtWord(text: string, maxChars: number): string {
  const t = text.trim();
  if (t.length <= maxChars) {
    return t;
  }
  const slice = t.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > Math.floor(maxChars * 0.45) ? lastSpace : maxChars;
  return `${t.slice(0, cut).trimEnd()}…`;
}

/** Display-only fields not yet on `Paper`; stable per paper id where applicable. */
function getPaperCardExtras(paper: Paper) {
  const h = hashPaperId(paper.id);
  const methodologySets = [
    ["Tensor Networks", "Quantum Entropy Analysis"],
    ["Bayesian Inference", "Monte Carlo Methods"],
    ["Representation Learning", "Large-Scale Training"],
    ["Causal Modeling", "Observational Study"],
    ["Information Geometry", "Variational Bounds"],
  ] as const;
  const abstractFirst = paper.abstract.trim();
  const firstSentenceEnd = abstractFirst.search(/[.!?](\s|$)/);
  const problemFromAbstract =
    abstractFirst.length > 20 && firstSentenceEnd > 20
      ? abstractFirst.slice(0, firstSentenceEnd + 1).trim()
      : null;
  const dummyDoi = `10.${1000 + (h % 9000)}/arxiv.${paper.id.replace(/\D/g, "").slice(0, 8) || "placeholder"}`.toUpperCase();

  return {
    impactScore: 72 + (h % 27),
    highImpact: h % 4 === 0,
    methodology: [...methodologySets[h % methodologySets.length]],
    problem: problemFromAbstract ?? "How does this work advance what we can measure, predict, or build in this field?",
    eli5:
      abstractFirst.length > 0
        ? `In plain language: ${truncateAtWord(abstractFirst, eli5MaxChars)}`
        : "In plain language: this paper explores ideas in the listed area—open the full text on arXiv for details.",
    doiDisplay: dummyDoi,
  };
}

function FeedPaperCardContent({
  paper,
  readMinutes,
  dense,
}: {
  paper: Paper;
  readMinutes: number;
  dense?: boolean;
}) {
  const extras = getPaperCardExtras(paper);
  const pad = dense ? "p-3 sm:p-4" : "p-4 sm:p-5 lg:p-6";
  const footerBleed = dense
    ? "-mx-3 -mb-3 sm:-mx-4 sm:-mb-4 px-3 sm:px-4"
    : "-mx-4 -mb-4 sm:-mx-5 sm:-mb-5 lg:-mx-6 lg:-mb-6 px-4 sm:px-5 lg:px-6";
  const titleClass = dense ? "text-base font-black leading-snug text-[#252525]" : "text-xl font-black leading-snug text-[#252525] sm:text-2xl";

  const publishedLabel = new Date(paper.publishedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const titleClamp = dense ? "line-clamp-2" : "line-clamp-4";

  return (
    <div className={`relative flex h-full min-h-0 w-full min-w-0 flex-col ${pad}`}>
      <div className="pointer-events-none absolute left-0 top-0 h-1 w-20 rounded-br bg-[#8b1f1f]" aria-hidden />

      <div className="shrink-0">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap gap-2">
            <span className="rounded-full bg-[#8b1f1f]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#8b1f1f]">
              {paper.primaryCategory}
            </span>
            {extras.highImpact ? (
              <span className="rounded-full bg-[#e8e3dd] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#5f5f5f]">
                High impact
              </span>
            ) : null}
          </div>
          <div className="w-[120px] shrink-0 text-right">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8b8b8b]">Impact score</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#e8e3dd]">
                <div className="h-full rounded-full bg-[#8b1f1f]" style={{ width: `${extras.impactScore}%` }} />
              </div>
              <span className="text-xs font-black tabular-nums text-[#8b1f1f]">{extras.impactScore}</span>
            </div>
          </div>
        </header>

        <h2 className={`mt-3 ${titleClass} ${titleClamp}`}>{paper.title}</h2>

        <p className="mt-2 text-xs text-[#8b8b8b]">
          <time dateTime={paper.publishedAt}>{publishedLabel}</time>
        </p>
      </div>

      <div
        className={`feed-card-scroll mt-3 min-h-0 flex-1 ${dense ? "overflow-y-hidden" : "overflow-y-auto"}`}
      >
        <div className="space-y-4">
          <section>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b1f1f]">The problem</p>
            <p
              className={`mt-1.5 font-serif text-sm italic leading-relaxed text-[#3d3d3d] sm:text-[15px] ${dense ? "line-clamp-2" : ""}`}
            >
              {extras.problem}
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#8b1f1f] text-[10px] font-black text-white"
                aria-hidden
              >
                e
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b1f1f]">ELI5 (explain like I&apos;m 5)</p>
            </div>
            <p
              className={`mt-2 font-serif text-sm italic leading-relaxed text-[#3d3d3d] sm:text-[15px] ${dense ? "line-clamp-3" : ""}`}
            >
              {extras.eli5}
            </p>
          </section>

          <section>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b1f1f]">Methodology</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(dense ? extras.methodology.slice(0, 2) : extras.methodology).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-[#e8e3dd] bg-[#f5f1eb] px-2.5 py-1 text-xs font-medium text-[#5f5f5f]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>

      <footer className={`card-dots shrink-0 border-t border-[#e8e3dd] bg-[#faf8f5] py-2.5 sm:py-3 rounded-b-2xl ${footerBleed}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 space-y-1 text-[10px] font-bold uppercase tracking-widest text-[#8b8b8b]">
            <p className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              <span>{readMinutes} min read</span>
            </p>
            <p className="flex items-start gap-1.5 font-mono text-[9px] normal-case font-normal tracking-normal text-[#5f5f5f]">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0" aria-hidden>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span className="min-w-0 break-all leading-snug">{extras.doiDisplay}</span>
            </p>
          </div>
          <a
            href={paper.arxivUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg p-2 text-[#8b1f1f] transition hover:bg-[#8b1f1f]/10"
            aria-label="Open paper on arXiv"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <path d="M15 3h6v6" />
              <path d="M10 14 21 3" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}

const animationDurationMs = 360;
const swipeThresholdPx = 90;
const maxDragPreviewPx = 140;
const prefetchThreshold = 10;
const prefetchDebounceMs = 250;

export function FeedView() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [profileName, setProfileName] = useState("");
  const [modalName, setModalName] = useState("");
  const [modalTopics, setModalTopics] = useState<string[]>([]);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [currentReadTime, setCurrentReadTime] = useState(12);
  const [nextReadTime, setNextReadTime] = useState(12);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const pointerStartX = useRef(0);
  const pointerStartY = useRef(0);
  const activePointerId = useRef<number | null>(null);
  const onboardingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefetchDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightFeedRequestRef = useRef<Promise<Paper[]> | null>(null);
  const lastPrefetchFeedLengthRef = useRef<number | null>(null);

  const fetchFeedBatch = async (): Promise<Paper[]> => {
    if (inFlightFeedRequestRef.current) {
      return inFlightFeedRequestRef.current;
    }

    const request = fetchNextPapers().finally(() => {
      inFlightFeedRequestRef.current = null;
    });
    inFlightFeedRequestRef.current = request;
    return request;
  };

  // Fetch papers from backend on mount
  useEffect(() => {
    const loadFeed = async () => {
      try {
        setIsLoadingFeed(true);
        setFeedError(null);
        const fetchedPapers = await fetchFeedBatch();
        setPapers(fetchedPapers);
      } catch (error) {
        console.error("Failed to load feed:", error);
        // setFeedError("Failed to load papers. Using demo data.");
        // // Fall back to mock data on error
        // setPapers(mockFeed);
      } finally {
        setIsLoadingFeed(false);
      }
    };

    loadFeed();
  }, []);

  useEffect(() => {
    const rawTopics = window.localStorage.getItem(onboardingTopicsKey);
    const rawProfile = window.localStorage.getItem(onboardingProfileKey);
    const hasSeenModal = window.localStorage.getItem(onboardingModalSeenKey) === "true";

    if (rawTopics) {
      try {
        const parsed = JSON.parse(rawTopics) as string[];
        setSelectedTopics(parsed);
        setModalTopics(parsed);
      } catch {
        window.localStorage.removeItem(onboardingTopicsKey);
      }
    }

    if (rawProfile) {
      try {
        const parsed = JSON.parse(rawProfile) as { name?: string; interests?: string[] };
        const existingName = typeof parsed.name === "string" ? parsed.name : "";
        setProfileName(existingName);
        setModalName(existingName);
        if (!rawTopics && Array.isArray(parsed.interests)) {
          setSelectedTopics(parsed.interests);
          setModalTopics(parsed.interests);
        }
      } catch {
        window.localStorage.removeItem(onboardingProfileKey);
      }
    }

    if (!hasSeenModal) {
      setIsOnboardingOpen(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (onboardingTimerRef.current) {
        clearTimeout(onboardingTimerRef.current);
      }
      if (prefetchDebounceTimerRef.current) {
        clearTimeout(prefetchDebounceTimerRef.current);
      }
    };
  }, []);



  useEffect(() => {
    setCurrentReadTime(Math.floor(Math.random() * 20) + 5);
    setNextReadTime(Math.floor(Math.random() * 20) + 5);
  }, [papers]);

  useEffect(() => {
    if (isLoadingFeed || isFetchingMore) {
      return;
    }

    if (papers.length !== prefetchThreshold) {
      return;
    }

    // Only prefetch once per feed length at the exact threshold.
    if (lastPrefetchFeedLengthRef.current === papers.length) {
      return;
    }
    lastPrefetchFeedLengthRef.current = papers.length;

    const loadMore = async () => {
      try {
        if (inFlightFeedRequestRef.current) {
          return;
        }

        setIsFetchingMore(true);
        const fetchedPapers = await fetchFeedBatch();
		// Reset the prefetch guard so it can trigger again at the threshold
        lastPrefetchFeedLengthRef.current = null;

        setPapers((previous) => [...previous, ...fetchedPapers]);
      } catch (error) {
        console.error("Failed to prefetch papers:", error);
      } finally {
        setIsFetchingMore(false);
      }
    };

    if (prefetchDebounceTimerRef.current) {
      clearTimeout(prefetchDebounceTimerRef.current);
    }

    prefetchDebounceTimerRef.current = setTimeout(() => {
      void loadMore();
    }, prefetchDebounceMs);

    return () => {
      if (prefetchDebounceTimerRef.current) {
        clearTimeout(prefetchDebounceTimerRef.current);
        prefetchDebounceTimerRef.current = null;
      }
    };
  }, [papers.length, isFetchingMore, isLoadingFeed])

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (swipeDirection) {
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    activePointerId.current = e.pointerId;
    pointerStartX.current = e.clientX;
    pointerStartY.current = e.clientY;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDragging || activePointerId.current !== e.pointerId || swipeDirection) {
      return;
    }

    const deltaX = e.clientX - pointerStartX.current;
    const deltaY = e.clientY - pointerStartY.current;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      const clamped = Math.max(-maxDragPreviewPx, Math.min(maxDragPreviewPx, deltaX));
      setDragOffsetX(clamped);
    }
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLElement>) => {
    if (activePointerId.current !== e.pointerId) {
      return;
    }

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const deltaX = e.clientX - pointerStartX.current;
    activePointerId.current = null;
    setIsDragging(false);

    if (Math.abs(deltaX) >= swipeThresholdPx) {
      handleSwipe(deltaX > 0 ? "right" : "left");
      return;
    }

    setDragOffsetX(0);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLElement>) => {
    if (activePointerId.current !== e.pointerId) {
      return;
    }

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    activePointerId.current = null;
    setIsDragging(false);
    setDragOffsetX(0);
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (swipeDirection || papers.length === 0) {
      return;
    }

    setSwipeDirection(direction);
    setIsDragging(false);
    setDragOffsetX(0);

    // Log swipe to backend and remove paper from feed
    if (papers[0]?.id) {
      logSwipe(papers[0].id, direction).catch((error) => {
        console.error("Failed to log swipe:", error);
      });
    }

    setTimeout(() => {
      setPapers((prev) => prev.slice(1));
      setSwipeDirection(null);
      setDragOffsetX(0);
    }, animationDurationMs);
  };

  const getCardStyle = () => {
    if (swipeDirection === "left") {
      return {
        transform: "translateX(-115%) rotate(-6deg)",
        opacity: 0,
        transition: `transform ${animationDurationMs}ms ease-out, opacity ${animationDurationMs}ms ease-out`,
      };
    }

    if (swipeDirection === "right") {
      return {
        transform: "translateX(115%) rotate(6deg)",
        opacity: 0,
        transition: `transform ${animationDurationMs}ms ease-out, opacity ${animationDurationMs}ms ease-out`,
      };
    }

    const rotation = (dragOffsetX / maxDragPreviewPx) * 5;

    return {
      transform: `translateX(${dragOffsetX}px) rotate(${rotation}deg)`,
      opacity: 1,
      transition: isDragging ? "none" : "transform 220ms ease-out, opacity 220ms ease-out",
    };
  };

  const activeDirection = swipeDirection ?? (dragOffsetX > 8 ? "right" : dragOffsetX < -8 ? "left" : null);
  const activeOverlayOpacity = swipeDirection ? 1 : Math.min(Math.abs(dragOffsetX) / maxDragPreviewPx, 1);

  const toggleModalTopic = (topic: string) => {
    setModalTopics((current) =>
      current.includes(topic) ? current.filter((entry) => entry !== topic) : [...current, topic],
    );
  };

  const completeOnboarding = () => {
    const cleanedName = modalName.trim();
    window.localStorage.setItem(onboardingTopicsKey, JSON.stringify(modalTopics));
    window.localStorage.setItem(
      onboardingProfileKey,
      JSON.stringify({ name: cleanedName, interests: modalTopics }),
    );
    window.localStorage.setItem(onboardingModalSeenKey, "true");
    setSelectedTopics(modalTopics);
    setProfileName(cleanedName);
    setIsOnboardingLoading(true);

    onboardingTimerRef.current = setTimeout(() => {
      setIsOnboardingLoading(false);
      setIsOnboardingOpen(false);
    }, 5000);
  };

  const skipOnboarding = () => {
    window.localStorage.setItem(onboardingModalSeenKey, "false");
    setIsOnboardingOpen(false);
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-x-hidden">
      {/* Fixed footprint: fills space above actions; each card is h-full w-full of this region */}
      <div className="relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-hidden overscroll-x-none">
        {papers.length > 0 ? (
          <div className="grid h-full min-h-0 w-full min-w-0 max-w-full grid-cols-1 grid-rows-1 [grid-auto-rows:minmax(0,1fr)] [grid-template-areas:'stack']">
            {papers.length > 1 ? (
              <article
                key={`next-${papers[1].id}`}
                className={`[grid-area:stack] col-start-1 row-start-1 z-0 box-border flex h-full min-h-0 w-full min-w-0 max-w-full origin-top flex-col rounded-2xl border border-[#e8e3dd] bg-white shadow-sm transition-all duration-300 ease-out select-none ${
                  swipeDirection
                    ? "translate-y-0 scale-100 opacity-100"
                    : "translate-y-3 scale-[0.97] opacity-70"
                }`}
                aria-hidden="true"
              >
                <FeedPaperCardContent paper={papers[1]} readMinutes={nextReadTime} dense />
              </article>
            ) : null}

            {/* Clip transform overflow so swipe does not create page scrollbars */}
            <div className="[grid-area:stack] col-start-1 row-start-1 z-10 flex h-full min-h-0 w-full min-w-0 max-w-full overflow-hidden rounded-2xl">
              <article
                key={papers[0].id}
                className="relative box-border flex h-full min-h-0 w-full min-w-0 max-w-full flex-col rounded-2xl border border-[#e8e3dd] bg-white shadow-lg will-change-transform select-none"
                style={{ ...getCardStyle(), touchAction: "pan-y" }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerCancel}
              >
                <div className="pointer-events-none absolute inset-0 z-20 rounded-2xl">
                  <div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      boxShadow:
                        activeDirection === "right"
                          ? `inset 0 -80px 60px rgba(45, 150, 45, ${0.45 * activeOverlayOpacity})`
                          : activeDirection === "left"
                            ? `inset 0 -80px 60px rgba(224, 83, 83, ${0.45 * activeOverlayOpacity})`
                            : "none",
                      transition: isDragging ? "none" : "box-shadow 140ms ease-out",
                    }}
                  />

                  {activeDirection && (
                    <div
                      className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#e8e3dd] bg-white/90 text-4xl text-[#252525] shadow-md"
                      style={{ opacity: Math.min(0.95, 0.25 + activeOverlayOpacity * 0.7), transition: isDragging ? "none" : "opacity 140ms ease-out" }}
                    >
                      {activeDirection === "right" ? "✓" : "✕"}
                    </div>
                  )}
                </div>

                <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
                  <FeedPaperCardContent paper={papers[0]} readMinutes={currentReadTime} />
                </div>
              </article>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-0 items-center justify-center rounded-2xl bg-[#f2ede6] p-6 text-center">
            <div>
              {isLoadingFeed || isFetchingMore ? (
                <>
                  <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-[#e8e3dd] border-t-[#8b1f1f]" />
                  <p className="text-sm font-bold uppercase tracking-widest text-[#8b8b8b]">Loading feed</p>
                  <p className="mt-2 text-sm text-[#5f5f5f]">Fetching more papers for you...</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold uppercase tracking-widest text-[#8b8b8b]">No papers available</p>
                  <p className="mt-2 text-sm text-[#5f5f5f]">
                    {feedError ?? "Try adjusting interests or reload to fetch papers."}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex shrink-0 items-center justify-center gap-4 py-4 md:py-5">
        <button
          className="inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-transparent bg-[#e05353] text-white shadow-sm transition-all duration-200 hover:bg-[#cf4747] hover:shadow-md"
          onClick={() => handleSwipe("left")}
          aria-label="Archive"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
        <button
          className="inline-flex opacity-0 h-12 w-12 items-center justify-center rounded-full border border-transparent bg-[#d4a574] text-white shadow-sm transition-all duration-200 hover:bg-[#bc8f63] hover:shadow-md"
          aria-label="Bookmark"
        >
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
          </svg>
        </button>
        <button
          className="inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-transparent bg-[#2da62d] text-white shadow-sm transition-all duration-200 hover:bg-[#238b23] hover:shadow-md"
          onClick={() => handleSwipe("right")}
          aria-label="Save"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m20 6-11 11-5-5" />
          </svg>
        </button>
      </div>

      {isOnboardingOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f5f1eb] px-4">
          {isOnboardingLoading ? (
            <div className="w-full max-w-xl rounded-2xl bg-white p-8 text-center shadow-xl md:p-10">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#e8e3dd] border-t-[#8b1f1f]" />
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8b8b8b]">Personalizing</p>
              <h2 className="mt-2 text-2xl font-black text-[#252525]">Building your feed</h2>
              <p className="mt-2 text-sm text-[#5f5f5f]">
                Curating papers based on your interests. This takes a few seconds.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl md:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8b8b8b]">Welcome</p>
              <h2 className="mt-1 text-2xl font-black text-[#252525]">Set up your profile</h2>
              <p className="mt-2 text-sm text-[#5f5f5f]">
                Add your name and select interests to personalize your feed.
              </p>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#252525]">Name</span>
                  <input
                    type="text"
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-[#e8e3dd] px-3 py-2.5 text-sm text-[#252525] outline-none transition focus:border-[#8b1f1f] focus:ring-2 focus:ring-[#8b1f1f]/10"
                  />
                </label>

                <div>
                  <p className="text-sm font-semibold text-[#252525]">Interests</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {topics.map((topic) => {
                      const active = modalTopics.includes(topic);
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => toggleModalTopic(topic)}
                          className={`cursor-pointer rounded-full px-3 py-2 text-sm font-medium transition ${
                            active
                              ? "bg-[#8b1f1f] text-white"
                              : "bg-[#f5f1eb] text-[#5f5f5f] hover:bg-[#e8e3dd]"
                          }`}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={skipOnboarding}
                  className="cursor-pointer rounded-full px-4 py-2 text-sm font-semibold text-[#8b8b8b] hover:bg-[#f5f1eb]"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={completeOnboarding}
                  className="cursor-pointer rounded-full bg-[#8b1f1f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a52a2a]"
                >
                  Save and continue
                </button>
              </div>

              {profileName ? (
                <p className="mt-3 text-xs text-[#8b8b8b]">Current profile: {profileName}</p>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
