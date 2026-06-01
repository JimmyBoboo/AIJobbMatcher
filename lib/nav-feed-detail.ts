import { htmlToPlainText } from "@/lib/format-job";
import { isCurrentJobListing, type FeedItemLike } from "@/lib/job-utils";
import type { NavJobDetailJson, NavJobDetailResponse } from "@/lib/schemas/job-feed";

const BASE_URL = "https://pam-stilling-feed.nav.no";
const DETAIL_CONCURRENCY = 40;
const CONTENT_PREVIEW_MAX = 500;

type NavDetailPayload = NavJobDetailResponse & {
  status?: string;
  ad_content?: unknown;
};

function resolveDetailUrl(relativeUrl: string): string {
  const trimmed = relativeUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${BASE_URL}${path}`;
}

/** Normalizes NAV vacancy detail from json / ad_content / ad_content.json. */
export function extractNavJobDetail(
  data: NavDetailPayload
): NavJobDetailJson | null {
  if (data.json && typeof data.json === "object") {
    return data.json;
  }

  const adContent = data.ad_content;
  if (!adContent || typeof adContent !== "object") return null;

  if (
    "json" in adContent &&
    adContent.json &&
    typeof adContent.json === "object"
  ) {
    return adContent.json as NavJobDetailJson;
  }

  if ("title" in adContent || "description" in adContent) {
    return adContent as NavJobDetailJson;
  }

  return null;
}

function getApplicationDue(detail: NavJobDetailJson): string | undefined {
  return detail.applicationDue ?? detail.expires;
}

function buildContentPreview(description: string | undefined): string | undefined {
  if (!description?.trim()) return undefined;
  const plain = htmlToPlainText(description).replace(/\s+/g, " ").trim();
  if (!plain) return undefined;
  if (plain.length <= CONTENT_PREVIEW_MAX) return plain;
  return `${plain.slice(0, CONTENT_PREVIEW_MAX).trim()}…`;
}

async function fetchVacancyDetail(
  apiKey: string,
  relativeUrl: string
): Promise<{ status?: string; detail: NavJobDetailJson | null } | null> {
  try {
    const response = await fetch(resolveDetailUrl(relativeUrl), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as NavDetailPayload;
    return {
      status: data.status,
      detail: extractNavJobDetail(data),
    };
  } catch {
    return null;
  }
}

/**
 * Validates feed items against NAV detail API (source of truth for ACTIVE + content),
 * filters expired/inactive, and attaches applicationDue + description preview.
 */
export async function enrichFeedItemsWithDetail<T extends FeedItemLike>(
  apiKey: string,
  items: T[]
): Promise<T[]> {
  const enriched: T[] = [];

  for (let i = 0; i < items.length; i += DETAIL_CONCURRENCY) {
    const chunk = items.slice(i, i + DETAIL_CONCURRENCY);
    const results = await Promise.all(
      chunk.map(async (item) => {
        const relativeUrl =
          typeof item.url === "string" ? item.url.trim() : "";
        if (!relativeUrl) return null;

        const fetched = await fetchVacancyDetail(apiKey, relativeUrl);
        if (!fetched?.detail) return null;
        if (fetched.status === "INACTIVE") return null;

        const applicationDue = getApplicationDue(fetched.detail);
        if (
          !isCurrentJobListing({
            status: "ACTIVE",
            applicationDue,
            sistEndret: item.date_modified ?? item._feed_entry?.sistEndret,
          })
        ) {
          return null;
        }

        const preview = buildContentPreview(fetched.detail.description);
        const feedEntry = item._feed_entry ?? {};

        return {
          ...item,
          content_text: preview ?? item.content_text,
          _feed_entry: {
            ...feedEntry,
            uuid: feedEntry.uuid ?? item.id ?? "",
            status: "ACTIVE" as const,
            title: fetched.detail.title ?? feedEntry.title ?? item.title ?? "",
            businessName:
              fetched.detail.employer?.name ?? feedEntry.businessName ?? "",
            applicationDue: applicationDue ?? feedEntry.applicationDue,
          },
          _nav_detail: fetched.detail,
        } as T;
      })
    );

    for (const result of results) {
      if (result) enriched.push(result);
    }
  }

  return enriched;
}
