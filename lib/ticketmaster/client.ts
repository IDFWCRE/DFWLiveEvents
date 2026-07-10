import { getImportWindow } from "@/lib/import/window";

export const ticketmasterCities = [
  "Dallas",
  "Fort Worth",
  "Arlington",
  "Denton",
  "Irving",
  "Grand Prairie",
  "Plano",
  "Frisco",
  "McKinney"
] as const;

const classifications = ["music", "comedy"] as const;
const discoveryUrl = "https://app.ticketmaster.com/discovery/v2/events.json";
const allowedTicketmasterSources = ["ticketmaster", "tmr", "universe", "frontgate"] as const;

export type TicketmasterCategory = (typeof classifications)[number];
export type TicketmasterSource = (typeof allowedTicketmasterSources)[number];

export type TicketmasterEvent = {
  id?: string;
  name?: string;
  url?: string;
  info?: string;
  pleaseNote?: string;
  source?: { name?: string; id?: string } | string;
  promoter?: { id?: string; name?: string; description?: string };
  promoters?: Array<{ id?: string; name?: string; description?: string }>;
  images?: Array<{
    url?: string;
    width?: number;
    height?: number;
    ratio?: string;
  }>;
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
      dateTime?: string;
    };
    status?: {
      code?: string;
    };
  };
  classifications?: Array<{
    segment?: { name?: string };
    genre?: { name?: string };
    subGenre?: { name?: string };
  }>;
  _embedded?: {
    venues?: Array<{
      name?: string;
      url?: string;
      city?: { name?: string };
      state?: { name?: string; stateCode?: string };
      address?: { line1?: string; line2?: string };
      location?: { latitude?: string; longitude?: string };
    }>;
    attractions?: Array<{
      id?: string;
      name?: string;
      url?: string;
      images?: Array<{ url?: string; width?: number; height?: number; ratio?: string }>;
    }>;
  };
};

type DiscoveryResponse = {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
  page?: {
    totalPages?: number;
    number?: number;
  };
};

export type TicketmasterFetchSummary = {
  events: TicketmasterEvent[];
  errors: string[];
  fetchedCount: number;
};

export type TicketmasterFetchOptions = {
  log?: (message: string) => void;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTicketmasterKey() {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    throw new Error("Missing TICKETMASTER_API_KEY.");
  }
  return apiKey;
}

function getMaxPagesPerQuery() {
  const configured = Number(process.env.TICKETMASTER_MAX_PAGES_PER_QUERY || 3);
  if (!Number.isFinite(configured) || configured < 1) return 3;
  return Math.min(Math.floor(configured), 5);
}

function getRequestTimeoutMs() {
  const configured = Number(process.env.TICKETMASTER_REQUEST_TIMEOUT_MS || 15000);
  if (!Number.isFinite(configured) || configured < 1000) return 15000;
  return Math.floor(configured);
}

function getConfiguredSources(options: TicketmasterFetchOptions) {
  const rawSources = (process.env.TICKETMASTER_SOURCES || "")
    .split(",")
    .map((source) => source.trim().toLowerCase())
    .filter(Boolean);

  if (!rawSources.length) return [null];

  const validSources = rawSources.filter((source): source is TicketmasterSource =>
    (allowedTicketmasterSources as readonly string[]).includes(source)
  );
  const invalidSources = rawSources.filter((source) => !(allowedTicketmasterSources as readonly string[]).includes(source));

  if (invalidSources.length) {
    options.log?.(`[ticketmaster] Ignoring unsupported TICKETMASTER_SOURCES value(s): ${invalidSources.join(", ")}`);
  }

  return validSources.length ? [...new Set(validSources)] : [null];
}

async function fetchWithTimeout(url: URL, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Ticketmaster request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchDiscoveryPage(
  city: string,
  classificationName: TicketmasterCategory,
  sourceName: TicketmasterSource | null,
  page: number,
  options: TicketmasterFetchOptions = {}
) {
  const url = new URL(discoveryUrl);
  const importWindow = getImportWindow();
  url.searchParams.set("apikey", getTicketmasterKey());
  url.searchParams.set("city", city);
  url.searchParams.set("stateCode", "TX");
  url.searchParams.set("countryCode", "US");
  url.searchParams.set("classificationName", classificationName);
  url.searchParams.set("startDateTime", importWindow.startIso);
  url.searchParams.set("endDateTime", importWindow.endIso);
  url.searchParams.set("size", "100");
  url.searchParams.set("page", String(page));
  url.searchParams.set("sort", "date,asc");
  if (sourceName) {
    url.searchParams.set("source", sourceName);
  }

  const timeoutMs = getRequestTimeoutMs();
  const sourceLabel = sourceName || "all-sources";
  options.log?.(`[ticketmaster] Requesting ${city} / ${classificationName} / ${sourceLabel} / page ${page}`);
  const response = await fetchWithTimeout(url, timeoutMs);

  if (response.status === 429) {
    options.log?.(`[ticketmaster] Rate limited for ${city} / ${classificationName} / ${sourceLabel} / page ${page}; retrying once`);
    await sleep(1200);
    const retry = await fetchWithTimeout(url, timeoutMs);
    if (!retry.ok) {
      throw new Error(`Ticketmaster retry failed for ${city}/${classificationName}/${sourceLabel}/page ${page}: ${retry.status}`);
    }
    const retryJson = (await retry.json()) as DiscoveryResponse;
    options.log?.(
      `[ticketmaster] Received ${retryJson._embedded?.events?.length || 0} events for ${city} / ${classificationName} / ${sourceLabel} / page ${page}`
    );
    return retryJson;
  }

  if (!response.ok) {
    throw new Error(`Ticketmaster request failed for ${city}/${classificationName}/${sourceLabel}/page ${page}: ${response.status}`);
  }

  const json = (await response.json()) as DiscoveryResponse;
  options.log?.(
    `[ticketmaster] Received ${json._embedded?.events?.length || 0} events for ${city} / ${classificationName} / ${sourceLabel} / page ${page}`
  );
  return json;
}

export async function fetchTicketmasterEvents(options: TicketmasterFetchOptions = {}): Promise<TicketmasterFetchSummary> {
  const events: TicketmasterEvent[] = [];
  const errors: string[] = [];
  const maxPagesPerQuery = getMaxPagesPerQuery();
  const importWindow = getImportWindow();
  const sourceNames = getConfiguredSources(options);
  options.log?.(
    `[ticketmaster] Starting fetch for ${importWindow.label} (${importWindow.startIso} to ${importWindow.endIso}) with max ${maxPagesPerQuery} page(s) per city/category/source; sources=${sourceNames.map((source) => source || "all-sources").join(",")}`
  );

  for (const city of ticketmasterCities) {
    for (const classificationName of classifications) {
      for (const sourceName of sourceNames) {
        const sourceLabel = sourceName || "all-sources";
        try {
          options.log?.(`[ticketmaster] Starting ${city} / ${classificationName} / ${sourceLabel}`);
          const firstPage = await fetchDiscoveryPage(city, classificationName, sourceName, 0, options);
          events.push(...(firstPage._embedded?.events || []));

          const totalPages = Math.min(firstPage.page?.totalPages || 1, maxPagesPerQuery);
          options.log?.(`[ticketmaster] ${city} / ${classificationName} / ${sourceLabel}: fetching ${totalPages} page(s)`);

          for (let page = 1; page < totalPages; page += 1) {
            await sleep(275);
            const nextPage = await fetchDiscoveryPage(city, classificationName, sourceName, page, options);
            events.push(...(nextPage._embedded?.events || []));
          }

          options.log?.(`[ticketmaster] Finished ${city} / ${classificationName} / ${sourceLabel}`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          errors.push(message);
          options.log?.(`[ticketmaster] Error for ${city} / ${classificationName} / ${sourceLabel}: ${message}`);
        }

        await sleep(275);
      }
    }
  }

  return {
    events,
    errors,
    fetchedCount: events.length
  };
}
