import { AdminDashboard } from "@/components/AdminDashboard";
import { PageHero } from "@/components/PageHero";
import { getImportWindow } from "@/lib/import/window";

function envStatus(name: string) {
  return process.env[name] ? "Yes" : "No";
}

export default function AdminPage() {
  const importWindow = getImportWindow();
  const envRows: Array<[string, string]> = [
    ["NEXT_PUBLIC_SUPABASE_URL", envStatus("NEXT_PUBLIC_SUPABASE_URL")],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", envStatus("NEXT_PUBLIC_SUPABASE_ANON_KEY")],
    ["SUPABASE_SERVICE_ROLE_KEY", envStatus("SUPABASE_SERVICE_ROLE_KEY")],
    ["ADMIN_IMPORT_TOKEN", envStatus("ADMIN_IMPORT_TOKEN")],
    ["CRON_SECRET", envStatus("CRON_SECRET")],
    ["TICKETMASTER_API_KEY", envStatus("TICKETMASTER_API_KEY")],
    ["EVENTBRITE_PRIVATE_TOKEN", envStatus("EVENTBRITE_PRIVATE_TOKEN")],
    ["IMPORT_WINDOW_DAYS", envStatus("IMPORT_WINDOW_DAYS")]
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
        copy="Operational dashboard for protected imports, source targets, and import history. Secrets stay server-side."
      />
      <AdminDashboard
        envRows={envRows}
        importWindowLabel={importWindow.label}
        importWindowRange={`${importWindow.startDate} through ${importWindow.endDate}`}
      />
    </>
  );
}
