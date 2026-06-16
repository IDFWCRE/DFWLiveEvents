import type { TicketmasterEvent } from "./client";

export type NormalizedTicketmasterEvent = {
  slug: string;
  title: string;
  description: string | null;
  category: "music" | "comedy";
  eventDate: string;
  eventTime: string | null;
  imageUrl: string | null;
  externalEventId: string;
  venue: {
    slug: string;
    name: string;
    city: string;
    state: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
  };
  performers: Array<{
    slug: string;
    name: string;
    category: "music" | "comedy";
    imageUrl: string | null;
    websiteUrl: string | null;
  }>;
  sourceName: "Ticketmaster";
  sourceUrl: string;
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

function parseCategory(event: TicketmasterEvent): "music" | "comedy" | null {
  const labels = (event.classifications || [])
    .flatMap((classification) => [
      classification.segment?.name,
      classification.genre?.name,
      classification.subGenre?.name
    ])
    .filter(Boolean)
    .map((label) => String(label).toLowerCase());

  if (labels.some((label) => label.includes("comedy"))) return "comedy";
  if (labels.some((label) => label.includes("music"))) return "music";
  return null;
}

function parseCoordinate(value?: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeTicketmasterEvent(event: TicketmasterEvent): NormalizedTicketmasterEvent | null {
  const externalEventId = event.id;
  const title = event.name?.trim();
  const venue = event._embedded?.venues?.[0];
  const venueName = venue?.name?.trim();
  const city = venue?.city?.name?.trim();
  const state = venue?.state?.stateCode?.trim() || "TX";
  const eventDate = event.dates?.start?.localDate;
  const category = parseCategory(event);
  const sourceUrl = event.url;

  if (!externalEventId || !title || !venueName || !city || !eventDate || !category || !sourceUrl) {
    return null;
  }

  const address = [venue?.address?.line1, venue?.address?.line2].filter(Boolean).join(", ") || `${city}, ${state}`;
  const eventSlug = slugify(`${title}-${city}-${eventDate}-${externalEventId}`);

  return {
    slug: eventSlug,
    title,
    description: event.info || event.pleaseNote || null,
    category,
    eventDate,
    eventTime: event.dates?.start?.localTime || null,
    imageUrl: bestImage(event.images),
    externalEventId,
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
    sourceName: "Ticketmaster",
    sourceUrl
  };
}
