import { DataState } from "@/components/DataState";
import { EventDirectory } from "@/components/EventDirectory";
import { PageHero } from "@/components/PageHero";
import { getCurrentUserWithProfile } from "@/lib/auth/profiles";
import { getUpcomingEvents } from "@/lib/supabase/queries";
import type { EventCategory } from "@/types/event";

type EventsSearchParams = {
  q?: string;
  city?: string;
  category?: string;
  date?: string;
};

function getInitialCategory(category?: string): EventCategory | "All" {
  if (category?.toLowerCase() === "music") return "Music";
  if (category?.toLowerCase() === "comedy") return "Comedy";
  return "All";
}

function getInitialDate(date?: string) {
  if (date === "today") return "today";
  if (date === "this-week") return "week";
  if (date === "this-month") return "month";
  return "all";
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<EventsSearchParams> }) {
  const params = await searchParams;
  const { user } = await getCurrentUserWithProfile();
  const { data: events, error } = await getUpcomingEvents();
  const initialCity = params.city || "All";
  const initialCategory = getInitialCategory(params.category);
  const initialDate = getInitialDate(params.date);
  const initialSearch = params.q || "";

  return (
    <>
      <PageHero
        eyebrow="All upcoming events"
        title={
          <>
            Browse <span className="accent">DFW events.</span>
          </>
        }
        copy="Filter seeded marketplace inventory by date, city, and category."
      />
      {error ? (
        <DataState title="Supabase setup needed" message={error} />
      ) : (
        <EventDirectory
          events={events}
          initialCategory={initialCategory}
          initialCity={initialCity}
          initialDate={initialDate}
          initialSearch={initialSearch}
          isLoggedIn={Boolean(user)}
        />
      )}
    </>
  );
}
