import Link from "next/link";
import { notFound } from "next/navigation";
import { formatEventDate, getEventBySlug, events } from "@/lib/events";

export function generateStaticParams() {
  return events.map((event) => ({ slug: event.slug }));
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEventBySlug(slug);

  if (!event) {
    notFound();
  }

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
        <a className="primary-button" href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
          Buy Tickets
        </a>
      </aside>
    </article>
  );
}
