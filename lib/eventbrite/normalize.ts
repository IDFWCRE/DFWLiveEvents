import type { NormalizedProviderEvent } from "@/lib/import/providers";
import { mapImportTaxonomy } from "@/lib/import/taxonomy-map";
import { slugify } from "@/lib/ticketmaster/normalize";
import type { EventbriteEvent } from "./client";

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

export type NormalizedEventbriteEvent = NormalizedProviderEvent & {
  sourceName: "Eventbrite";
  externalEventId: string;
};

export type EventbriteNormalizeResult =
  | { event: NormalizedEventbriteEvent; skipped: false }
  | { event: null; skipped: true; reason: string };

function stripHtml(value?: string) {
  return value?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || null;
}

function categoryLabels(event: EventbriteEvent) {
  return [event.category?.name, event.category?.short_name, event.subcategory?.name, event.subcategory?.short_name]
    .filter((value): value is string => Boolean(value));
}

function parseEventDateTime(local?: string) {
  if (!local) return { eventDate: null, eventTime: null };
  const [eventDate, timeWithRest] = local.split("T");
  return {
    eventDate: eventDate || null,
    eventTime: timeWithRest?.slice(0, 8) || null
  };
}

function parseCoordinate(value?: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeEventbriteEvent(event: EventbriteEvent): EventbriteNormalizeResult {
  const externalEventId = event.id;
  const title = event.name?.text?.trim();
  const sourceUrl = event.url;
  const description = event.description?.text || stripHtml(event.description?.html);
  const taxonomy = mapImportTaxonomy(categoryLabels(event), [title, description, stripHtml(event.description?.html)]);
  const venue = event.venue;
  const city = venue?.address?.city?.trim();
  const state = venue?.address?.region?.trim() || "TX";
  const { eventDate, eventTime } = parseEventDateTime(event.start?.local);

  if (!externalEventId) return { event: null, skipped: true, reason: "missing external event id" };
  if (!title) return { event: null, skipped: true, reason: `missing title for ${externalEventId}` };
  if (!sourceUrl) return { event: null, skipped: true, reason: `missing source URL for ${title}` };
  if (!taxonomy) return { event: null, skipped: true, reason: `unsupported category for ${title}` };
  if (!venue?.name || !city) return { event: null, skipped: true, reason: `missing venue/city for ${title}` };
  if (!allowedCities.has(city)) return { event: null, skipped: true, reason: `outside supported city list: ${city}` };
  if (!eventDate) return { event: null, skipped: true, reason: `missing event date for ${title}` };

  const address = venue.address?.localized_address_display || venue.address?.address_1 || `${city}, ${state}`;
  const performerName = event.organizer?.name || title;
  const category = taxonomy.categorySlug;

  return {
    skipped: false,
    event: {
      slug: slugify(`${title}-${city}-${eventDate}-${externalEventId}`),
      title,
      description,
      category,
      categorySlug: taxonomy.categorySlug,
      subcategorySlug: taxonomy.subcategorySlug,
      eventDate,
      eventTime,
      imageUrl: event.logo?.original?.url || event.logo?.url || null,
      externalEventId,
      sourceProvider: "eventbrite",
      sourceEventId: externalEventId,
      sourceUrl,
      ticketUrl: sourceUrl,
      sourceUpdatedAt: event.changed || event.published || null,
      rawPayload: event,
      venue: {
        slug: slugify(`${venue.name}-${city}`),
        name: venue.name,
        city,
        state,
        address,
        latitude: parseCoordinate(venue.address?.latitude),
        longitude: parseCoordinate(venue.address?.longitude)
      },
      performers: [
        {
          slug: slugify(performerName),
          name: performerName,
          category,
          imageUrl: null,
          websiteUrl: event.organizer?.url || null
        }
      ],
      sourceName: "Eventbrite"
    }
  };
}
