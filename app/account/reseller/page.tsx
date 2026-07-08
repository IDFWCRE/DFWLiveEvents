import { redirect } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { resellerApplicationAction } from "@/lib/auth/actions";
import { getCurrentUserWithProfile } from "@/lib/auth/profiles";

type ResellerSearchParams = {
  error?: string;
  message?: string;
};

export default async function ResellerPage({ searchParams }: { searchParams: Promise<ResellerSearchParams> }) {
  const params = await searchParams;
  const { user, profile, sellerProfile } = await getCurrentUserWithProfile();

  if (!user) {
    redirect("/login?next=/account/reseller");
  }

  const status = profile?.reseller_status || "none";

  return (
    <>
      <PageHero
        eyebrow="Resellers"
        title={
          <>
            Reseller <span className="accent">application.</span>
          </>
        }
        copy="Apply for future reseller listing tools. DFW-owned ticket requests are live, but reseller listings, checkout, payouts, and ticket transfer are not enabled yet."
      />
      <section className="detail-panel stack">
        <h2 className="section-title">Status: {status}</h2>
        {params.error ? <p className="auth-message auth-error">{params.error}</p> : null}
        {params.message ? <p className="auth-message auth-success">{params.message}</p> : null}
        {sellerProfile ? (
          <div className="env-table">
            <div className="env-row"><span>Business</span><strong>{sellerProfile.business_name || "Not set"}</strong></div>
            <div className="env-row"><span>Display name</span><strong>{sellerProfile.display_name || "Not set"}</strong></div>
            <div className="env-row"><span>Verification</span><strong>{sellerProfile.verification_status}</strong></div>
          </div>
        ) : null}
        {status === "none" || status === "rejected" ? (
          <form className="auth-form" action={resellerApplicationAction}>
            <label>Business name<input className="admin-input" name="business_name" required /></label>
            <label>Display name<input className="admin-input" name="display_name" required /></label>
            <label>Contact email<input className="admin-input" type="email" name="contact_email" defaultValue={user.email || ""} required /></label>
            <label>Contact phone<input className="admin-input" name="contact_phone" /></label>
            <label>Website URL<input className="admin-input" type="url" name="website_url" /></label>
            <label className="admin-checkbox">
              <input type="checkbox" name="terms" required />
              I accept the future seller terms placeholder.
            </label>
            <button className="primary-button" type="submit">Submit Reseller Request</button>
          </form>
        ) : (
          <p className="muted">Your reseller application is already {status}. Approved reseller listing tools are not live yet.</p>
        )}
      </section>
    </>
  );
}
