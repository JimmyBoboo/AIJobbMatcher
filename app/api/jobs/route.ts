import { NextResponse } from "next/server";
import { isApplicationOpen } from "@/lib/job-utils";

const BASE_URL = "https://pam-stilling-feed.nav.no";
const FEED_ENDPOINT = "/api/v1/feed";
const MAX_PAGES = 100;
const MAX_ITEMS = 5000;

type FeedItem = {
  _feed_entry?: { status?: string; applicationDue?: string };
  applicationDue?: string;
  [key: string]: unknown;
};

type FeedPage = {
  items?: unknown[];
  next_url?: string | null;
  next_id?: string | null;
  [key: string]: unknown;
};

function resolveNextUrl(nextUrl: string | undefined | null): string | null {
  if (!nextUrl || typeof nextUrl !== "string") return null;
  const trimmed = nextUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${BASE_URL}${path}`;
}

export async function GET() {
  try {
    const apiKey = process.env.NAVPIM_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const ifModifiedSince = sevenDaysAgo.toUTCString();

    const headers: HeadersInit = {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "If-Modified-Since": ifModifiedSince,
    };

    const allItems: FeedItem[] = [];
    let nextUrl: string | null = `${BASE_URL}${FEED_ENDPOINT}`;
    let pageCount = 0;
    let data: FeedPage = {};

    while (nextUrl && pageCount < MAX_PAGES && allItems.length < MAX_ITEMS) {
      const response = await fetch(nextUrl, { headers });

      if (!response.ok) {
        console.warn(`NAV feed page error: ${response.status} for ${nextUrl}`);
        break;
      }

      const pageData: FeedPage = await response.json();
      data = pageData;
      const pageItems = Array.isArray(pageData?.items) ? pageData.items : [];
      allItems.push(...(pageItems as FeedItem[]));

      const nextFromUrl = resolveNextUrl(pageData.next_url ?? null);
      const nextId = pageData.next_id;
      if (nextFromUrl) {
        nextUrl = nextFromUrl;
      } else if (nextId != null && String(nextId).trim() !== "") {
        nextUrl = `${BASE_URL}${FEED_ENDPOINT}?next_id=${encodeURIComponent(String(nextId).trim())}`;
      } else {
        nextUrl = null;
      }
      pageCount++;
    }

    const items = (allItems as FeedItem[]).filter((item) => {
      const status = item._feed_entry?.status;
      if (status === "INACTIVE") return false;
      const due =
        item.applicationDue ?? item._feed_entry?.applicationDue;
      return isApplicationOpen(due);
    });

    return NextResponse.json({
      ...data,
      items,
      next_id: null,
      next_url: null,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
