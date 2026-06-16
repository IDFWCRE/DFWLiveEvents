import { DataState } from "@/components/DataState";
import { EventDirectory } from "@/components/EventDirectory";
import { PageHero } from "@/components/PageHero";
import { getUpcomingEvents } from "@/lib/supabase/queries";

export default async function EventsPage() {
  const { data: events, error } = await getUpcomingEvents();

  return (
    <>
      <PageHero
        eyebrow="All upcoming events"
        title={
          <>
            Browse <span className="accent">DFW events.</span>
          </>
        }
        copy="Filter seeded marketplace inventory by date, city, and category."
      />
      {error ? <DataState title="Supabase setup needed" message={error} /> : <EventDirectory events={events} />}
    </>
  );
}
