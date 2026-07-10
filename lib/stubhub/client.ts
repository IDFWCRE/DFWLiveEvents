import { getImportWindow } from "@/lib/import/window";
import type { SourceImportTarget } from "@/lib/import/source-targets";

const dfwCenter = { latitude: 32.8998, longitude: -97.0403 };

export type StubHubFetchOptions = {
  log?: (message: string) => void;
  targets?: SourceImportTarget[];
};

export type StubHubEvent = Record<string, unknown>;

export type StubHubFetchSummary = {
  events: StubHubEvent[];
  fetchedCount: number;
  skippedCount: number;
  errors: string[];
  disabled: boolean;
};

function configured(name: string) {
  return (process.env[name] || "").trim();
}

export function isStubHubConfigured() {
  return Boolean(
    configured("STUBHUB_CLIENT_ID") &&
      configured("STUBHUB_CLIENT_SECRET") &&
      configured("STUBHUB_TOKEN_URL") &&
      configured("STUBHUB_API_BASE_URL")
  );
}

function getRequestTimeoutMs() {
  const configuredValue = Number(process.env.STUBHUB_REQUEST_TIMEOUT_MS || 15000);
  if (!Number.isFinite(configuredValue) || configuredValue < 1000) return 15000;
  return Math.floor(configuredValue);
}

function getMaxPagesPerQuery() {
  const configuredValue = Number(process.env.STUBHUB_MAX_PAGES_PER_QUERY || 3);
  if (!Number.isFinite(configuredValue) || configuredValue < 1) return 3;
  return Math.min(Math.floor(configuredValue), 10);
}

function getEventsPath() {
  return configured("STUBHUB_EVENTS_PATH") || "/events";
}

function getUpdatedSince() {
  return configured("STUBHUB_UPDATED_SINCE") || "";
}

function getTargetsByType(targets: SourceImportTarget[] | undefined, targetType: string) {
  return (targets || [])
    .filter((target) => target.source_name.toLowerCase() === "stubhub")
    .filter((target) => target.target_type.toLowerCase() === targetType)
    .map((target) => target.target_value.trim())
    .filter(Boolean);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: URL, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getRequestTimeoutMs());

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`StubHub request timed out after ${getRequestTimeoutMs()}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function getAccessToken(options: StubHubFetchOptions) {
  const tokenUrl = new URL(configured("STUBHUB_TOKEN_URL"));
  const body = new URLSearchParams({
    grant_type: configured("STUBHUB_OAUTH_GRANT_TYPE") || "client_credentials",
    client_id: configured("STUBHUB_CLIENT_ID"),
    client_secret: configured("STUBHUB_CLIENT_SECRET")
  });

  options.log?.("[stubhub] Requesting OAuth access token");
  const response = await fetchWithTimeout(tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    const responseBody = await response.text().catch(() => "");
    throw new Error(`StubHub OAuth failed ${response.status}: ${responseBody.slice(0, 180)}`);
  }

  const json = (await response.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("StubHub OAuth response did not include access_token.");
  return json.access_token;
}

function appendCommonSearchParams(url: URL, page: number, options: StubHubFetchOptions) {
  const importWindow = getImportWindow();
  const eventIds = getTargetsByType(options.targets, "event");
  const venueIds = getTargetsByType(options.targets, "venue");
  const cities = getTargetsByType(options.targets, "city");
  const updatedSince = getUpdatedSince();

  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", process.env.STUBHUB_PAGE_SIZE || "100");
  url.searchParams.set("start_date", importWindow.startIso);
  url.searchParams.set("end_date", importWindow.endIso);
  url.searchParams.set("latitude", String(dfwCenter.latitude));
  url.searchParams.set("longitude", String(dfwCenter.longitude));
  url.searchParams.set("radius", process.env.STUBHUB_RADIUS_MILES || "50");
  url.searchParams.set("radius_unit", "mi");

  if (updatedSince) url.searchParams.set("updated_since", updatedSince);
  if (eventIds.length) url.searchParams.set("event_ids", eventIds.join(","));
  if (venueIds.length) url.searchParams.set("venue_ids", venueIds.join(","));
  if (cities.length) url.searchParams.set("cities", cities.join(","));
}

function extractEvents(payload: unknown) {
  if (Array.isArray(payload)) return payload as StubHubEvent[];
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  for (const key of ["events", "items", "results", "data"]) {
    if (Array.isArray(record[key])) return record[key] as StubHubEvent[];
  }
  return [];
}

function hasMorePages(payload: unknown, page: number, pageEventsCount: number) {
  if (!payload || typeof payload !== "object") return pageEventsCount > 0;
  const record = payload as Record<string, unknown>;
  if (typeof record.has_more === "boolean") return record.has_more;
  if (typeof record.hasMore === "boolean") return record.hasMore;
  const pagination = record.pagination;
  if (pagination && typeof pagination === "object") {
    const paginationRecord = pagination as Record<string, unknown>;
    if (typeof paginationRecord.has_more === "boolean") return paginationRecord.has_more;
    if (typeof paginationRecord.total_pages === "number") return page < paginationRecord.total_pages;
    if (typeof paginationRecord.page_count === "number") return page < paginationRecord.page_count;
  }
  return pageEventsCount > 0;
}

export async function fetchStubHubEvents(options: StubHubFetchOptions = {}): Promise<StubHubFetchSummary> {
  if (!isStubHubConfigured()) {
    options.log?.("[stubhub] Disabled: missing STUBHUB_CLIENT_ID, STUBHUB_CLIENT_SECRET, STUBHUB_TOKEN_URL, or STUBHUB_API_BASE_URL");
    return { events: [], fetchedCount: 0, skippedCount: 0, errors: [], disabled: true };
  }

  const accessToken = await getAccessToken(options);
  const events: StubHubEvent[] = [];
  const errors: string[] = [];
  const maxPages = getMaxPagesPerQuery();

  for (let page = 1; page <= maxPages; page += 1) {
    const url = new URL(getEventsPath(), configured("STUBHUB_API_BASE_URL"));
    appendCommonSearchParams(url, page, options);
    options.log?.(`[stubhub] GET ${url.pathname}${url.search}`);

    try {
      const response = await fetchWithTimeout(url, {
        headers: { Authorization: `Bearer ${accessToken}`, accept: "application/json" }
      });

      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("retry-after") || 2);
        options.log?.(`[stubhub] Rate limited; retrying page ${page} after ${retryAfter}s`);
        await sleep(Math.min(Math.max(retryAfter, 1), 15) * 1000);
        page -= 1;
        continue;
      }

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`StubHub events request failed ${response.status}: ${body.slice(0, 180)}`);
      }

      const payload = await response.json();
      const pageEvents = extractEvents(payload);
      events.push(...pageEvents);
      options.log?.(`[stubhub] Received ${pageEvents.length} event(s) for page ${page}`);
      if (!hasMorePages(payload, page, pageEvents.length)) break;
      await sleep(350);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message);
      options.log?.(`[stubhub] Error for page ${page}: ${message}`);
      break;
    }
  }

  return { events, fetchedCount: events.length, skippedCount: 0, errors, disabled: false };
}
