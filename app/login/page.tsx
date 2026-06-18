import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { loginAction } from "@/lib/auth/actions";

type LoginSearchParams = {
  next?: string;
  error?: string;
  message?: string;
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<LoginSearchParams> }) {
  const params = await searchParams;
  const next = params.next || "/account";

  return (
    <>
      <PageHero
        eyebrow="Accounts"
        title={
          <>
            Login to <span className="accent">buy tickets.</span>
          </>
        }
        copy="Create a free account or sign in to continue to Ticketmaster, Eventbrite, and other ticketing partners."
      />
      <section className="detail-panel stack">
        <h2 className="section-title">Login</h2>
        {params.error ? <p className="auth-message auth-error">{params.error}</p> : null}
        {params.message ? <p className="auth-message auth-success">{params.message}</p> : null}
        <form className="auth-form" action={loginAction}>
          <input type="hidden" name="next" value={next} />
          <label>
            Email
            <input className="admin-input" type="email" name="email" required />
          </label>
          <label>
            Password
            <input className="admin-input" type="password" name="password" required />
          </label>
          <button className="primary-button" type="submit">Login</button>
        </form>
        <p className="muted">
          New here? <Link className="text-link" href={`/register?next=${encodeURIComponent(next)}`}>Create an account</Link>.
        </p>
      </section>
    </>
  );
}
