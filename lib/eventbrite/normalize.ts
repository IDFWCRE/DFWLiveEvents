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

const comedyTerms = ["comedy", "comedian", "stand-up", "standup", "open mic"];
const musicTerms = ["live music", "concert", "band", "dj", "singer", "songwriter"];

export type NormalizedEventbriteEvent = {
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
  sourceName: "Eventbrite";
  sourceUrl: string;
};

export type EventbriteNormalizeResult =
  | { event: NormalizedEventbriteEvent; skipped: false }
  | { event: null; skipped: true; reason: string };

function stripHtml(value?: string) {
  return value?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || null;
}

function parseCategory(event: EventbriteEvent): "music" | "comedy" | null {
  const labels = [event.category?.name, event.category?.short_name, event.subcategory?.name, event.subcategory?.short_name]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  if (labels.some((label) => label.includes("comedy"))) return "comedy";
  if (labels.some((label) => label.includes("music"))) return "music";

  const text = [event.name?.text, event.description?.text, stripHtml(event.description?.html)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (comedyTerms.some((term) => text.includes(term))) return "comedy";
  if (musicTerms.some((term) => text.includes(term))) return "music";

  return null;
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
  const category = parseCategory(event);
  const venue = event.venue;
  const city = venue?.address?.city?.trim();
  const state = venue?.address?.region?.trim() || "TX";
  const { eventDate, eventTime } = parseEventDateTime(event.start?.local);

  if (!externalEventId) return { event: null, skipped: true, reason: "missing external event id" };
  if (!title) return { event: null, skipped: true, reason: `missing title for ${externalEventId}` };
  if (!sourceUrl) return { event: null, skipped: true, reason: `missing source URL for ${title}` };
  if (!category) return { event: null, skipped: true, reason: `unsupported category for ${title}` };
  if (!venue?.name || !city) return { event: null, skipped: true, reason: `missing venue/city for ${title}` };
  if (!allowedCities.has(city)) return { event: null, skipped: true, reason: `outside supported city list: ${city}` };
  if (!eventDate) return { event: null, skipped: true, reason: `missing event date for ${title}` };

  const description = event.description?.text || stripHtml(event.description?.html);
  const address = venue.address?.localized_address_display || venue.address?.address_1 || `${city}, ${state}`;
  const performerName = event.organizer?.name || title;

  return {
    skipped: false,
    event: {
      slug: slugify(`${title}-${city}-${eventDate}-${externalEventId}`),
      title,
      description,
      category,
      eventDate,
      eventTime,
      imageUrl: event.logo?.original?.url || event.logo?.url || null,
      externalEventId,
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
      sourceName: "Eventbrite",
      sourceUrl
    }
  };
}
