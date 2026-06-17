import { PageHero } from "@/components/PageHero";

function envStatus(name: string) {
  return process.env[name] ? "Yes" : "No";
}

export default function AdminPage() {
  const ticketmasterEnvRows = [
    ["TICKETMASTER_API_KEY", envStatus("TICKETMASTER_API_KEY")],
    ["SUPABASE_SERVICE_ROLE_KEY", envStatus("SUPABASE_SERVICE_ROLE_KEY")],
    ["ADMIN_IMPORT_TOKEN", envStatus("ADMIN_IMPORT_TOKEN")],
    ["NEXT_PUBLIC_SUPABASE_URL", envStatus("NEXT_PUBLIC_SUPABASE_URL")],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", envStatus("NEXT_PUBLIC_SUPABASE_ANON_KEY")]
  ];
  const eventbriteEnvRows = [
    ["EVENTBRITE_PRIVATE_TOKEN", envStatus("EVENTBRITE_PRIVATE_TOKEN")],
    ["EVENTBRITE_ORGANIZATION_IDS", envStatus("EVENTBRITE_ORGANIZATION_IDS")],
    ["EVENTBRITE_VENUE_IDS", envStatus("EVENTBRITE_VENUE_IDS")],
    ["EVENTBRITE_EVENT_IDS", envStatus("EVENTBRITE_EVENT_IDS")],
    ["SUPABASE_SERVICE_ROLE_KEY", envStatus("SUPABASE_SERVICE_ROLE_KEY")],
    ["ADMIN_IMPORT_TOKEN", envStatus("ADMIN_IMPORT_TOKEN")]
  ];

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
        <h2 className="section-title">Ticketmaster Import</h2>
        <p className="muted">
          Server-side importer foundation for caching official Ticketmaster Music and Comedy events in Supabase.
        </p>
        <div className="env-table" aria-label="Required environment variable status">
          {ticketmasterEnvRows.map(([name, ready]) => (
            <div className="env-row" key={name}>
              <span>{name}</span>
              <strong>{ready}</strong>
            </div>
          ))}
        </div>
        <p className="muted">Run locally with:</p>
        <pre className="code-block">npm run import:ticketmaster</pre>
        <p className="muted">
          The public admin page does not expose an import button. Use the protected API route or local script.
        </p>
      </section>
      <section className="detail-panel stack" style={{ marginTop: 28 }}>
        <h2 className="section-title">Eventbrite Import</h2>
        <p className="muted">
          Server-side importer foundation for organization, venue, and individual Eventbrite event imports.
        </p>
        <div className="env-table" aria-label="Required Eventbrite environment variable status">
          {eventbriteEnvRows.map(([name, ready]) => (
            <div className="env-row" key={name}>
              <span>{name}</span>
              <strong>{ready}</strong>
            </div>
          ))}
        </div>
        <p className="muted">Run locally with:</p>
        <pre className="code-block">npm run import:eventbrite</pre>
        <p className="muted">
          At least one Eventbrite organization ID, venue ID, or event ID/URL is required. No public import button is
          exposed.
        </p>
      </section>
    </>
  );
}
