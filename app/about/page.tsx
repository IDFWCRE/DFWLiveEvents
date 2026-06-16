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
          Today, the site focuses on discovery and trusted ticket links. Future phases may add buyer and seller
          accounts, richer venue tools, and marketplace features.
        </p>
      </section>
    </>
  );
}
