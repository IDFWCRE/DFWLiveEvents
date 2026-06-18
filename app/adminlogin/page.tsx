import { redirect } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { adminLoginAction } from "@/lib/auth/actions";
import { requireAdminUser } from "@/lib/auth/profiles";

type AdminLoginSearchParams = {
  next?: string;
  error?: string;
  message?: string;
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<AdminLoginSearchParams> }) {
  const params = await searchParams;
  const next = params.next && params.next.startsWith("/") ? params.next : "/admin";
  const admin = await requireAdminUser();

  if (admin.isAdmin) {
    redirect(next);
  }

  return (
    <>
      <PageHero
        eyebrow="Admin"
        title={
          <>
            Admin <span className="accent">Login.</span>
          </>
        }
        copy="For DFW Live Events administrators only. Buyers and resellers should use the regular login page."
      />
      <section className="detail-panel stack">
        <h2 className="section-title">Admin Login</h2>
        {params.error ? <p className="auth-message auth-error">{params.error}</p> : null}
        {params.message ? <p className="auth-message auth-success">{params.message}</p> : null}
        <form className="auth-form" action={adminLoginAction}>
          <input type="hidden" name="next" value={next} />
          <label>
            Email
            <input className="admin-input" type="email" name="email" required />
          </label>
          <label>
            Password
            <input className="admin-input" type="password" name="password" required />
          </label>
          <button className="primary-button" type="submit">Login to Admin</button>
        </form>
      </section>
    </>
  );
}
