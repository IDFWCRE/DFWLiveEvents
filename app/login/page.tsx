import { PageHero } from "@/components/PageHero";

export default function LoginPage() {
  return (
    <>
      <PageHero
        eyebrow="Accounts"
        title={
          <>
            Login and registration <span className="accent">coming soon.</span>
          </>
        }
        copy="Future buyer and seller accounts will support saved events, listing tools, and marketplace workflows."
      />
      <section className="detail-panel stack">
        <h2 className="section-title">No Auth Yet</h2>
        <p className="muted">
          Authentication is intentionally not enabled in this phase. This page reserves the public account entry point
          for a later release.
        </p>
      </section>
    </>
  );
}
