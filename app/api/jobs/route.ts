import { NextRequest, NextResponse } from "next/server";
import { isApplicationOpen } from "@/lib/job-utils";
import {
  getPineconeClient,
  PINECONE_JOB_INDEX,
  PINECONE_JOB_NAMESPACE,
} from "@/lib/pinecone";
import {
  ENGAGEMENT_TYPE_INDEX_VALUES,
  EXTENT_INDEX_VALUES,
} from "@/lib/job-match-filters";
import type { JobItem } from "@/lib/schemas/job-feed";

const BASE_URL = "https://pam-stilling-feed.nav.no";
const FEED_ENDPOINT = "/api/v1/feed";
const MAX_PAGES = 100;
const MAX_ITEMS = 5000;
/** Max jobs returned when filtering via Pinecone; increase so filtered list is closer to unfiltered feed size. */
const PINECONE_BROWSE_TOP_K = 1000;
const BROAD_QUERY = "stilling jobb Norge";

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

function buildPineconeFilter(
  engagementType: string | undefined,
  county: string | undefined
): object[] {
  const conditions: object[] = [];
  if (county && county.toUpperCase() !== "ANY") {
    conditions.push({ county: { $eq: county } });
  }
  if (engagementType) {
    if (engagementType === "Heltid" || engagementType === "Deltid") {
      const extentValues =
        EXTENT_INDEX_VALUES[engagementType as "Heltid" | "Deltid"];
      const engagementValues =
        ENGAGEMENT_TYPE_INDEX_VALUES[engagementType];
      const orParts: object[] = [];
      if (extentValues?.length > 0) {
        orParts.push({ extent: { $in: extentValues } });
      }
      if (engagementValues?.length > 0) {
        orParts.push({ engagement_type: { $in: engagementValues } });
      }
      if (orParts.length > 0) {
        conditions.push(
          orParts.length === 1 ? orParts[0]! : { $or: orParts }
        );
      }
    } else {
      const indexValues = ENGAGEMENT_TYPE_INDEX_VALUES[engagementType];
      if (indexValues?.length > 0) {
        conditions.push({ engagement_type: { $in: indexValues } });
      } else {
        conditions.push({ engagement_type: { $eq: engagementType } });
      }
    }
  }
  return conditions;
}

function pineconeRecordToJobItem(record: {
  _id: string;
  title?: string;
  employer?: string;
  location?: string;
  county?: string;
  published?: string;
  application_due?: string;
  nav_feed_path?: string;
}): JobItem {
  const url = record.nav_feed_path?.trim() ?? record._id;
  return {
    id: record._id,
    url,
    title: record.title ?? "",
    _feed_entry: {
      uuid: record._id,
      status: "ACTIVE",
      title: record.title ?? "",
      businessName: record.employer ?? "",
      municipal: record.location || record.county || "",
      sistEndret: record.published ?? "",
      applicationDue: record.application_due ?? "",
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const county = searchParams.get("county")?.trim() || undefined;
    const engagementType = searchParams.get("engagementType")?.trim() || undefined;

    const usePinecone = county !== undefined || engagementType !== undefined;

    if (usePinecone) {
      const filterConditions = buildPineconeFilter(engagementType, county);
      const pc = getPineconeClient();
      const namespace = pc
        .index(PINECONE_JOB_INDEX)
        .namespace(PINECONE_JOB_NAMESPACE);
      const query: {
        topK: number;
        inputs: { text: string };
        filter?: object;
      } = {
        topK: PINECONE_BROWSE_TOP_K,
        inputs: { text: BROAD_QUERY },
      };
      if (filterConditions.length > 0) {
        query.filter =
          filterConditions.length === 1
            ? filterConditions[0]
            : { $and: filterConditions };
      }
      const response = await namespace.searchRecords({
        query,
        fields: [
          "title",
          "employer",
          "location",
          "county",
          "occupation",
          "engagement_type",
          "extent",
          "published",
          "application_due",
          "nav_feed_path",
        ],
      });
      const hits = response.result?.hits ?? [];
      const items: JobItem[] = hits.map((hit) => {
        const f = hit.fields as Record<string, string>;
        return pineconeRecordToJobItem({
          _id: hit._id,
          title: f.title,
          employer: f.employer,
          location: f.location,
          county: f.county,
          published: f.published,
          application_due: f.application_due,
          nav_feed_path: f.nav_feed_path,
        });
      });
      const openItems = items.filter((item) =>
        isApplicationOpen(item._feed_entry.applicationDue)
      );
      return NextResponse.json({
        items: openItems,
        page: 1,
        limit: openItems.length,
        totalItems: openItems.length,
        totalPages: 1,
        hasMore: false,
        isComplete: true,
      });
    }

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
