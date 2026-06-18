import { createClient } from "@supabase/supabase-js";
import type { CitySlug, Event, EventCategory, Venue } from "@/types/event";

type QueryResult<T> = {
  data: T;
  error: string | null;
};

type VenueRow = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

type EventOfferRow = {
  id: string;
  source_name: string | null;
  affiliate_url: string | null;
  source_listing_url: string | null;
  available: boolean;
};

type EventRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: "music" | "comedy";
  event_date: string;
  event_time: string | null;
  image_url: string | null;
  status: "draft" | "published" | "cancelled";
  venues: VenueRow | VenueRow[] | null;
  event_offers?: EventOfferRow[] | null;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80";

function createSupabaseAnonClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      client: null,
      error: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    };
  }

  return {
    client: createClient(supabaseUrl, supabaseAnonKey),
    error: null
  };
}

function slugifyCity(city: string): CitySlug {
  return city.toLowerCase().replace(/\s+/g, "-") as CitySlug;
}

function displayCategory(category: EventRow["category"]): EventCategory {
  return category === "comedy" ? "Comedy" : "Music";
}

function mapVenue(row: VenueRow): Venue {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    state: row.state,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude
  };
}

function mapEvent(row: EventRow): Event | null {
  const eventVenue = Array.isArray(row.venues) ? row.venues[0] : row.venues;
  if (!eventVenue) return null;

  const ticketOffer = row.event_offers?.find((offer) => offer.available) || row.event_offers?.[0];
  const dateTime = `${row.event_date}T${row.event_time || "00:00:00"}-05:00`;

  return {
    id: row.id,
    slug: row.slug,
    name: row.title,
    image: row.image_url || fallbackImage,
    dateTime,
    venue: mapVenue(eventVenue),
    city: eventVenue.city,
    citySlug: slugifyCity(eventVenue.city),
    category: displayCategory(row.category),
    description: row.description || "",
    ticketUrl: ticketOffer?.affiliate_url || ticketOffer?.source_listing_url || "#",
    offerId: ticketOffer?.id,
    ticketSourceName: ticketOffer?.source_name || undefined,
    status: row.status
  };
}

const eventSelect = `
  id,
  slug,
  title,
  description,
  category,
  event_date,
  event_time,
  image_url,
  status,
  venues (
    id,
    slug,
    name,
    city,
    state,
    address,
    latitude,
    longitude
  ),
  event_offers (
    id,
    source_name,
    affiliate_url,
    source_listing_url,
    available
  )
`;

export async function getUpcomingEvents(): Promise<QueryResult<Event[]>> {
  const { client, error } = createSupabaseAnonClient();
  if (!client) return { data: [], error };

  const today = new Date().toISOString().slice(0, 10);
  const { data, error: queryError } = await client
    .from("events")
    .select(eventSelect)
    .eq("status", "published")
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true });

  if (queryError) {
    return { data: [], error: queryError.message };
  }

  return {
    data: ((data as EventRow[] | null) || []).map(mapEvent).filter((event): event is Event => Boolean(event)),
    error: null
  };
}

export async function getFeaturedEvents(limit = 6): Promise<QueryResult<Event[]>> {
  const result = await getUpcomingEvents();
  return {
    data: result.data.slice(0, limit),
    error: result.error
  };
}

export async function getEventBySlug(slug: string): Promise<QueryResult<Event | null>> {
  const { client, error } = createSupabaseAnonClient();
  if (!client) return { data: null, error };

  const { data, error: queryError } = await client
    .from("events")
    .select(eventSelect)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (queryError) {
    return { data: null, error: queryError.message };
  }

  return { data: data ? mapEvent(data as EventRow) : null, error: null };
}

export async function getVenues(): Promise<QueryResult<Venue[]>> {
  const { client, error } = createSupabaseAnonClient();
  if (!client) return { data: [], error };

  const { data, error: queryError } = await client
    .from("venues")
    .select("id, slug, name, city, state, address, latitude, longitude")
    .order("city", { ascending: true })
    .order("name", { ascending: true });

  if (queryError) {
    return { data: [], error: queryError.message };
  }

  return { data: ((data as VenueRow[] | null) || []).map(mapVenue), error: null };
}

export async function getVenueBySlug(slug: string): Promise<QueryResult<Venue | null>> {
  const { client, error } = createSupabaseAnonClient();
  if (!client) return { data: null, error };

  const { data, error: queryError } = await client
    .from("venues")
    .select("id, slug, name, city, state, address, latitude, longitude")
    .eq("slug", slug)
    .maybeSingle();

  if (queryError) {
    return { data: null, error: queryError.message };
  }

  return { data: data ? mapVenue(data as VenueRow) : null, error: null };
}
