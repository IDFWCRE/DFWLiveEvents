import { DataState } from "@/components/DataState";
import { PageHero } from "@/components/PageHero";
import { VenueCard } from "@/components/VenueCard";
import { getUpcomingEvents, getVenues } from "@/lib/supabase/queries";

export default async function VenuesPage() {
  const [{ data: venues, error: venuesError }, { data: events, error: eventsError }] = await Promise.all([
    getVenues(),
    getUpcomingEvents()
  ]);
  const error = venuesError || eventsError;

  return (
    <>
      <PageHero
        eyebrow="DFW venue guide"
        title={
          <>
            Discover <span className="accent">local venues.</span>
          </>
        }
        copy="A starter venue directory for the future marketplace experience."
      />
      {error ? (
        <DataState title="Supabase setup needed" message={error} />
      ) : (
        <div className="venue-grid">
          {venues.map((venue) => (
            <VenueCard
              venue={venue}
              eventCount={events.filter((event) => event.venue.slug === venue.slug).length}
              key={venue.id}
            />
          ))}
        </div>
      )}
    </>
  );
}
