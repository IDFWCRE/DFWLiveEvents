const eventbriteBaseUrl = "https://www.eventbriteapi.com/v3";

export type EventbriteFetchOptions = {
  log?: (message: string) => void;
};

export type EventbriteEvent = {
  id?: string;
  name?: { text?: string; html?: string };
  description?: { text?: string; html?: string };
  url?: string;
  start?: { local?: string; timezone?: string; utc?: string };
  logo?: { url?: string; original?: { url?: string } };
  category?: { name?: string; short_name?: string };
  subcategory?: { name?: string; short_name?: string };
  venue?: {
    id?: string;
    name?: string;
    address?: {
      address_1?: string;
      address_2?: string;
      city?: string;
      region?: string;
      country?: string;
      localized_address_display?: string;
      latitude?: string;
      longitude?: string;
    };
  };
  organizer?: {
    id?: string;
    name?: string;
    url?: string;
  };
};

type EventbriteCollectionResponse = {
  events?: EventbriteEvent[];
  pagination?: {
    page_number?: number;
    page_count?: number;
    has_more_items?: boolean;
  };
};

export type EventbriteFetchSummary = {
  events: EventbriteEvent[];
  fetchedCount: number;
  skippedCount: number;
  errors: string[];
};

function getEventbriteToken() {
  const token = process.env.EVENTBRITE_PRIVATE_TOKEN;
  if (!token) {
    throw new Error("Missing EVENTBRITE_PRIVATE_TOKEN.");
  }
  return token;
}

function getRequestTimeoutMs() {
  const configured = Number(process.env.EVENTBRITE_REQUEST_TIMEOUT_MS || 15000);
  if (!Number.isFinite(configured) || configured < 1000) return 15000;
  return Math.floor(configured);
}

function getMaxPagesPerQuery() {
  const configured = Number(process.env.EVENTBRITE_MAX_PAGES_PER_QUERY || 3);
  if (!Number.isFinite(configured) || configured < 1) return 3;
  return Math.min(Math.floor(configured), 10);
}

function splitEnvList(name: string) {
  return (process.env[name] || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function extractEventbriteEventId(value: string) {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const urlMatch = trimmed.match(/(?:tickets-|\/e\/[^/]*-)(\d{6,})(?:[/?#]|$)/i);
  if (urlMatch?.[1]) return urlMatch[1];
  const fallback = trimmed.match(/(\d{8,})/);
  return fallback?.[1] || null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function eventbriteFetch<T>(path: string, options: EventbriteFetchOptions = {}) {
  const url = new URL(`${eventbriteBaseUrl}${path}`);
  const timeoutMs = getRequestTimeoutMs();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  options.log?.(`[eventbrite] GET ${url.pathname}${url.search}`);

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${getEventbriteToken()}`
      },
      signal: controller.signal
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Eventbrite request failed ${response.status} for ${url.pathname}: ${body.slice(0, 180)}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Eventbrite request timed out after ${timeoutMs}ms for ${url.pathname}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function withExpand(path: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}expand=venue,organizer,category,subcategory,ticket_availability,ticket_classes`;
}

async function fetchEventById(eventId: string, options: EventbriteFetchOptions) {
  options.log?.(`[eventbrite] Fetching event ID ${eventId}`);
  return eventbriteFetch<EventbriteEvent>(withExpand(`/events/${eventId}/`), options);
}

async function fetchEventCollection(path: string, label: string, options: EventbriteFetchOptions) {
  const events: EventbriteEvent[] = [];
  const errors: string[] = [];
  const maxPages = getMaxPagesPerQuery();

  for (let page = 1; page <= maxPages; page += 1) {
    try {
      options.log?.(`[eventbrite] Fetching ${label} page ${page}`);
      const separator = path.includes("?") ? "&" : "?";
      const response = await eventbriteFetch<EventbriteCollectionResponse>(
        withExpand(`${path}${separator}page=${page}&status=live&order_by=start_asc`),
        options
      );
      const pageEvents = response.events || [];
      events.push(...pageEvents);
      options.log?.(`[eventbrite] Received ${pageEvents.length} event(s) for ${label} page ${page}`);

      if (!response.pagination?.has_more_items || page >= (response.pagination.page_count || 1)) {
        break;
      }

      await sleep(275);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message);
      options.log?.(`[eventbrite] Error for ${label} page ${page}: ${message}`);
      break;
    }
  }

  return { events, errors };
}

export async function fetchEventbriteEvents(options: EventbriteFetchOptions = {}): Promise<EventbriteFetchSummary> {
  const events: EventbriteEvent[] = [];
  const errors: string[] = [];
  let skippedCount = 0;

  const organizationIds = splitEnvList("EVENTBRITE_ORGANIZATION_IDS");
  const venueIds = splitEnvList("EVENTBRITE_VENUE_IDS");
  const eventIds = splitEnvList("EVENTBRITE_EVENT_IDS")
    .map(extractEventbriteEventId)
    .filter((eventId): eventId is string => Boolean(eventId));

  if (!organizationIds.length && !venueIds.length && !eventIds.length) {
    errors.push("No Eventbrite IDs configured. Add at least one organization, venue, or event ID.");
    return { events, fetchedCount: 0, skippedCount, errors };
  }

  for (const organizationId of organizationIds) {
    const result = await fetchEventCollection(
      `/organizations/${organizationId}/events/`,
      `organization ${organizationId}`,
      options
    );
    events.push(...result.events);
    errors.push(...result.errors);
    await sleep(275);
  }

  for (const venueId of venueIds) {
    const result = await fetchEventCollection(`/venues/${venueId}/events/`, `venue ${venueId}`, options);
    events.push(...result.events);
    errors.push(...result.errors);
    await sleep(275);
  }

  for (const eventId of eventIds) {
    try {
      events.push(await fetchEventById(eventId, options));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message);
      options.log?.(`[eventbrite] Error for event ${eventId}: ${message}`);
    }
    await sleep(275);
  }

  const configuredEventIds = splitEnvList("EVENTBRITE_EVENT_IDS");
  skippedCount += configuredEventIds.length - eventIds.length;

  return {
    events,
    fetchedCount: events.length,
    skippedCount,
    errors
  };
}
