import Link from "next/link";
import { getEventsByVenue } from "@/lib/events";
import type { Venue } from "@/types/event";

interface VenueCardProps {
  venue: Venue;
}

export function VenueCard({ venue }: VenueCardProps) {
  const events = getEventsByVenue(venue.slug);

  return (
    <article className="info-card">
      <span className="pill">{venue.city}</span>
      <h3>{venue.name}</h3>
      <p className="muted">{venue.address}</p>
      <p className="muted">
        {events.length} {events.length === 1 ? "upcoming event" : "upcoming events"}
      </p>
      <Link className="primary-button" href={`/venues/${venue.slug}`}>
        View Venue
      </Link>
    </article>
  );
}
