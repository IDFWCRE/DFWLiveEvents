import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/AdminDashboard";
import { PageHero } from "@/components/PageHero";
import { requireAdminUser } from "@/lib/auth/profiles";
import { getImportWindow } from "@/lib/import/window";

function envStatus(name: string) {
  return process.env[name] ? "Yes" : "No";
}

export default async function AdminPage() {
  const admin = await requireAdminUser();

  if (!admin.user) {
    redirect("/adminlogin?next=/admin");
  }

  if (!admin.isAdmin) {
    redirect("/login?message=This%20account%20does%20not%20have%20admin%20access.");
  }

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
      <section className="detail-panel stack" style={{ marginBottom: 28 }}>
        <h2 className="section-title">Logged-In Admin</h2>
        <p className="muted">
          Signed in as {admin.user.email}. Dashboard actions use your admin session. `ADMIN_IMPORT_TOKEN` still works for
          curl/API testing.
        </p>
      </section>
      <AdminDashboard
        envRows={envRows}
        importWindowLabel={importWindow.label}
        importWindowRange={`${importWindow.startDate} through ${importWindow.endDate}`}
        isAdminSession
      />
    </>
  );
}
