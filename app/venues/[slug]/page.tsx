import { notFound } from "next/navigation";
import { EventDirectory } from "@/components/EventDirectory";
import { formatEventDate, getEventsByVenue, getVenueBySlug, venues } from "@/lib/events";

export function generateStaticParams() {
  return venues.map((venue) => ({ slug: venue.slug }));
}

export default async function VenueDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);

  if (!venue) {
    notFound();
  }

  const venueEvents = getEventsByVenue(venue.slug);
  const nextEvent = venueEvents[0];

  return (
    <>
      <section className="detail-panel stack" style={{ marginBottom: 36 }}>
        <span className="pill">{venue.city}</span>
        <h1>{venue.name}</h1>
        <p className="page-copy">{venue.address}</p>
        {nextEvent ? (
          <p className="muted">Next event: {nextEvent.name} · {formatEventDate(nextEvent.dateTime)}</p>
        ) : (
          <p className="muted">No placeholder events are scheduled at this venue yet.</p>
        )}
      </section>
      <EventDirectory events={venueEvents} initialCity={venue.city} title={`${venue.name} Events`} />
    </>
  );
}
