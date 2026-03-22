"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { mockFeed } from "@/lib/mock-data";

const onboardingKey = "lol.onboarding.topics";

export default function Home() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [currentReadTime, setCurrentReadTime] = useState(12);
  const [nextReadTime, setNextReadTime] = useState(12);
  const pointerStartX = useRef(0);
  const pointerStartY = useRef(0);
  const activePointerId = useRef<number | null>(null);
  const animationDurationMs = 360;
  const swipeThresholdPx = 90;
  const maxDragPreviewPx = 140;

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
    if (swipeDirection) {
      return;
    }

    setSwipeDirection(direction);
    setIsDragging(false);
    setDragOffsetX(0);
    setTimeout(() => {
      setCardIndex((prev) => prev + 1);
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

  const cardImages = [
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1170&q=80",
    "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=735&q=80",
    "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=662&q=80",
    "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=987&q=80",
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1170&q=80",
  ];

  const currentImage = cardImages[cardIndex % cardImages.length];
  const nextImage = cardImages[(cardIndex + 1) % cardImages.length];

  const nextPaper = filteredFeed[(cardIndex + 1) % filteredFeed.length];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Featured Paper Card Stack */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <article
          key={`next-${nextPaper.id}`}
          className={`absolute inset-0 z-0 overflow-hidden rounded-2xl border border-[#e8e3dd] shadow-sm transition-all duration-300 ease-out select-none ${
            swipeDirection
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-3 scale-[0.97] opacity-70"
          }`}
          style={{ backgroundImage: `url(${nextImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 lg:p-7 text-white">
            <div className="space-y-2">
              <p className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/90">
                {nextPaper.primaryCategory}
              </p>
              <h2 className="line-clamp-3 text-2xl font-black leading-tight lg:text-3xl">{nextPaper.title}</h2>
              <p className="text-sm text-white/85">
                {nextPaper.authors[0]} • {new Date(nextPaper.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
              <p className="line-clamp-2 text-sm text-white/80">{nextPaper.abstract}</p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-white/80">
              <span>Read Time {nextReadTime} min</span>
              <span>DQ-2024-0{((cardIndex + 1) % 1000).toString().padStart(3, "0")}</span>
            </div>
          </div>
        </article>

        <article
          key={currentPaper.id}
          className="relative z-10 h-full overflow-hidden rounded-2xl border border-[#e8e3dd] shadow-md will-change-transform select-none"
          style={{ ...getCardStyle(), backgroundImage: `url(${currentImage})`, backgroundSize: "cover", backgroundPosition: "center", touchAction: "pan-y" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerCancel}
        >
          <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-transparent" />

          <div className="pointer-events-none absolute inset-0 z-20">
            <div
              className="absolute inset-0"
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
                className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/80 bg-black/35 text-4xl text-white"
                style={{ opacity: Math.min(0.95, 0.25 + activeOverlayOpacity * 0.7), transition: isDragging ? "none" : "opacity 140ms ease-out" }}
              >
                {activeDirection === "right" ? "✓" : "✕"}
              </div>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 p-6 lg:p-7 text-white">
            <div className="space-y-2">
              <p className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/90">
                {currentPaper.primaryCategory}
              </p>
              <h2 className="line-clamp-3 text-2xl font-black leading-tight lg:text-3xl">{currentPaper.title}</h2>
              <p className="text-sm text-white/85">
                {currentPaper.authors[0]} • {new Date(currentPaper.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
              <p className="line-clamp-2 text-sm text-white/80">{currentPaper.abstract}</p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-white/80">
              <span>Read Time {currentReadTime} min</span>
              <span>DQ-2024-0{(cardIndex % 1000).toString().padStart(3, "0")}</span>
            </div>
          </div>
        </article>
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
          className="inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-transparent bg-[#d4a574] text-white shadow-sm transition-all duration-200 hover:bg-[#bc8f63] hover:shadow-md"
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
    </div>
  );
}
