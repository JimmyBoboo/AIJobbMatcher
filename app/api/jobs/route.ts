import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { JobItem, PaginatedJobsResponse } from "@/lib/schemas/job-feed";

const BASE_URL = "https://pam-stilling-feed.nav.no";
const FEED_ENDPOINT = "/api/v1/feed";
const CACHE_REVALIDATE = 300; // 5 minutes
const DEFAULT_LIMIT = 20;
const MAX_NAV_PAGES = 100; // Safety limit

interface FeedPage {
  version: string;
  title: string;
  next_url: string | null;
  next_id: string | null;
  items: JobItem[];
}

interface FeedState {
  allItems: JobItem[];
  nextUrl: string | null;
  isComplete: boolean;
  navPagesFetched: number;
  lastFetched: number;
}

// RFC-1123 format: "Sat, 01 Jun 2024 00:00:00 +0200"
function toRFC1123(date: Date): string {
  return date.toUTCString().replace("GMT", "+0000");
}

function getOneMonthAgo(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return toRFC1123(date);
}

async function fetchFeedPage(
  apiKey: string,
  path: string,
  modifiedSince?: string
): Promise<FeedPage> {
  const url = `${BASE_URL}${path}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  // Use If-Modified-Since to skip old data
  if (modifiedSince) {
    headers["If-Modified-Since"] = modifiedSince;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`NAV API error: ${response.status}`);
  }

  return response.json();
}

// Global in-memory cache for feed state (fallback if unstable_cache doesn't work as expected)
let globalFeedState: FeedState | null = null;
let globalCacheExpiry = 0;

async function getFeedState(): Promise<FeedState> {
  const apiKey = process.env.NAVPIM_KEY;
  if (!apiKey) {
    throw new Error("Missing API key");
  }

  // Check global cache first
  const now = Date.now();
  if (globalFeedState && now < globalCacheExpiry) {
    return globalFeedState;
  }

  const modifiedSince = getOneMonthAgo();
  console.log("Initializing feed state, fetching from:", modifiedSince);

  // Fetch first page to initialize
  const firstPage = await fetchFeedPage(apiKey, FEED_ENDPOINT, modifiedSince);

  // Filter for active jobs only
  const activeItems = firstPage.items.filter(
    (item) => item._feed_entry.status === "ACTIVE"
  );

  const state: FeedState = {
    allItems: activeItems,
    nextUrl: firstPage.next_url,
    isComplete: !firstPage.next_url,
    navPagesFetched: 1,
    lastFetched: now,
  };

  console.log(
    `Initialized feed state: ${
      activeItems.length
    } active items, hasMore: ${!!firstPage.next_url}`
  );

  // Update global cache
  globalFeedState = state;
  globalCacheExpiry = now + CACHE_REVALIDATE * 1000;

  return state;
}

async function fetchMorePages(
  currentState: FeedState,
  itemsNeeded: number
): Promise<FeedState> {
  const apiKey = process.env.NAVPIM_KEY;
  if (!apiKey) {
    throw new Error("Missing API key");
  }

  if (currentState.isComplete) {
    return currentState;
  }

  let state = { ...currentState };

  // Fetch more pages until we have enough items or reach the end
  while (
    state.allItems.length < itemsNeeded &&
    state.nextUrl &&
    state.navPagesFetched < MAX_NAV_PAGES
  ) {
    console.log(
      `Fetching more pages. Current: ${state.allItems.length} items, need: ${itemsNeeded}`
    );

    const page = await fetchFeedPage(apiKey, state.nextUrl);

    // Filter for active jobs only
    const activeItems = page.items.filter(
      (item) => item._feed_entry.status === "ACTIVE"
    );

    state = {
      allItems: [...state.allItems, ...activeItems],
      nextUrl: page.next_url,
      isComplete: !page.next_url,
      navPagesFetched: state.navPagesFetched + 1,
      lastFetched: Date.now(),
    };

    console.log(
      `Fetched page ${state.navPagesFetched}: +${activeItems.length} active items, total: ${state.allItems.length}`
    );
  }

  // Update global cache
  globalFeedState = state;
  globalCacheExpiry = Date.now() + CACHE_REVALIDATE * 1000;

  return state;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(
      searchParams.get("limit") || String(DEFAULT_LIMIT),
      10
    );

    // Validate params
    if (page < 1) {
      return NextResponse.json({ error: "Page must be >= 1" }, { status: 400 });
    }
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Calculate how many items we need
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const itemsNeeded = endIndex;

    console.log(
      `Request: page=${page}, limit=${limit}, need ${itemsNeeded} items`
    );

    // Get current feed state
    let state = await getFeedState();

    // Fetch more pages if needed
    if (state.allItems.length < itemsNeeded && !state.isComplete) {
      state = await fetchMorePages(state, itemsNeeded);
    }

    // Slice the requested page
    const pageItems = state.allItems.slice(startIndex, endIndex);
    const totalPages = Math.ceil(state.allItems.length / limit);

    const response: PaginatedJobsResponse = {
      items: pageItems,
      page,
      limit,
      totalItems: state.allItems.length,
      totalPages: state.isComplete ? totalPages : totalPages + 1, // +1 if more might exist
      hasMore: state.allItems.length > endIndex || !state.isComplete,
      isComplete: state.isComplete,
    };

    console.log(
      `Returning page ${page}: ${pageItems.length} items, total: ${state.allItems.length}, complete: ${state.isComplete}`
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
