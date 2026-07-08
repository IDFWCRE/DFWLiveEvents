import { DataState } from "@/components/DataState";
import { EventDirectory } from "@/components/EventDirectory";
import { PageHero } from "@/components/PageHero";
import { getCurrentUserWithProfile } from "@/lib/auth/profiles";
import { getUpcomingEvents } from "@/lib/supabase/queries";
import { getEventSubcategories, type EventSubcategorySlug } from "@/lib/taxonomy";
import type { EventCategory } from "@/types/event";

type EventsSearchParams = {
  q?: string;
  city?: string;
  category?: string;
  subcategory?: string;
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

function getInitialSubcategory(category: EventCategory | "All", subcategory?: string): EventSubcategorySlug | undefined {
  if (!subcategory) return undefined;
  const categorySlug = category === "Music" ? "music" : category === "Comedy" ? "comedy" : null;
  if (!categorySlug) return undefined;
  return getEventSubcategories(categorySlug).some((item) => item.slug === subcategory)
    ? (subcategory as EventSubcategorySlug)
    : undefined;
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<EventsSearchParams> }) {
  const params = await searchParams;
  const { user } = await getCurrentUserWithProfile();
  const { data: events, error } = await getUpcomingEvents();
  const initialCity = params.city || "All";
  const initialCategory = getInitialCategory(params.category);
  const initialSubcategory = getInitialSubcategory(initialCategory, params.subcategory);
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
          initialSubcategory={initialSubcategory}
          initialDate={initialDate}
          initialSearch={initialSearch}
          isLoggedIn={Boolean(user)}
        />
      )}
    </>
  );
}
