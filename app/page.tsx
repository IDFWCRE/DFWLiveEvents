import Link from "next/link";
import { EventDirectory } from "@/components/EventDirectory";
import { PageHero } from "@/components/PageHero";
import { cities } from "@/lib/cities";
import { events } from "@/lib/events";

export default function HomePage() {
  return (
    <>
      <PageHero
        eyebrow="Your local live events guide"
        title={
          <>
            Find your next <span className="accent">live show.</span>
          </>
        }
        copy="Discover concerts, comedy nights, venues, and city guides across Dallas-Fort Worth."
      />
      <EventDirectory events={events} title="Featured Events" />

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
