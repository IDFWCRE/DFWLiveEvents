import Link from "next/link";
import { formatEventDate } from "@/lib/events";
import type { Event } from "@/types/event";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const date = new Date(event.dateTime);
  const month = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "America/Chicago"
  }).format(date);
  const day = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    timeZone: "America/Chicago"
  }).format(date);

  return (
    <article className="event-card">
      <Link className="image-wrap" href={`/events/${event.slug}`} aria-label={`View ${event.name}`}>
        <img className="event-image" src={event.image} alt="" loading="lazy" />
        <div className="date-badge" aria-hidden="true">
          <strong>{month}</strong>
          <span>{day}</span>
        </div>
      </Link>
      <div className="card-body">
        <div className="event-meta">
          <span className="pill">{event.category}</span>
          <span className="pill">{event.city}</span>
        </div>
        <h3 className="event-title">
          <Link href={`/events/${event.slug}`}>{event.name}</Link>
        </h3>
        <div className="details">
          <span>{formatEventDate(event.dateTime)}</span>
          <span>
            {event.venue.name} · {event.city}
          </span>
        </div>
        <a className="ticket-button" href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
          <span>Buy Tickets</span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}
