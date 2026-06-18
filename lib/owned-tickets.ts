import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Event } from "@/types/event";
import type { OwnedTicketListing, OwnedTicketRequest, OwnedTicketRequestStatus } from "@/types/ticket";

const listingSelect = `
  id,
  event_id,
  title,
  description,
  quantity_total,
  quantity_available,
  section,
  row_name,
  seat_numbers,
  price_per_ticket,
  currency,
  delivery_method,
  listing_status,
  public_notes,
  private_notes,
  created_at,
  updated_at,
  events (
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
    )
  )
`;

const requestSelect = `
  id,
  listing_id,
  event_id,
  buyer_user_id,
  buyer_email,
  buyer_name,
  buyer_phone,
  quantity_requested,
  status,
  buyer_message,
  admin_notes,
  created_at,
  updated_at,
  owned_ticket_listings (
    id,
    event_id,
    title,
    description,
    quantity_total,
    quantity_available,
    section,
    row_name,
    seat_numbers,
    price_per_ticket,
    currency,
    delivery_method,
    listing_status,
    public_notes,
    private_notes
  ),
  events (
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
    )
  )
`;

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
};

type ListingRow = {
  id: string;
  event_id: string;
  title: string | null;
  description: string | null;
  quantity_total: number;
  quantity_available: number;
  section: string | null;
  row_name: string | null;
  seat_numbers: string | null;
  price_per_ticket: number | string;
  currency: string;
  delivery_method: string;
  listing_status: OwnedTicketListing["listingStatus"];
  public_notes: string | null;
  private_notes?: string | null;
  created_at?: string;
  updated_at?: string;
  events?: EventRow | EventRow[] | null;
};

type RequestRow = {
  id: string;
  listing_id: string;
  event_id: string;
  buyer_user_id: string | null;
  buyer_email: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  quantity_requested: number;
  status: OwnedTicketRequestStatus;
  buyer_message: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  owned_ticket_listings?: ListingRow | ListingRow[] | null;
  events?: EventRow | EventRow[] | null;
};

function slugifyCity(city: string) {
  return city.toLowerCase().replace(/\s+/g, "-");
}

function mapEvent(row?: EventRow | EventRow[] | null): Event | undefined {
  const event = Array.isArray(row) ? row[0] : row;
  if (!event) return undefined;
  const venue = Array.isArray(event.venues) ? event.venues[0] : event.venues;
  if (!venue) return undefined;

  return {
    id: event.id,
    slug: event.slug,
    name: event.title,
    image: event.image_url || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
    dateTime: `${event.event_date}T${event.event_time || "00:00:00"}-05:00`,
    venue: {
      id: venue.id,
      slug: venue.slug,
      name: venue.name,
      city: venue.city,
      state: venue.state,
      address: venue.address,
      latitude: venue.latitude,
      longitude: venue.longitude
    },
    city: venue.city,
    citySlug: slugifyCity(venue.city) as Event["citySlug"],
    category: event.category === "comedy" ? "Comedy" : "Music",
    description: event.description || "",
    ticketUrl: "#",
    status: event.status
  };
}

export function mapOwnedTicketListing(row: ListingRow): OwnedTicketListing {
  return {
    id: row.id,
    eventId: row.event_id,
    title: row.title,
    description: row.description,
    quantityTotal: row.quantity_total,
    quantityAvailable: row.quantity_available,
    section: row.section,
    rowName: row.row_name,
    seatNumbers: row.seat_numbers,
    pricePerTicket: Number(row.price_per_ticket),
    currency: row.currency,
    deliveryMethod: row.delivery_method,
    listingStatus: row.listing_status,
    publicNotes: row.public_notes,
    privateNotes: row.private_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    event: mapEvent(row.events)
  };
}

export function mapOwnedTicketRequest(row: RequestRow): OwnedTicketRequest {
  const listing = Array.isArray(row.owned_ticket_listings) ? row.owned_ticket_listings[0] : row.owned_ticket_listings;
  return {
    id: row.id,
    listingId: row.listing_id,
    eventId: row.event_id,
    buyerUserId: row.buyer_user_id,
    buyerEmail: row.buyer_email,
    buyerName: row.buyer_name,
    buyerPhone: row.buyer_phone,
    quantityRequested: row.quantity_requested,
    status: row.status,
    buyerMessage: row.buyer_message,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    listing: listing ? mapOwnedTicketListing(listing) : undefined,
    event: mapEvent(row.events)
  };
}

export async function getActiveOwnedTicketListings() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("owned_ticket_listings")
    .select(listingSelect)
    .eq("listing_status", "active")
    .gt("quantity_available", 0)
    .order("created_at", { ascending: false });

  if (error) return { data: [] as OwnedTicketListing[], error: error.message };
  return { data: ((data || []) as ListingRow[]).map(mapOwnedTicketListing), error: null };
}

export async function getActiveOwnedTicketListingsByEvent(eventId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("owned_ticket_listings")
    .select(listingSelect)
    .eq("event_id", eventId)
    .eq("listing_status", "active")
    .gt("quantity_available", 0)
    .order("price_per_ticket", { ascending: true });

  if (error) return { data: [] as OwnedTicketListing[], error: error.message };
  return { data: ((data || []) as ListingRow[]).map(mapOwnedTicketListing), error: null };
}

export async function getActiveOwnedTicketListingById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("owned_ticket_listings")
    .select(listingSelect)
    .eq("id", id)
    .eq("listing_status", "active")
    .gt("quantity_available", 0)
    .maybeSingle();

  if (error) return { data: null as OwnedTicketListing | null, error: error.message };
  return { data: data ? mapOwnedTicketListing(data as ListingRow) : null, error: null };
}

export async function getOwnedTicketRequestsForUser(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("owned_ticket_requests")
    .select(requestSelect)
    .eq("buyer_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { data: [] as OwnedTicketRequest[], error: error.message };
  return { data: ((data || []) as RequestRow[]).map(mapOwnedTicketRequest), error: null };
}

export async function getAdminOwnedTicketListings() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("owned_ticket_listings")
    .select(listingSelect)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data || []) as ListingRow[]).map(mapOwnedTicketListing);
}

export async function getAdminOwnedTicketRequests() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("owned_ticket_requests")
    .select(requestSelect)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return ((data || []) as RequestRow[]).map(mapOwnedTicketRequest);
}

export function formatTicketPrice(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(amount);
}
