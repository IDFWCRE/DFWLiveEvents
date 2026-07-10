import { mapImportTaxonomy } from "@/lib/import/taxonomy-map";
import type { NormalizedProviderEvent } from "@/lib/import/providers";
import { slugify } from "@/lib/ticketmaster/normalize";
import type { StubHubEvent } from "./client";

const allowedCities = new Set([
  "Dallas",
  "Fort Worth",
  "Arlington",
  "Denton",
  "Irving",
  "Grand Prairie",
  "Plano",
  "Frisco",
  "McKinney"
]);

export type NormalizedStubHubEvent = NormalizedProviderEvent & {
  sourceName: "StubHub";
  externalEventId: string;
};

export type StubHubNormalizeResult =
  | { event: NormalizedStubHubEvent; skipped: false }
  | { event: null; skipped: true; reason: string };

function firstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function nestedRecord(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  }
  return {};
}

function parseDateTime(value: string | null) {
  if (!value) return { eventDate: null, eventTime: null };
  const normalized = value.includes("T") ? value : `${value}T00:00:00`;
  const [date, timeWithZone] = normalized.split("T");
  return {
    eventDate: date || null,
    eventTime: timeWithZone?.slice(0, 8) || null
  };
}

function parseCoordinate(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function labels(event: Record<string, unknown>) {
  const category = nestedRecord(event, ["category"]);
  const genre = nestedRecord(event, ["genre"]);
  return [
    firstString(event, ["category", "categoryName", "type"]),
    firstString(category, ["name", "displayName"]),
    firstString(genre, ["name", "displayName"]),
    firstString(event, ["genre", "genreName"])
  ].filter((value): value is string => Boolean(value));
}

function bestImage(event: Record<string, unknown>) {
  const direct = firstString(event, ["imageUrl", "image_url", "image", "logoUrl"]);
  if (direct) return direct;
  const images = event.images;
  if (!Array.isArray(images)) return null;
  const imageRecord = images.find((image) => image && typeof image === "object") as Record<string, unknown> | undefined;
  return imageRecord ? firstString(imageRecord, ["url", "imageUrl"]) : null;
}

export function normalizeStubHubEvent(event: StubHubEvent): StubHubNormalizeResult {
  const record = event as Record<string, unknown>;
  const venue = nestedRecord(record, ["venue", "venueInfo", "location"]);
  const address = nestedRecord(venue, ["address"]);
  const sourceEventId = firstString(record, ["id", "eventId", "event_id"]);
  const title = firstString(record, ["name", "title", "eventName"]);
  const sourceUrl = firstString(record, ["url", "webUrl", "web_url", "eventUrl", "ticketUrl"]);
  const startValue = firstString(record, ["startDate", "start_date", "date", "eventDate", "startDateTime"]);
  const { eventDate, eventTime } = parseDateTime(startValue);
  const venueName = firstString(venue, ["name", "venueName", "title"]);
  const city = firstString(venue, ["city", "venueCity"]) || firstString(address, ["city"]);
  const state = firstString(venue, ["state", "region", "stateCode"]) || firstString(address, ["state", "region", "stateCode"]) || "TX";
  const taxonomy = mapImportTaxonomy(labels(record), [title, firstString(record, ["description", "summary"])]);

  if (!sourceEventId) return { event: null, skipped: true, reason: "missing external event id" };
  if (!title) return { event: null, skipped: true, reason: `missing title for ${sourceEventId}` };
  if (!sourceUrl) return { event: null, skipped: true, reason: `missing source URL for ${title}` };
  if (!taxonomy) return { event: null, skipped: true, reason: `unsupported category for ${title}` };
  if (!eventDate) return { event: null, skipped: true, reason: `missing event date for ${title}` };
  if (!venueName || !city) return { event: null, skipped: true, reason: `missing venue/city for ${title}` };
  if (!allowedCities.has(city)) return { event: null, skipped: true, reason: `outside supported city list: ${city}` };

  const description = firstString(record, ["description", "summary"]);
  const addressLine =
    firstString(address, ["localizedAddress", "localized_address_display", "line1", "address1"]) ||
    firstString(venue, ["address", "address1"]) ||
    `${city}, ${state}`;
  const category = taxonomy.categorySlug;

  return {
    skipped: false,
    event: {
      slug: slugify(`${title}-${city}-${eventDate}-${sourceEventId}`),
      title,
      description,
      category,
      categorySlug: taxonomy.categorySlug,
      subcategorySlug: taxonomy.subcategorySlug,
      eventDate,
      eventTime,
      imageUrl: bestImage(record),
      externalEventId: sourceEventId,
      sourceProvider: "stubhub",
      sourceEventId,
      sourceName: "StubHub",
      sourceUrl,
      ticketUrl: sourceUrl,
      sourceUpdatedAt: firstString(record, ["updatedAt", "updated_at", "lastModifiedDate", "last_modified"]) || null,
      rawPayload: event,
      venue: {
        slug: slugify(`${venueName}-${city}`),
        name: venueName,
        city,
        state,
        address: addressLine,
        latitude: parseCoordinate(venue.latitude ?? address.latitude),
        longitude: parseCoordinate(venue.longitude ?? address.longitude)
      },
      performers: [
        {
          slug: slugify(title),
          name: title,
          category,
          imageUrl: null,
          websiteUrl: sourceUrl
        }
      ]
    }
  };
}
