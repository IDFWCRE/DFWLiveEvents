export type EventCategory = "Music" | "Comedy";

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
  description: string;
  ticketUrl: string;
  status: "draft" | "published" | "cancelled";
}
