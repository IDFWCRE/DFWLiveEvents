import Link from "next/link";
import { notFound } from "next/navigation";
import { DataState } from "@/components/DataState";
import { getCurrentUserWithProfile } from "@/lib/auth/profiles";
import { formatEventDate } from "@/lib/events";
import { getEventBySlug } from "@/lib/supabase/queries";
import { isExternalTicketOffer } from "@/lib/tickets";

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user } = await getCurrentUserWithProfile();
  const { data: event, error } = await getEventBySlug(slug);

  if (error) {
    return <DataState title="Supabase setup needed" message={error} />;
  }

  if (!event) {
    notFound();
  }

  const isLoggedIn = Boolean(user);
  const goHref = event.offerId ? `/go/${event.offerId}` : event.ticketUrl;
  const ticketHref = isLoggedIn ? goHref : `/login?next=${encodeURIComponent(goHref)}`;
  const opensInNewTab = isExternalTicketOffer(event.ticketSourceName);

  return (
    <article className="detail-layout">
      <div className="stack">
        <img className="detail-image" src={event.image} alt="" />
        <div>
          <p className="eyebrow">{event.category}</p>
          <h1>{event.name}</h1>
          <p className="page-copy">{event.description}</p>
        </div>
      </div>
      <aside className="detail-panel stack">
        <span className="pill">{event.city}</span>
        <h2 className="section-title">Event Details</h2>
        <p>
          <strong>Date:</strong>
          <br />
          {formatEventDate(event.dateTime)}
        </p>
        <p>
          <strong>Venue:</strong>
          <br />
          <Link href={`/venues/${event.venue.slug}`}>{event.venue.name}</Link>
          <br />
          <span className="muted">{event.venue.address}</span>
        </p>
        <a className="primary-button" href={ticketHref} target={opensInNewTab ? "_blank" : undefined} rel={opensInNewTab ? "noopener noreferrer" : undefined}>
          {isLoggedIn ? "Buy Tickets" : "Login to Buy Tickets"}
        </a>
        {!isLoggedIn ? <p className="muted">Create a free account to continue to ticket purchase.</p> : null}
      </aside>
    </article>
  );
}
