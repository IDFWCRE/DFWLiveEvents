import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { logoutAction } from "@/lib/auth/actions";
import { getCurrentUserWithProfile } from "@/lib/auth/profiles";
import { formatTicketPrice, getOwnedTicketRequestsForUser } from "@/lib/owned-tickets";

export default async function AccountPage() {
  const { user, profile, sellerProfile } = await getCurrentUserWithProfile();

  if (!user) {
    redirect("/login?next=/account");
  }

  const role = profile?.role || "buyer";
  const resellerStatus = profile?.reseller_status || "none";
  const { data: ticketRequests } = await getOwnedTicketRequestsForUser(user.id);

  return (
    <>
      <PageHero
        eyebrow="Account"
        title={
          <>
            Your <span className="accent">dashboard.</span>
          </>
        }
        copy="Manage your buyer account, reseller status, and future marketplace tools."
      />
      <section className="detail-panel stack">
        <h2 className="section-title">Profile</h2>
        <div className="env-table">
          <div className="env-row"><span>Email</span><strong>{user.email}</strong></div>
          <div className="env-row"><span>Name</span><strong>{profile?.full_name || "Not set"}</strong></div>
          <div className="env-row"><span>Role</span><strong>{role}</strong></div>
          <div className="env-row"><span>Reseller status</span><strong>{resellerStatus}</strong></div>
        </div>
        {role === "admin" ? <Link className="primary-button" href="/admin">Open Admin Dashboard</Link> : null}
        <div className="empty-state">
          <h3>My Ticket Requests</h3>
          {ticketRequests.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Qty</th>
                    <th>Status</th>
                    <th>Price</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketRequests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.event?.name || "Event"}</td>
                      <td>{request.quantityRequested}</td>
                      <td><span className={`status-pill status-${request.status}`}>{request.status}</span></td>
                      <td>{request.listing ? formatTicketPrice(request.listing.pricePerTicket, request.listing.currency) : "-"}</td>
                      <td>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(request.createdAt))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">No ticket requests yet.</p>
          )}
        </div>
        {resellerStatus === "none" ? (
          <div className="empty-state">
            <h3>Buyer Dashboard</h3>
            <p className="muted">Saved events and purchase history placeholders will land in a later phase.</p>
            <Link className="primary-button" href="/account/reseller">Apply to become a reseller</Link>
          </div>
        ) : null}
        {resellerStatus === "pending" ? (
          <div className="empty-state">
            <h3>Reseller Approval Pending</h3>
            <p className="muted">Your reseller request is under review. Listing tools unlock after approval.</p>
            {sellerProfile ? <p className="muted">Application: {sellerProfile.business_name || sellerProfile.display_name || "Pending seller profile"}</p> : null}
          </div>
        ) : null}
        {resellerStatus === "approved" ? (
          <div className="empty-state">
            <h3>Reseller Dashboard</h3>
            <p className="muted">Approved reseller tools are coming soon. Ticket listing is not enabled in Phase 1F.</p>
          </div>
        ) : null}
        <form action={logoutAction}>
          <button className="filter-button" type="submit">Logout</button>
        </form>
      </section>
    </>
  );
}
