import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ingestNormalizedProviderEvents } from "@/lib/import/providers";
import { runWithImportHistory, type ImportRunType } from "@/lib/import/runs";
import { fetchTicketmasterEvents } from "./client";
import {
  getTicketmasterPromoterNames,
  getTicketmasterSourceName,
  isLikelyLiveNationPromoted,
  normalizeTicketmasterEvent,
  type NormalizedTicketmasterEvent
} from "./normalize";

export type TicketmasterImportSummary = {
  fetchedCount: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: string[];
  sourceCounts?: Record<string, number>;
  promoterCounts?: Record<string, number>;
  likelyLiveNationPromotedCount?: number;
};

export type TicketmasterImportOptions = {
  log?: (message: string) => void;
  runType?: ImportRunType;
  triggeredBy?: string;
};

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;

async function ensureTicketmasterSource(supabase: SupabaseAdmin) {
  const { error } = await supabase.from("ticket_sources").upsert(
    {
      slug: "ticketmaster",
      name: "Ticketmaster",
      website_url: "https://www.ticketmaster.com",
      affiliate_base_url: null,
      active: true
    },
    { onConflict: "slug" }
  );

  if (error) {
    throw new Error(`Unable to upsert Ticketmaster source: ${error.message}`);
  }
}

async function upsertVenue(supabase: SupabaseAdmin, event: NormalizedTicketmasterEvent) {
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

async function upsertPerformers(supabase: SupabaseAdmin, event: NormalizedTicketmasterEvent) {
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

async function getExistingTicketmasterIds(supabase: SupabaseAdmin, externalEventIds: string[]) {
  if (!externalEventIds.length) return new Set<string>();

  const { data, error } = await supabase
    .from("events")
    .select("external_event_id")
    .eq("external_source", "Ticketmaster")
    .in("external_event_id", externalEventIds);

  if (error) {
    throw new Error(`Unable to check existing Ticketmaster events: ${error.message}`);
  }

  return new Set(((data || []) as Array<{ external_event_id: string | null }>).map((row) => row.external_event_id).filter(Boolean));
}

async function upsertEvent(supabase: SupabaseAdmin, event: NormalizedTicketmasterEvent, venueId: string) {
  const { data, error } = await supabase
    .from("events")
    .upsert(
      {
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
        source_type: "api",
        external_source: "Ticketmaster",
        external_event_id: event.externalEventId
      },
      { onConflict: "external_source,external_event_id" }
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(`Unable to upsert event "${event.title}": ${error.message}`);
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

async function upsertTicketmasterOffer(supabase: SupabaseAdmin, eventId: string, event: NormalizedTicketmasterEvent) {
  const { error } = await supabase.from("event_offers").upsert(
    {
      event_id: eventId,
      source_name: event.sourceName,
      source_listing_url: event.sourceUrl,
      affiliate_url: event.sourceUrl,
      currency: "USD",
      available: true
    },
    { onConflict: "event_id,source_name" }
  );

  if (error) {
    throw new Error(`Unable to upsert Ticketmaster offer for "${event.title}": ${error.message}`);
  }
}

function dedupeNormalizedEvents(events: NormalizedTicketmasterEvent[]) {
  return [...new Map(events.map((event) => [event.externalEventId, event])).values()];
}

function countValues(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function dedupeTicketmasterPayloads(events: Awaited<ReturnType<typeof fetchTicketmasterEvents>>["events"]) {
  return [...new Map(events.map((event, index) => [event.id || `missing-id-${index}`, event])).values()];
}

async function importTicketmasterEventsInternal(options: TicketmasterImportOptions = {}): Promise<TicketmasterImportSummary> {
  options.log?.("[ticketmaster] Import started");
  const fetched = await fetchTicketmasterEvents({ log: options.log });
  const errors = [...fetched.errors];
  const uniqueFetchedEvents = dedupeTicketmasterPayloads(fetched.events);
  const sourceCounts = countValues(uniqueFetchedEvents.map(getTicketmasterSourceName));
  const promoterCounts = countValues(uniqueFetchedEvents.flatMap(getTicketmasterPromoterNames));
  const likelyLiveNationPromotedCount = uniqueFetchedEvents.filter(isLikelyLiveNationPromoted).length;
  const normalized = fetched.events.map(normalizeTicketmasterEvent);
  const skippedCount = normalized.filter((event) => !event).length;
  const normalizedEvents = dedupeNormalizedEvents(
    normalized.filter((event): event is NormalizedTicketmasterEvent => Boolean(event))
  );

  const supabase = createSupabaseAdminClient();

  await ensureTicketmasterSource(supabase);
  const subcategoryMappedCount = normalizedEvents.filter((event) => event.subcategorySlug).length;

  options.log?.(
    `[ticketmaster] Upserting ${normalizedEvents.length} normalized event(s); subcategory_mapped=${subcategoryMappedCount}`
  );

  const summary = await ingestNormalizedProviderEvents("ticketmaster", normalizedEvents, {
    fetchedCount: fetched.fetchedCount,
    skippedCount,
    errors,
    log: options.log
  });
  const summaryWithDiagnostics: TicketmasterImportSummary = {
    ...summary,
    sourceCounts,
    promoterCounts,
    likelyLiveNationPromotedCount
  };

  options.log?.(
    `[ticketmaster] Import complete: fetched=${summaryWithDiagnostics.fetchedCount}, inserted=${summaryWithDiagnostics.insertedCount}, updated=${summaryWithDiagnostics.updatedCount}, skipped=${summaryWithDiagnostics.skippedCount}, subcategory_mapped=${subcategoryMappedCount}, likely_live_nation=${likelyLiveNationPromotedCount}, source_counts=${JSON.stringify(sourceCounts)}, errors=${summaryWithDiagnostics.errors.length}`
  );

  return summaryWithDiagnostics;
}

export async function importTicketmasterEvents(options: TicketmasterImportOptions = {}): Promise<TicketmasterImportSummary> {
  return runWithImportHistory(
    options.runType
      ? {
          sourceName: "ticketmaster",
          runType: options.runType,
          triggeredBy: options.triggeredBy
        }
      : undefined,
    () => importTicketmasterEventsInternal(options)
  );
}
