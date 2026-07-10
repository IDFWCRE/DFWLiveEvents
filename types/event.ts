import type { EventCategoryLabel, EventCategorySlug, EventSubcategoryLabel, EventSubcategorySlug } from "@/lib/taxonomy";

export type EventCategory = EventCategoryLabel;

export type CitySlug =
  | "dallas"
  | "fort-worth"
  | "arlington"
  | "denton"
  | "irving"
  | "grand-prairie"
  | "plano"
  | "frisco"
  | "mckinney";

export interface Venue {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Event {
  id: string;
  slug: string;
  name: string;
  image: string;
  dateTime: string;
  venue: Venue;
  city: string;
  citySlug: CitySlug;
  category: EventCategory;
  categorySlug?: EventCategorySlug;
  subcategorySlug?: EventSubcategorySlug;
  subcategoryLabel?: EventSubcategoryLabel;
  description: string;
  ticketUrl: string;
  offerId?: string;
  ticketSourceName?: string;
  sourceProvider?: string;
  sourceUrl?: string;
  hasOwnedTickets?: boolean;
  status: "draft" | "published" | "cancelled";
}
