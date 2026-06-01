/** NAV ads can never be active longer than 6 months. */
export const MAX_ACTIVE_JOB_AGE_MONTHS = 6;

const OPEN_DEADLINE_PHRASES = [
  "snarest",
  "løpende",
  "lopende",
  "etter avtale",
  "omgående",
  "omgaende",
];

export type CurrentJobListingInput = {
  status?: string | null;
  applicationDue?: string | null;
  sistEndret?: string | null;
};

export type FeedItemLike = {
  id?: string;
  url?: string;
  title?: string;
  content_text?: string;
  date_modified?: string;
  _feed_entry?: {
    uuid?: string;
    sistEndret?: string;
    status?: string;
    applicationDue?: string;
    title?: string;
    businessName?: string;
    municipal?: string;
  };
  applicationDue?: string;
};

function looksLikeDateString(value: string): boolean {
  return (
    /^\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4}$/.test(value) ||
    /^\d{4}-\d{2}-\d{2}/.test(value)
  );
}

function isOpenDeadlinePhrase(value: string): boolean {
  const lower = value.toLowerCase();
  return OPEN_DEADLINE_PHRASES.some(
    (phrase) => lower === phrase || lower.includes(phrase),
  );
}

/** Parses NAV/Pinecone date strings, including Norwegian DD.MM.YYYY and DD-MM-YYYY. */
export function parseJobDate(value: string | undefined | null): Date | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (trimmed === "") return null;
  if (isOpenDeadlinePhrase(trimmed)) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const iso = new Date(trimmed);
    if (!Number.isNaN(iso.getTime())) return iso;
  }

  const dmy = trimmed.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]) - 1;
    const year = Number(dmy[3]);
    const parsed = new Date(year, month, day);
    if (
      !Number.isNaN(parsed.getTime()) &&
      parsed.getFullYear() === year &&
      parsed.getMonth() === month &&
      parsed.getDate() === day
    ) {
      return parsed;
    }
  }

  const fallback = new Date(trimmed);
  if (!Number.isNaN(fallback.getTime())) return fallback;

  return null;
}

/**
 * Returns true if the application is still open (due date is today or in the future).
 * Open-ended phrases (e.g. "Snarest") count as open. Unparseable date-like strings
 * are treated as closed.
 */
export function isApplicationOpen(
  dueDate: string | undefined | null
): boolean {
  if (dueDate == null || String(dueDate).trim() === "") return true;
  const trimmed = String(dueDate).trim();
  if (isOpenDeadlinePhrase(trimmed)) return true;

  const parsed = parseJobDate(trimmed);
  if (!parsed) {
    return !looksLikeDateString(trimmed);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(parsed);
  due.setHours(0, 0, 0, 0);
  return due.getTime() >= today.getTime();
}

export function isWithinMaxActiveAge(
  sistEndret: string | undefined | null
): boolean {
  if (sistEndret == null || String(sistEndret).trim() === "") return true;
  const parsed = parseJobDate(sistEndret);
  if (!parsed) return true;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - MAX_ACTIVE_JOB_AGE_MONTHS);
  cutoff.setHours(0, 0, 0, 0);
  return parsed.getTime() >= cutoff.getTime();
}

/**
 * Returns true when a job listing is current: ACTIVE (when status is set),
 * application still open, and not older than NAV's max active period.
 */
export function isCurrentJobListing(input: CurrentJobListingInput): boolean {
  const status = input.status?.trim();
  if (status && status !== "ACTIVE") return false;
  if (!isApplicationOpen(input.applicationDue)) return false;
  if (!isWithinMaxActiveAge(input.sistEndret)) return false;
  return true;
}

function getFeedItemKey(item: FeedItemLike): string | null {
  const uuid = item._feed_entry?.uuid?.trim();
  if (uuid) return uuid;
  const id = item.id?.trim();
  if (id) return id;
  return null;
}

function getFeedItemModifiedTime(item: FeedItemLike): number {
  for (const candidate of [item.date_modified, item._feed_entry?.sistEndret]) {
    if (candidate?.trim()) {
      const parsed = parseJobDate(candidate);
      if (parsed) return parsed.getTime();
    }
  }
  return 0;
}

/** Keeps the latest feed entry per uuid/id (NAV emits a new entry on each change). */
export function dedupeFeedItemsByLatestState<T extends FeedItemLike>(
  items: T[]
): T[] {
  const byKey = new Map<string, T>();
  for (const item of items) {
    const key = getFeedItemKey(item);
    if (!key) continue;
    const existing = byKey.get(key);
    if (
      !existing ||
      getFeedItemModifiedTime(item) >= getFeedItemModifiedTime(existing)
    ) {
      byKey.set(key, item);
    }
  }
  return Array.from(byKey.values());
}

export function isCurrentFeedItem(item: FeedItemLike): boolean {
  return isCurrentJobListing({
    status: item._feed_entry?.status,
    applicationDue: item.applicationDue ?? item._feed_entry?.applicationDue,
    sistEndret: item.date_modified ?? item._feed_entry?.sistEndret,
  });
}
