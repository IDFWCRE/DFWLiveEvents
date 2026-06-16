"use client";

import { useMemo, useState } from "react";
import { cities } from "@/lib/cities";
import { categories } from "@/lib/events";
import type { Event, EventCategory } from "@/types/event";
import { EventCard } from "./EventCard";

type DateFilter = "today" | "week" | "month" | "all";
type CategoryFilter = EventCategory | "All";

interface EventDirectoryProps {
  events: Event[];
  initialCity?: string;
  title?: string;
}

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

export function EventDirectory({ events, initialCity = "All", title = "Upcoming Events" }: EventDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [cityFilter, setCityFilter] = useState(initialCity);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");

  const filteredEvents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return events.filter((event) => {
      const matchesSearch =
        !search ||
        event.name.toLowerCase().includes(search) ||
        event.venue.name.toLowerCase().includes(search);
      const matchesCity = cityFilter === "All" || event.city === cityFilter;
      const matchesCategory = categoryFilter === "All" || event.category === categoryFilter;
      return matchesSearch && matchesCity && matchesCategory && matchesDateFilter(event.dateTime, dateFilter);
    });
  }, [categoryFilter, cityFilter, dateFilter, events, searchTerm]);

  return (
    <section aria-labelledby="events-heading">
      <div className="controls">
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
          {[
            ["today", "Today"],
            ["week", "This Week"],
            ["month", "This Month"],
            ["all", "All Upcoming"]
          ].map(([value, label]) => (
            <button
              className={`filter-button ${dateFilter === value ? "active" : ""}`}
              key={value}
              type="button"
              aria-pressed={dateFilter === value}
              onClick={() => setDateFilter(value as DateFilter)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="filter-row">
          <span className="filter-label">City</span>
          <div className="filter-group" role="group" aria-label="Filter events by city">
            {["All", ...cities.map((city) => city.name)].map((city) => (
              <button
                className={`filter-button ${cityFilter === city ? "active" : ""}`}
                key={city}
                type="button"
                aria-pressed={cityFilter === city}
                onClick={() => setCityFilter(city)}
              >
                {city === "All" ? "All DFW" : city}
              </button>
            ))}
          </div>
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
                onClick={() => setCategoryFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="results-meta">
        <h2 id="events-heading">{title}</h2>
        <span className="result-count">
          {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"}
        </span>
      </div>

      {filteredEvents.length ? (
        <div className="event-grid">
          {filteredEvents.map((event) => (
            <EventCard event={event} key={event.id} />
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
