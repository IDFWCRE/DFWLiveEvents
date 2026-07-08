import { PageHero } from "@/components/PageHero";

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title={
          <>
            Your guide to <span className="accent">DFW live nights.</span>
          </>
        }
        copy="DFW Live Events helps fans discover concerts, comedy nights, venues, and live entertainment across Dallas-Fort Worth."
      />
      <section className="detail-panel stack">
        <h2 className="section-title">What We’re Building</h2>
        <p className="muted">
          We are creating a clean marketplace-style directory for live events across Dallas, Fort Worth, Arlington,
          Denton, Irving, Grand Prairie, Plano, Frisco, McKinney, and the broader North Texas scene.
        </p>
        <p className="muted">
          Today, the site supports event discovery, trusted partner ticket links, and a small set of DFW Live Events-owned
          ticket listings that logged-in users can request. Those requests are manually reviewed and fulfilled; online
          checkout, payment processing, instant ticket transfer, and reseller listing tools are not live yet.
        </p>
      </section>
    </>
  );
}
