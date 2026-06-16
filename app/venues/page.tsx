import { PageHero } from "@/components/PageHero";
import { VenueCard } from "@/components/VenueCard";
import { venues } from "@/lib/events";

export default function VenuesPage() {
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
      <div className="venue-grid">
        {venues.map((venue) => (
          <VenueCard venue={venue} key={venue.id} />
        ))}
      </div>
    </>
  );
}
