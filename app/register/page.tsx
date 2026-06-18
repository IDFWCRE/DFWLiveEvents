import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { registerAction } from "@/lib/auth/actions";

type RegisterSearchParams = {
  next?: string;
  error?: string;
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<RegisterSearchParams> }) {
  const params = await searchParams;
  const next = params.next || "/account";

  return (
    <>
      <PageHero
        eyebrow="Register"
        title={
          <>
            Create your <span className="accent">DFW account.</span>
          </>
        }
        copy="Buyer accounts can continue to ticket partners. Reseller accounts start with a pending approval flow."
      />
      <section className="detail-panel stack">
        <h2 className="section-title">Register</h2>
        {params.error ? <p className="auth-message auth-error">{params.error}</p> : null}
        <form className="auth-form" action={registerAction}>
          <input type="hidden" name="next" value={next} />
          <label>
            Full name
            <input className="admin-input" type="text" name="full_name" required />
          </label>
          <label>
            Email
            <input className="admin-input" type="email" name="email" required />
          </label>
          <label>
            Password
            <input className="admin-input" type="password" name="password" minLength={6} required />
          </label>
          <fieldset className="auth-options">
            <legend>Account type</legend>
            <label><input type="radio" name="account_type" value="buyer" defaultChecked /> Buyer</label>
            <label><input type="radio" name="account_type" value="reseller" /> Reseller</label>
          </fieldset>
          <button className="primary-button" type="submit">Create Account</button>
        </form>
        <p className="muted">
          Already registered? <Link className="text-link" href={`/login?next=${encodeURIComponent(next)}`}>Login</Link>.
        </p>
      </section>
    </>
  );
}
