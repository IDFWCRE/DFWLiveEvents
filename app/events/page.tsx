import { EventDirectory } from "@/components/EventDirectory";
import { PageHero } from "@/components/PageHero";
import { events } from "@/lib/events";

export default function EventsPage() {
  return (
    <>
      <PageHero
        eyebrow="All upcoming events"
        title={
          <>
            Browse <span className="accent">DFW events.</span>
          </>
        }
        copy="Filter placeholder marketplace inventory by date, city, and category."
      />
      <EventDirectory events={events} />
    </>
  );
}
