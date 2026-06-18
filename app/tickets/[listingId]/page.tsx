import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { getCurrentUserWithProfile } from "@/lib/auth/profiles";
import { formatEventDate } from "@/lib/events";
import { getActiveOwnedTicketListingById, formatTicketPrice } from "@/lib/owned-tickets";
import { submitOwnedTicketRequestAction } from "@/lib/ticket-actions";

type TicketPageSearchParams = {
  error?: string;
  message?: string;
};

export default async function TicketListingPage({
  params,
  searchParams
}: {
  params: Promise<{ listingId: string }>;
  searchParams: Promise<TicketPageSearchParams>;
}) {
  const { listingId } = await params;
  const query = await searchParams;
  const { user, profile } = await getCurrentUserWithProfile();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/tickets/${listingId}`)}`);
  }

  const { data: listing, error } = await getActiveOwnedTicketListingById(listingId);
  if (error) {
    return (
      <div className="empty-state">
        <h1>Ticket listing unavailable</h1>
        <p className="muted">{error}</p>
      </div>
    );
  }
  if (!listing || !listing.event) {
    notFound();
  }

  return (
    <>
      <PageHero
        eyebrow="Request tickets"
        title={
          <>
            {listing.event.name} <span className="accent">tickets.</span>
          </>
        }
        copy="Submit a request and our team will contact you to confirm availability and payment details."
      />
      <article className="detail-layout">
        <section className="detail-panel stack">
          <span className="pill">DFW Live Events Tickets</span>
          <h2 className="section-title">{listing.title || listing.event.name}</h2>
          <p className="muted">
            {formatEventDate(listing.event.dateTime)}
            <br />
            <Link href={`/venues/${listing.event.venue.slug}`}>{listing.event.venue.name}</Link>
          </p>
          <div className="env-table">
            <div className="env-row"><span>Price</span><strong>{formatTicketPrice(listing.pricePerTicket, listing.currency)}</strong></div>
            <div className="env-row"><span>Available</span><strong>{listing.quantityAvailable}</strong></div>
            <div className="env-row"><span>Section</span><strong>{listing.section || "-"}</strong></div>
            <div className="env-row"><span>Row</span><strong>{listing.rowName || "-"}</strong></div>
            <div className="env-row"><span>Seats</span><strong>{listing.seatNumbers || "-"}</strong></div>
            <div className="env-row"><span>Delivery</span><strong>{listing.deliveryMethod.replace("_", " ")}</strong></div>
          </div>
          {listing.publicNotes ? <p className="muted">{listing.publicNotes}</p> : null}
        </section>
        <aside className="detail-panel stack">
          <h2 className="section-title">Request Form</h2>
          {query.error ? <p className="auth-message auth-error">{query.error}</p> : null}
          {query.message ? <p className="auth-message auth-success">{query.message}</p> : null}
          <form className="auth-form" action={submitOwnedTicketRequestAction}>
            <input type="hidden" name="listing_id" value={listing.id} />
            <label>
              Quantity
              <input className="admin-input" type="number" name="quantity_requested" min={1} max={listing.quantityAvailable} defaultValue={1} required />
            </label>
            <label>
              Email
              <input className="admin-input" type="email" value={user.email || ""} readOnly />
            </label>
            <label>
              Name
              <input className="admin-input" value={profile?.full_name || user.user_metadata?.full_name || ""} readOnly />
            </label>
            <label>
              Phone
              <input className="admin-input" name="buyer_phone" />
            </label>
            <label>
              Message
              <textarea className="admin-input" name="buyer_message" rows={4} />
            </label>
            <button className="primary-button" type="submit">Submit Ticket Request</button>
          </form>
        </aside>
      </article>
    </>
  );
}
