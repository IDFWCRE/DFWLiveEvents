import Link from "next/link";
import { DataState } from "@/components/DataState";
import { EventDirectory } from "@/components/EventDirectory";
import { PageHero } from "@/components/PageHero";
import { cities } from "@/lib/cities";
import { getCurrentUserWithProfile } from "@/lib/auth/profiles";
import { getFeaturedEvents } from "@/lib/supabase/queries";

export default async function HomePage() {
  const { user } = await getCurrentUserWithProfile();
  const { data: events, error } = await getFeaturedEvents();

  return (
    <>
      <PageHero
        eyebrow="Your local live events guide"
        title={
          <>
            Find your next <span className="accent">live show.</span>
          </>
        }
        copy="Discover concerts, comedy nights, venues, city guides, partner ticket links, and manually fulfilled DFW-owned ticket requests."
      />
      {error ? (
        <DataState title="Supabase setup needed" message={error} />
      ) : (
        <EventDirectory events={events} isLoggedIn={Boolean(user)} mode="link" title="Featured Events" />
      )}

      <section className="stack" style={{ marginTop: 48 }}>
        <h2 className="section-title">Explore By City</h2>
        <div className="city-grid">
          {cities.map((city) => (
            <Link className="info-card" href={city.path} key={city.slug}>
              <span className="pill">{city.name}</span>
              <h3>{city.name} Events</h3>
              <p className="muted">{city.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
