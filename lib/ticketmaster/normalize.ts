import type { NormalizedProviderEvent } from "@/lib/import/providers";
import { mapImportTaxonomy } from "@/lib/import/taxonomy-map";
import type { TicketmasterEvent } from "./client";

export type NormalizedTicketmasterEvent = NormalizedProviderEvent & {
  sourceName: "Ticketmaster";
  externalEventId: string;
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function bestImage(images: TicketmasterEvent["images"]) {
  if (!images?.length) return null;
  const pool = images.filter((image) => image.url);
  const landscape = pool.filter((image) => image.ratio === "16_9");
  const candidates = landscape.length ? landscape : pool;
  return [...candidates].sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || null;
}

function classificationLabels(event: TicketmasterEvent) {
  return (event.classifications || [])
    .flatMap((classification) => [
      classification.segment?.name,
      classification.genre?.name,
      classification.subGenre?.name
    ])
    .filter((label): label is string => Boolean(label));
}

function parseCoordinate(value?: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getTicketmasterSourceName(event: TicketmasterEvent) {
  if (typeof event.source === "string") return event.source.toLowerCase();
  return event.source?.name?.toLowerCase() || "unknown";
}

export function getTicketmasterPromoterNames(event: TicketmasterEvent) {
  return [event.promoter, ...(event.promoters || [])]
    .map((promoter) => promoter?.name?.trim())
    .filter((name): name is string => Boolean(name));
}

export function isLikelyLiveNationPromoted(event: TicketmasterEvent) {
  return getTicketmasterPromoterNames(event).some((name) => name.toLowerCase().includes("live nation"));
}

export function normalizeTicketmasterEvent(event: TicketmasterEvent): NormalizedTicketmasterEvent | null {
  const externalEventId = event.id;
  const title = event.name?.trim();
  const venue = event._embedded?.venues?.[0];
  const venueName = venue?.name?.trim();
  const city = venue?.city?.name?.trim();
  const state = venue?.state?.stateCode?.trim() || "TX";
  const eventDate = event.dates?.start?.localDate;
  const taxonomy = mapImportTaxonomy(classificationLabels(event), [title, event.info, event.pleaseNote]);
  const sourceUrl = event.url;

  if (!externalEventId || !title || !venueName || !city || !eventDate || !taxonomy || !sourceUrl) {
    return null;
  }

  const address = [venue?.address?.line1, venue?.address?.line2].filter(Boolean).join(", ") || `${city}, ${state}`;
  const eventSlug = slugify(`${title}-${city}-${eventDate}-${externalEventId}`);
  const category = taxonomy.categorySlug;
  const promoterNames = getTicketmasterPromoterNames(event);

  return {
    slug: eventSlug,
    title,
    description: event.info || event.pleaseNote || null,
    category,
    categorySlug: taxonomy.categorySlug,
    subcategorySlug: taxonomy.subcategorySlug,
    eventDate,
    eventTime: event.dates?.start?.localTime || null,
    imageUrl: bestImage(event.images),
    externalEventId,
    sourceProvider: "ticketmaster",
    sourceEventId: externalEventId,
    sourceUrl,
    ticketUrl: sourceUrl,
    sourceUpdatedAt: null,
    rawPayload: {
      ...event,
      dfw_live_events: {
        ticketmaster_source: getTicketmasterSourceName(event),
        promoter_names: promoterNames,
        likely_live_nation_promoted: isLikelyLiveNationPromoted(event)
      }
    },
    venue: {
      slug: slugify(`${venueName}-${city}`),
      name: venueName,
      city,
      state,
      address,
      latitude: parseCoordinate(venue?.location?.latitude),
      longitude: parseCoordinate(venue?.location?.longitude)
    },
    performers: (event._embedded?.attractions || [])
      .filter((attraction) => attraction.name)
      .map((attraction) => ({
        slug: slugify(String(attraction.name)),
        name: String(attraction.name),
        category,
        imageUrl: bestImage(attraction.images),
        websiteUrl: attraction.url || null
      })),
    sourceName: "Ticketmaster"
  };
}
