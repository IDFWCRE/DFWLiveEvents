import { PageHero } from "@/components/PageHero";

export default function AdminPage() {
  return (
    <>
      <PageHero
        eyebrow="Admin"
        title={
          <>
            Marketplace <span className="accent">operations.</span>
          </>
        }
        copy="Placeholder admin area for future event ingestion, venue management, listings, payments, and approvals."
      />
      <section className="detail-panel stack">
        <h2 className="section-title">Coming Next</h2>
        <p className="muted">Supabase, authentication, seller tools, and payments are intentionally not wired yet.</p>
      </section>
    </>
  );
}
