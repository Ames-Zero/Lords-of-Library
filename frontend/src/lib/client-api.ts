/**
 * Client-side API functions for browser-only operations.
 * These functions make requests through the Next.js API proxy at /api/[...path]
 * which forwards requests to the FastAPI backend at http://localhost:8000
 */

import type { ConnectionProfile, Paper } from "@/lib/types";
import { mockConnections, mockFeed } from "@/lib/mock-data";

const API_BASE = "/api"; // Uses Next.js proxy at /api/[...path]

export interface SwipePayload {
  paper_id: string;
  direction: "left" | "right";
}

interface SwipeResponse {
  status: string;
}

interface BackendPaper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  primaryCategory: string;
  categories: string[];
  publishedAt: string;
  arxivUrl: string;
  pdfUrl: string;
}

interface BackendSavedPaper extends BackendPaper {
  savedAt: string;
}

/**
 * Transform backend response to frontend Paper type
 */
function transformPaper(data: BackendPaper): Paper {
  return {
    id: data.id,
    title: data.title,
    abstract: data.abstract,
    authors: data.authors,
    primaryCategory: data.primaryCategory as any,
    categories: data.categories as any[],
    publishedAt: data.publishedAt,
    arxivUrl: data.arxivUrl,
    pdfUrl: data.pdfUrl,
  };
}

/**
 * Fetch next batch of papers from the recommender
 * GET /feed/next
 */
export async function fetchNextPapers(): Promise<Paper[]> {
  try {
    const response = await fetch(`${API_BASE}/feed/next`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      console.warn(`Feed request failed with ${response.status} ${response.statusText}. Using demo data.`);
      return mockFeed;
    }

    const papers = (await response.json()) as BackendPaper[];
    if (!Array.isArray(papers)) {
      console.warn("Feed response was not an array. Using demo data.");
      return mockFeed;
    }
  
    return papers.map(transformPaper);
  } catch (error) {
    console.warn("Error fetching papers. Using demo data:", error);
    return mockFeed;
  }
}

/**
 * Log a swipe action and update LinUCB state
 * POST /swipe
 */
export async function logSwipe(paperId: string, direction: "left" | "right"): Promise<void> {
  try {
    const payload: SwipePayload = {
      paper_id: paperId,
      direction,
    };

    const response = await fetch(`${API_BASE}/swipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to log swipe: ${response.statusText}`);
    }

    const result = (await response.json()) as SwipeResponse;
    if (result.status !== "ok") {
      throw new Error(`Swipe logging returned non-ok status: ${result.status}`);
    }
  } catch (error) {
    console.error("Error logging swipe:", error);
    throw error;
  }
}

/**
 * Fetch all saved (right-swiped) papers for the user
 * GET /saved
 */
export async function fetchSavedPapers(): Promise<Paper[]> {
  try {
    const response = await fetch(`${API_BASE}/saved`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch saved papers: ${response.statusText}`);
    }

    const savedPapers = (await response.json()) as BackendSavedPaper[];
    return savedPapers.map(transformPaper);
  } catch (error) {
    console.error("Error fetching saved papers:", error);
    throw error;
  }
}


/**
 * Check backend health
 * GET /
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}`, {
      method: "GET",
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch connection profiles (same shape as server getConnectionProfiles).
 * GET /connections
 */
export async function fetchConnectionProfiles(): Promise<{
  profiles: ConnectionProfile[];
  source: "backend" | "mock";
}> {
  try {
    const response = await fetch(`${API_BASE}/connections`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch connections: ${response.status}`);
    }

    const payload = (await response.json()) as
      | Array<{
          name?: string;
          alias?: string;
          bio?: string;
          topics?: string[];
        }>
      | {
          connections?: Array<{
            name?: string;
            alias?: string;
            bio?: string;
            topics?: string[];
          }>;
        };

    const data = Array.isArray(payload) ? payload : (payload.connections ?? []);

    return {
      profiles: data
        .map((profile) => ({
          name: profile.name,
          alias: profile.alias,
          bio: profile.bio ?? "",
          topics: Array.isArray(profile.topics) ? profile.topics : [],
        }))
        .filter((profile) => Boolean(profile.name ?? profile.alias)),
      source: "backend",
    };
  } catch {
    return {
      profiles: mockConnections,
      source: "mock",
    };
  }
}