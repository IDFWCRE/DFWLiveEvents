"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { categories } from "@/lib/events";
import { getEventSubcategories, type EventCategorySlug, type EventSubcategorySlug } from "@/lib/taxonomy";
import type { Event, EventCategory } from "@/types/event";
import { EventCard } from "./EventCard";

type DateFilter = "today" | "week" | "month" | "all";
type CategoryFilter = EventCategory | "All";
type VisibleCategorySlug = Extract<EventCategorySlug, "music" | "comedy">;
type Mode = "filter" | "link";

interface EventDirectoryProps {
  events: Event[];
  initialCity?: string;
  initialCategory?: CategoryFilter;
  initialSubcategory?: EventSubcategorySlug;
  initialDate?: DateFilter;
  initialSearch?: string;
  mode?: Mode;
  title?: string;
  isLoggedIn?: boolean;
}

const dateFilterOptions: Array<[DateFilter, string, string]> = [
  ["today", "Today", "/events?date=today"],
  ["week", "This Week", "/events?date=this-week"],
  ["month", "This Month", "/events?date=this-month"],
  ["all", "All Upcoming", "/events"]
];

function getDallasToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Number(values.year), Number(values.month) - 1, Number(values.day));
}

function matchesDateFilter(dateTime: string, filter: DateFilter) {
  if (filter === "all") return true;

  const eventDate = new Date(dateTime);
  const today = getDallasToday();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  if (filter === "today") {
    return eventDate >= today && eventDate < tomorrow;
  }

  if (filter === "week") {
    const endOfWeek = new Date(today);
    const daysUntilSunday = 7 - today.getDay();
    endOfWeek.setDate(today.getDate() + daysUntilSunday);
    return eventDate >= today && eventDate < endOfWeek;
  }

  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return eventDate >= today && eventDate < nextMonth;
}

function getCategoryHref(category: CategoryFilter) {
  if (category === "All") return "/events";
  return `/events?category=${category.toLowerCase()}`;
}

function getSubcategoryHref(categorySlug: VisibleCategorySlug, subcategorySlug?: EventSubcategorySlug) {
  const params = new URLSearchParams({ category: categorySlug });
  if (subcategorySlug) params.set("subcategory", subcategorySlug);
  return `/events?${params.toString()}`;
}

function getCategorySlug(category: CategoryFilter): VisibleCategorySlug | null {
  if (category === "Music") return "music";
  if (category === "Comedy") return "comedy";
  return null;
}

function isSubcategoryForCategory(categorySlug: VisibleCategorySlug | null, subcategorySlug?: EventSubcategorySlug) {
  if (!categorySlug || !subcategorySlug) return false;
  return getEventSubcategories(categorySlug).some((subcategory) => subcategory.slug === subcategorySlug);
}

export function EventDirectory({
  events,
  initialCity = "All",
  initialCategory = "All",
  initialSubcategory,
  initialDate = "all",
  initialSearch = "",
  mode = "filter",
  title = "Upcoming Events",
  isLoggedIn = false
}: EventDirectoryProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [dateFilter, setDateFilter] = useState<DateFilter>(initialDate);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(initialCategory);
  const isLinkMode = mode === "link";
  const selectedCategorySlug = getCategorySlug(categoryFilter);
  const [subcategoryFilter, setSubcategoryFilter] = useState<EventSubcategorySlug | undefined>(
    isSubcategoryForCategory(selectedCategorySlug, initialSubcategory) ? initialSubcategory : undefined
  );
  const visibleSubcategories = selectedCategorySlug ? getEventSubcategories(selectedCategorySlug) : [];

  const filteredEvents = useMemo(() => {
    if (isLinkMode) return events;

    const search = searchTerm.trim().toLowerCase();
    return events.filter((event) => {
      const matchesSearch =
        !search ||
        event.name.toLowerCase().includes(search) ||
        event.venue.name.toLowerCase().includes(search);
      const matchesCity = initialCity === "All" || event.city === initialCity;
      const matchesCategory = categoryFilter === "All" || event.category === categoryFilter;
      const matchesSubcategory = !subcategoryFilter || event.subcategorySlug === subcategoryFilter;
      return matchesSearch && matchesCity && matchesCategory && matchesSubcategory && matchesDateFilter(event.dateTime, dateFilter);
    });
  }, [categoryFilter, dateFilter, events, initialCity, isLinkMode, searchTerm, subcategoryFilter]);

  function selectCategory(category: CategoryFilter) {
    if (isLinkMode) {
      router.push(getCategoryHref(category));
      return;
    }

    setCategoryFilter(category);
    const nextCategorySlug = getCategorySlug(category);
    if (!isSubcategoryForCategory(nextCategorySlug, subcategoryFilter)) {
      setSubcategoryFilter(undefined);
    }
  }

  function selectSubcategory(subcategorySlug?: EventSubcategorySlug) {
    if (!selectedCategorySlug) return;
    if (isLinkMode) {
      router.push(getSubcategoryHref(selectedCategorySlug, subcategorySlug));
      return;
    }

    setSubcategoryFilter(subcategorySlug);
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLinkMode) {
      const query = searchTerm.trim();
      router.push(query ? `/events?q=${encodeURIComponent(query)}` : "/events");
    }
  }

  return (
    <section aria-labelledby="events-heading">
      <form className="controls" onSubmit={submitSearch}>
        <label className="search-wrap">
          <span className="sr-only">Search events or venues</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m21 19.6-4.8-4.8a7.7 7.7 0 1 0-1.4 1.4l4.8 4.8 1.4-1.4ZM5 10.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Z" />
          </svg>
          <input
            className="search-input"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by event or venue..."
          />
        </label>

        <div className="filter-group" role="group" aria-label="Filter events by date">
          {dateFilterOptions.map(([value, label, href]) => (
            <button
              className={`filter-button ${dateFilter === value ? "active" : ""}`}
              key={value}
              type="button"
              aria-pressed={dateFilter === value}
              onClick={() => (isLinkMode ? router.push(href) : setDateFilter(value))}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="filter-row">
          <span className="filter-label">Category</span>
          <div className="filter-group" role="group" aria-label="Filter events by category">
            {(["All", ...categories] as CategoryFilter[]).map((category) => (
              <button
                className={`filter-button ${categoryFilter === category ? "active" : ""}`}
                key={category}
                type="button"
                aria-pressed={categoryFilter === category}
                onClick={() => selectCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {selectedCategorySlug ? (
          <div className="filter-row">
            <span className="filter-label">Subcategory</span>
            <div className="filter-group" role="group" aria-label={`Filter ${categoryFilter} events by subcategory`}>
              <button
                className={`filter-button ${!subcategoryFilter ? "active" : ""}`}
                type="button"
                aria-pressed={!subcategoryFilter}
                onClick={() => selectSubcategory()}
              >
                All {categoryFilter}
              </button>
              {visibleSubcategories.map((subcategory) => (
                <button
                  className={`filter-button ${subcategoryFilter === subcategory.slug ? "active" : ""}`}
                  key={subcategory.slug}
                  type="button"
                  aria-pressed={subcategoryFilter === subcategory.slug}
                  onClick={() => selectSubcategory(subcategory.slug)}
                >
                  {subcategory.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </form>

      <div className="results-meta">
        <h2 id="events-heading">{title}</h2>
        <span className="result-count">
          {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"}
        </span>
      </div>

      {filteredEvents.length ? (
        <div className="event-grid">
          {filteredEvents.map((event) => (
            <EventCard event={event} isLoggedIn={isLoggedIn} key={event.id} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No events found</h3>
          <p className="muted">Try a different city, category, date range, or search term.</p>
        </div>
      )}
    </section>
  );
}
