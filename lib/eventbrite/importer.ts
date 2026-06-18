import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getImportWindow, isDateInImportWindow } from "@/lib/import/window";
import { runWithImportHistory, type ImportRunType } from "@/lib/import/runs";
import { getActiveSourceImportTargets, type SourceImportTarget } from "@/lib/import/source-targets";
import { fetchEventbriteEvents } from "./client";
import { normalizeEventbriteEvent, type NormalizedEventbriteEvent } from "./normalize";

export type EventbriteImportSummary = {
  fetchedCount: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: string[];
};

export type EventbriteImportOptions = {
  log?: (message: string) => void;
  runType?: ImportRunType;
  triggeredBy?: string;
};

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;

async function ensureEventbriteSource(supabase: SupabaseAdmin) {
  const { error } = await supabase.from("ticket_sources").upsert(
    {
      slug: "eventbrite",
      name: "Eventbrite",
      website_url: "https://www.eventbrite.com",
      affiliate_base_url: null,
      active: true
    },
    { onConflict: "slug" }
  );

  if (error) {
    throw new Error(`Unable to upsert Eventbrite source: ${error.message}`);
  }
}

async function upsertVenue(supabase: SupabaseAdmin, event: NormalizedEventbriteEvent) {
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

async function upsertPerformers(supabase: SupabaseAdmin, event: NormalizedEventbriteEvent) {
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

async function getExistingEventbriteIds(supabase: SupabaseAdmin, externalEventIds: string[]) {
  if (!externalEventIds.length) return new Set<string>();

  const { data, error } = await supabase
    .from("events")
    .select("external_event_id")
    .eq("external_source", "eventbrite")
    .in("external_event_id", externalEventIds);

  if (error) {
    throw new Error(`Unable to check existing Eventbrite events: ${error.message}`);
  }

  return new Set(((data || []) as Array<{ external_event_id: string | null }>).map((row) => row.external_event_id).filter(Boolean));
}

async function upsertEvent(supabase: SupabaseAdmin, event: NormalizedEventbriteEvent, venueId: string) {
  const { data, error } = await supabase
    .from("events")
    .upsert(
      {
        slug: event.slug,
        title: event.title,
        description: event.description,
        category: event.category,
        event_date: event.eventDate,
        event_time: event.eventTime,
        image_url: event.imageUrl,
        status: "published",
        venue_id: venueId,
        source_type: "api",
        external_source: "eventbrite",
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

async function upsertEventbriteOffer(supabase: SupabaseAdmin, eventId: string, event: NormalizedEventbriteEvent) {
  const { error } = await supabase.from("event_offers").upsert(
    {
      event_id: eventId,
      source_name: event.sourceName,
      source_listing_url: event.sourceUrl,
      affiliate_url: null,
      currency: "USD",
      available: true
    },
    { onConflict: "event_id,source_name" }
  );

  if (error) {
    throw new Error(`Unable to upsert Eventbrite offer for "${event.title}": ${error.message}`);
  }
}

function dedupeNormalizedEvents(events: NormalizedEventbriteEvent[]) {
  return [...new Map(events.map((event) => [event.externalEventId, event])).values()];
}

async function importEventbriteEventsInternal(options: EventbriteImportOptions = {}): Promise<EventbriteImportSummary> {
  options.log?.("[eventbrite] Import started");
  const importWindow = getImportWindow();
  options.log?.(`[eventbrite] Import window: ${importWindow.label} (${importWindow.startIso} to ${importWindow.endIso})`);
  let targets: SourceImportTarget[] = [];
  try {
    targets = await getActiveSourceImportTargets("eventbrite");
    options.log?.(`[eventbrite] Loaded ${targets.length} active source_import_targets row(s)`);
  } catch (error) {
    options.log?.(`[eventbrite] Could not load source_import_targets: ${error instanceof Error ? error.message : String(error)}`);
  }

  const fetched = await fetchEventbriteEvents({ log: options.log, targets });
  const errors = [...fetched.errors];
  const normalizedResults = fetched.events.map(normalizeEventbriteEvent);
  const normalizedEvents = dedupeNormalizedEvents(
    normalizedResults
      .filter((result) => {
        if (result.skipped) {
          options.log?.(`[eventbrite] Skipped: ${result.reason}`);
          return false;
        }
        if (!isDateInImportWindow(`${result.event.eventDate}T${result.event.eventTime || "00:00:00"}`, importWindow)) {
          options.log?.(`[eventbrite] Skipped outside import window: ${result.event.title}`);
          return false;
        }
        return true;
      })
      .map((result) => result.event)
      .filter((event): event is NormalizedEventbriteEvent => Boolean(event))
  );

  const skippedCount = fetched.skippedCount + normalizedResults.filter((result) => result.skipped).length + (normalizedResults.length - normalizedEvents.length);
  const supabase = createSupabaseAdminClient();

  await ensureEventbriteSource(supabase);

  const existingIds = await getExistingEventbriteIds(
    supabase,
    normalizedEvents.map((event) => event.externalEventId)
  );

  let insertedCount = 0;
  let updatedCount = 0;

  options.log?.(`[eventbrite] Upserting ${normalizedEvents.length} normalized event(s)`);

  for (const event of normalizedEvents) {
    try {
      options.log?.(`[eventbrite] Upserting event: ${event.title}`);
      const wasExisting = existingIds.has(event.externalEventId);
      const venueId = await upsertVenue(supabase, event);
      const performerIds = await upsertPerformers(supabase, event);
      const eventId = await upsertEvent(supabase, event, venueId);
      await upsertEventPerformers(supabase, eventId, performerIds);
      await upsertEventbriteOffer(supabase, eventId, event);

      if (wasExisting) {
        updatedCount += 1;
      } else {
        insertedCount += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message);
      options.log?.(`[eventbrite] Upsert error for "${event.title}": ${message}`);
    }
  }

  const summary = {
    fetchedCount: fetched.fetchedCount,
    insertedCount,
    updatedCount,
    skippedCount,
    errors
  };

  options.log?.(
    `[eventbrite] Import complete: fetched=${summary.fetchedCount}, inserted=${summary.insertedCount}, updated=${summary.updatedCount}, skipped=${summary.skippedCount}, errors=${summary.errors.length}`
  );

  return summary;
}

export async function importEventbriteEvents(options: EventbriteImportOptions = {}): Promise<EventbriteImportSummary> {
  return runWithImportHistory(
    options.runType
      ? {
          sourceName: "eventbrite",
          runType: options.runType,
          triggeredBy: options.triggeredBy
        }
      : undefined,
    () => importEventbriteEventsInternal(options)
  );
}
