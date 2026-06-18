import Link from "next/link";
import { formatEventDate } from "@/lib/events";
import { formatTicketPrice } from "@/lib/owned-tickets";
import type { OwnedTicketListing } from "@/types/ticket";

export function OwnedTicketCard({ listing }: { listing: OwnedTicketListing }) {
  return (
    <article className="info-card stack">
      <div className="event-meta">
        <span className="pill">DFW Tickets</span>
        {listing.event ? <span className="pill">{listing.event.city}</span> : null}
      </div>
      <h3>{listing.title || listing.event?.name || "Owned Tickets"}</h3>
      {listing.event ? (
        <p className="muted">
          {formatEventDate(listing.event.dateTime)}
          <br />
          {listing.event.venue.name}
        </p>
      ) : null}
      <div className="details">
        <span>{formatTicketPrice(listing.pricePerTicket, listing.currency)} per ticket</span>
        <span>{listing.quantityAvailable} available</span>
        {listing.section ? <span>Section {listing.section}</span> : null}
        {listing.rowName ? <span>Row {listing.rowName}</span> : null}
      </div>
      {listing.publicNotes ? <p className="muted">{listing.publicNotes}</p> : null}
      <Link className="primary-button" href={`/tickets/${listing.id}`}>Request Tickets</Link>
    </article>
  );
}
