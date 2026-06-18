import { DataState } from "@/components/DataState";
import { OwnedTicketCard } from "@/components/OwnedTicketCard";
import { PageHero } from "@/components/PageHero";
import { getActiveOwnedTicketListings } from "@/lib/owned-tickets";

export default async function TicketsPage() {
  const { data: listings, error } = await getActiveOwnedTicketListings();

  return (
    <>
      <PageHero
        eyebrow="Owned inventory"
        title={
          <>
            DFW Live Events <span className="accent">Tickets.</span>
          </>
        }
        copy="Request tickets owned by DFW Live Events. Payments and fulfillment are handled manually for now."
      />
      {error ? (
        <DataState title="Ticket setup needed" message={error} />
      ) : listings.length ? (
        <div className="event-grid">
          {listings.map((listing) => (
            <OwnedTicketCard listing={listing} key={listing.id} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No DFW-owned tickets available</h2>
          <p className="muted">Check back soon for manually fulfilled ticket inventory.</p>
        </div>
      )}
    </>
  );
}
