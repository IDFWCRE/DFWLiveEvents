import { notFound } from "next/navigation";
import { DataState } from "@/components/DataState";
import { EventDirectory } from "@/components/EventDirectory";
import { formatEventDate } from "@/lib/events";
import { getUpcomingEvents, getVenueBySlug } from "@/lib/supabase/queries";

export default async function VenueDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ data: venue, error: venueError }, { data: events, error: eventsError }] = await Promise.all([
    getVenueBySlug(slug),
    getUpcomingEvents()
  ]);
  const error = venueError || eventsError;

  if (error) {
    return <DataState title="Supabase setup needed" message={error} />;
  }

  if (!venue) {
    notFound();
  }

  const venueEvents = events.filter((event) => event.venue.slug === venue.slug);
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
