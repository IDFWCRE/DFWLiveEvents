import { notFound } from "next/navigation";
import { EventDirectory } from "@/components/EventDirectory";
import { PageHero } from "@/components/PageHero";
import { getCityBySlug } from "@/lib/cities";
import { events, getEventsByCity } from "@/lib/events";
import type { CitySlug } from "@/types/event";

interface CityLandingPageProps {
  citySlug: CitySlug;
}

export function CityLandingPage({ citySlug }: CityLandingPageProps) {
  const city = getCityBySlug(citySlug);
  if (!city) {
    notFound();
  }

  const cityEvents = getEventsByCity(citySlug);
  const directoryEvents = cityEvents.length ? events : [];

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
      <EventDirectory events={directoryEvents} initialCity={city.name} title={`${city.name} Events`} />
    </>
  );
}
