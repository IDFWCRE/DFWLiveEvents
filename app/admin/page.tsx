import { PageHero } from "@/components/PageHero";
import { getImportWindow } from "@/lib/import/window";
import { getActiveSourceImportTargets, type SourceImportTarget } from "@/lib/import/source-targets";

function envStatus(name: string) {
  return process.env[name] ? "Yes" : "No";
}

async function loadTargets() {
  try {
    return await getActiveSourceImportTargets();
  } catch {
    return [] as SourceImportTarget[];
  }
}

export default async function AdminPage() {
  const importWindow = getImportWindow();
  const targets = await loadTargets();
  const ticketmasterEnvRows = [
    ["IMPORT_WINDOW_DAYS", envStatus("IMPORT_WINDOW_DAYS")],
    ["CRON_SECRET", envStatus("CRON_SECRET")],
    ["TICKETMASTER_API_KEY", envStatus("TICKETMASTER_API_KEY")],
    ["SUPABASE_SERVICE_ROLE_KEY", envStatus("SUPABASE_SERVICE_ROLE_KEY")],
    ["ADMIN_IMPORT_TOKEN", envStatus("ADMIN_IMPORT_TOKEN")],
    ["NEXT_PUBLIC_SUPABASE_URL", envStatus("NEXT_PUBLIC_SUPABASE_URL")],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", envStatus("NEXT_PUBLIC_SUPABASE_ANON_KEY")]
  ];
  const eventbriteEnvRows = [
    ["IMPORT_WINDOW_DAYS", envStatus("IMPORT_WINDOW_DAYS")],
    ["CRON_SECRET", envStatus("CRON_SECRET")],
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
        <h2 className="section-title">Import Window</h2>
        <p className="muted">
          Import window: {importWindow.label} ({importWindow.startDate} through {importWindow.endDate})
        </p>
        <p className="muted">Cron endpoint:</p>
        <pre className="code-block">/api/cron/import-events</pre>
      </section>
      <section className="detail-panel stack" style={{ marginTop: 28 }}>
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
      <section className="detail-panel stack" style={{ marginTop: 28 }}>
        <h2 className="section-title">Active Source Import Targets</h2>
        {targets.length ? (
          <div className="env-table" aria-label="Active source import targets">
            {targets.map((target) => (
              <div className="env-row" key={target.id}>
                <span>
                  {target.source_name} / {target.target_type}: {target.label || target.target_value}
                </span>
                <strong>{target.city || "Active"}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            No active source targets found or service-role access is not configured. Eventbrite can still use env-based
            targets.
          </p>
        )}
        <p className="muted">Combined local import:</p>
        <pre className="code-block">npm run import:all</pre>
      </section>
    </>
  );
}
