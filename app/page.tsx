import { DataState } from "@/components/DataState";
import { EventDirectory } from "@/components/EventDirectory";
import { PageHero } from "@/components/PageHero";
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
        <EventDirectory events={events} isLoggedIn={Boolean(user)} mode="link" showCityFilter={false} title="Featured Events" />
      )}
    </>
  );
}
