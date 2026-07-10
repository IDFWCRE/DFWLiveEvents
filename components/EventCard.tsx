import Link from "next/link";
import { formatEventDate } from "@/lib/events";
import { isExternalTicketOffer } from "@/lib/tickets";
import type { Event } from "@/types/event";

interface EventCardProps {
  event: Event;
  isLoggedIn?: boolean;
}

function sourceLabel(source?: string) {
  if (!source) return null;
  if (source.toLowerCase() === "ticketmaster") return "Ticketmaster";
  if (source.toLowerCase() === "eventbrite") return "Eventbrite";
  if (source.toLowerCase() === "stubhub") return "StubHub";
  return source;
}

export function EventCard({ event, isLoggedIn = false }: EventCardProps) {
  const goHref = event.offerId ? `/go/${event.offerId}` : event.ticketUrl;
  const ticketHref = isLoggedIn ? goHref : `/login?next=${encodeURIComponent(goHref)}`;
  const opensInNewTab = isExternalTicketOffer(event.ticketSourceName);
  const date = new Date(event.dateTime);
  const month = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "America/Chicago"
  }).format(date);
  const providerLabel = sourceLabel(event.sourceProvider);
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
          {providerLabel ? <span className="pill">{providerLabel}</span> : null}
          {event.hasOwnedTickets ? <span className="pill">DFW Tickets Available</span> : null}
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
        <a className="ticket-button" href={ticketHref} target={opensInNewTab ? "_blank" : undefined} rel={opensInNewTab ? "noopener noreferrer" : undefined}>
          <span>{isLoggedIn ? "Buy Tickets" : "Login to Buy Tickets"}</span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}
