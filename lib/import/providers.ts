import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ImportableEventCategorySlug } from "@/lib/import/taxonomy-map";
import type { EventSubcategorySlug } from "@/lib/taxonomy";

export type EventSourceProvider = "manual" | "ticketmaster" | "eventbrite" | "stubhub";

export type NormalizedProviderEvent = {
  slug: string;
  title: string;
  description: string | null;
  category: "music" | "comedy";
  categorySlug: ImportableEventCategorySlug;
  subcategorySlug: EventSubcategorySlug | null;
  eventDate: string;
  eventTime: string | null;
  imageUrl: string | null;
  sourceProvider: EventSourceProvider;
  sourceName: string;
  sourceEventId: string;
  sourceUrl: string;
  ticketUrl: string;
  sourceUpdatedAt: string | null;
  rawPayload: unknown;
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
};

export type ProviderImportSummary = {
  fetchedCount: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: string[];
};

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;

type ExistingEventRow = {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  venues: { name: string; city: string } | Array<{ name: string; city: string }> | null;
};

function normalizeMatchValue(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function eventTimeHour(value: string | null) {
  return value?.slice(0, 2) || null;
}

function isStrongMatch(candidate: ExistingEventRow, event: NormalizedProviderEvent) {
  const venue = Array.isArray(candidate.venues) ? candidate.venues[0] : candidate.venues;
  if (!venue) return false;
  if (candidate.event_date !== event.eventDate) return false;
  if (eventTimeHour(candidate.event_time) && eventTimeHour(event.eventTime) && eventTimeHour(candidate.event_time) !== eventTimeHour(event.eventTime)) {
    return false;
  }

  return (
    normalizeMatchValue(candidate.title) === normalizeMatchValue(event.title) &&
    normalizeMatchValue(venue.name) === normalizeMatchValue(event.venue.name) &&
    normalizeMatchValue(venue.city) === normalizeMatchValue(event.venue.city)
  );
}

async function ensureTicketSource(supabase: SupabaseAdmin, event: NormalizedProviderEvent) {
  const websiteUrl =
    event.sourceProvider === "ticketmaster"
      ? "https://www.ticketmaster.com"
      : event.sourceProvider === "eventbrite"
        ? "https://www.eventbrite.com"
        : event.sourceProvider === "stubhub"
          ? "https://www.stubhub.com"
          : null;

  const { error } = await supabase.from("ticket_sources").upsert(
    {
      slug: event.sourceProvider,
      name: event.sourceName,
      website_url: websiteUrl,
      affiliate_base_url: null,
      active: true
    },
    { onConflict: "slug" }
  );

  if (error) {
    throw new Error(`Unable to upsert ${event.sourceName} source: ${error.message}`);
  }
}

async function upsertVenue(supabase: SupabaseAdmin, event: NormalizedProviderEvent) {
  const { data, error } = await supabase
    .from("venues")
    .upsert(
      {
        slug: event.venue.slug,
        name: event.venue.name,
        city: event.venue.city,
        state: event.venue.state,
        address: event.venue.address,
        latitude: event.venue.latitude,
        longitude: event.venue.longitude
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(`Unable to upsert venue "${event.venue.name}": ${error.message}`);
  }

  return String(data.id);
}

async function upsertPerformers(supabase: SupabaseAdmin, event: NormalizedProviderEvent) {
  const performerIds: string[] = [];

  for (const performer of event.performers) {
    const { data, error } = await supabase
      .from("performers")
      .upsert(
        {
          slug: performer.slug,
          name: performer.name,
          category: performer.category,
          image_url: performer.imageUrl,
          website_url: performer.websiteUrl
        },
        { onConflict: "slug" }
      )
      .select("id")
      .single();

    if (error) {
      throw new Error(`Unable to upsert performer "${performer.name}": ${error.message}`);
    }

    performerIds.push(String(data.id));
  }

  return performerIds;
}

async function getExistingSourceIds(supabase: SupabaseAdmin, sourceProvider: EventSourceProvider, sourceEventIds: string[]) {
  if (!sourceEventIds.length) return new Set<string>();

  const { data, error } = await supabase
    .from("events")
    .select("source_event_id, external_event_id")
    .or(`source_provider.eq.${sourceProvider},external_source.eq.${sourceProvider},external_source.eq.${sourceProvider === "ticketmaster" ? "Ticketmaster" : sourceProvider}`)
    .in("source_event_id", sourceEventIds);

  if (error) {
    const legacy = await supabase
      .from("events")
      .select("external_event_id")
      .or(`external_source.eq.${sourceProvider},external_source.eq.${sourceProvider === "ticketmaster" ? "Ticketmaster" : sourceProvider}`)
      .in("external_event_id", sourceEventIds);
    if (legacy.error) throw new Error(`Unable to check existing ${sourceProvider} events: ${legacy.error.message}`);
    return new Set(((legacy.data || []) as Array<{ external_event_id: string | null }>).map((row) => row.external_event_id).filter(Boolean));
  }

  return new Set(
    ((data || []) as Array<{ source_event_id: string | null; external_event_id: string | null }>)
      .flatMap((row) => [row.source_event_id, row.external_event_id])
      .filter((value): value is string => Boolean(value))
  );
}

async function findEventBySource(supabase: SupabaseAdmin, event: NormalizedProviderEvent) {
  const { data, error } = await supabase
    .from("events")
    .select("id")
    .eq("source_provider", event.sourceProvider)
    .eq("source_event_id", event.sourceEventId)
    .maybeSingle();

  if (!error && data?.id) return String(data.id);

  const legacy = await supabase
    .from("events")
    .select("id")
    .or(`external_source.eq.${event.sourceProvider},external_source.eq.${event.sourceProvider === "ticketmaster" ? "Ticketmaster" : event.sourceProvider}`)
    .eq("external_event_id", event.sourceEventId)
    .maybeSingle();

  if (legacy.error) throw new Error(`Unable to find existing source event: ${legacy.error.message}`);
  return legacy.data?.id ? String(legacy.data.id) : null;
}

async function findStrongMatchedEvent(supabase: SupabaseAdmin, event: NormalizedProviderEvent) {
  const { data, error } = await supabase
    .from("events")
    .select("id,title,event_date,event_time,venues(name,city)")
    .eq("event_date", event.eventDate)
    .limit(50);

  if (error) {
    throw new Error(`Unable to check duplicate candidates for "${event.title}": ${error.message}`);
  }

  return ((data || []) as ExistingEventRow[]).find((candidate) => isStrongMatch(candidate, event))?.id || null;
}

async function upsertEventRow(supabase: SupabaseAdmin, event: NormalizedProviderEvent, venueId: string) {
  const existingId = await findEventBySource(supabase, event);
  const payload = {
    slug: event.slug,
    title: event.title,
    description: event.description,
    category: event.category,
    category_slug: event.categorySlug,
    subcategory_slug: event.subcategorySlug,
    event_date: event.eventDate,
    event_time: event.eventTime,
    image_url: event.imageUrl,
    status: "published",
    venue_id: venueId,
    source_type: event.sourceProvider === "manual" ? "manual" : "api",
    external_source: event.sourceProvider,
    external_event_id: event.sourceEventId,
    source_provider: event.sourceProvider,
    source_event_id: event.sourceEventId,
    source_url: event.sourceUrl,
    ticket_url: event.ticketUrl,
    raw_payload: event.rawPayload,
    source_updated_at: event.sourceUpdatedAt,
    last_seen_at: new Date().toISOString(),
    import_status: "active"
  };

  if (existingId) {
    const { data, error } = await supabase.from("events").update(payload).eq("id", existingId).select("id").single();
    if (error) throw new Error(`Unable to update event "${event.title}": ${error.message}`);
    return String(data.id);
  }

  const duplicateId = await findStrongMatchedEvent(supabase, event);
  if (duplicateId) return duplicateId;

  const { data, error } = await supabase.from("events").insert(payload).select("id").single();
  if (error) {
    throw new Error(`Unable to insert event "${event.title}": ${error.message}`);
  }

  return String(data.id);
}

async function upsertEventPerformers(supabase: SupabaseAdmin, eventId: string, performerIds: string[]) {
  if (!performerIds.length) return;

  const rows = performerIds.map((performerId, index) => ({
    event_id: eventId,
    performer_id: performerId,
    billing_order: index + 1
  }));

  const { error } = await supabase.from("event_performers").upsert(rows, {
    onConflict: "event_id,performer_id"
  });

  if (error) {
    throw new Error(`Unable to upsert event performers: ${error.message}`);
  }
}

async function upsertSourceLink(supabase: SupabaseAdmin, eventId: string, event: NormalizedProviderEvent) {
  const payload = {
    event_id: eventId,
    source_provider: event.sourceProvider,
    source_event_id: event.sourceEventId,
    source_url: event.sourceUrl,
    ticket_url: event.ticketUrl,
    raw_payload: event.rawPayload,
    source_updated_at: event.sourceUpdatedAt,
    last_seen_at: new Date().toISOString(),
    import_status: "active"
  };

  const { error } = await supabase.from("event_source_links").upsert(payload, {
    onConflict: "source_provider,source_event_id"
  });

  if (error) {
    throw new Error(`Unable to upsert ${event.sourceName} source link for "${event.title}": ${error.message}`);
  }
}

async function upsertOffer(supabase: SupabaseAdmin, eventId: string, event: NormalizedProviderEvent) {
  const { error } = await supabase.from("event_offers").upsert(
    {
      event_id: eventId,
      source_name: event.sourceName,
      source_listing_url: event.sourceUrl,
      affiliate_url: event.ticketUrl,
      currency: "USD",
      available: true
    },
    { onConflict: "event_id,source_name" }
  );

  if (error) {
    throw new Error(`Unable to upsert ${event.sourceName} offer for "${event.title}": ${error.message}`);
  }
}

export function dedupeNormalizedProviderEvents(events: NormalizedProviderEvent[]) {
  return [...new Map(events.map((event) => [`${event.sourceProvider}:${event.sourceEventId}`, event])).values()];
}

export async function ingestNormalizedProviderEvents(
  sourceProvider: EventSourceProvider,
  events: NormalizedProviderEvent[],
  options: { log?: (message: string) => void; fetchedCount: number; skippedCount?: number; errors?: string[] } = { fetchedCount: events.length }
): Promise<ProviderImportSummary> {
  const supabase = createSupabaseAdminClient();
  const errors = [...(options.errors || [])];
  const normalizedEvents = dedupeNormalizedProviderEvents(events);
  const sourceEvents = normalizedEvents.filter((event) => event.sourceProvider === sourceProvider);
  const existingIds = await getExistingSourceIds(
    supabase,
    sourceProvider,
    sourceEvents.map((event) => event.sourceEventId)
  );

  let insertedCount = 0;
  let updatedCount = 0;

  for (const event of sourceEvents) {
    try {
      options.log?.(`[${sourceProvider}] Upserting event: ${event.title}`);
      const wasExisting = existingIds.has(event.sourceEventId);
      await ensureTicketSource(supabase, event);
      const venueId = await upsertVenue(supabase, event);
      const performerIds = await upsertPerformers(supabase, event);
      const eventId = await upsertEventRow(supabase, event, venueId);
      await upsertEventPerformers(supabase, eventId, performerIds);
      await upsertSourceLink(supabase, eventId, event);
      await upsertOffer(supabase, eventId, event);

      if (wasExisting) updatedCount += 1;
      else insertedCount += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message);
      options.log?.(`[${sourceProvider}] Upsert error for "${event.title}": ${message}`);
    }
  }

  return {
    fetchedCount: options.fetchedCount,
    insertedCount,
    updatedCount,
    skippedCount: (options.skippedCount || 0) + (normalizedEvents.length - sourceEvents.length),
    errors
  };
}
