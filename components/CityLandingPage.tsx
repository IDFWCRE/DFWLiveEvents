import { notFound } from "next/navigation";
import { EventDirectory } from "@/components/EventDirectory";
import { PageHero } from "@/components/PageHero";
import { getCityBySlug } from "@/lib/cities";
import { getUpcomingEvents } from "@/lib/supabase/queries";
import type { CitySlug } from "@/types/event";
import { DataState } from "./DataState";

interface CityLandingPageProps {
  citySlug: CitySlug;
}

export async function CityLandingPage({ citySlug }: CityLandingPageProps) {
  const city = getCityBySlug(citySlug);
  if (!city) {
    notFound();
  }

  const { data: events, error } = await getUpcomingEvents();

  return (
    <>
      <PageHero
        eyebrow={`${city.name} events`}
        title={
          <>
            Live events in <span className="accent">{city.name}.</span>
          </>
        }
        copy={city.description}
      />
      {error ? (
        <DataState title="Supabase setup needed" message={error} />
      ) : (
        <EventDirectory events={events} initialCity={city.name} title={`${city.name} Events`} />
      )}
    </>
  );
}
