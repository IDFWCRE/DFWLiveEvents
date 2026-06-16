import type { EventCategory } from "@/types/event";

export const categories: EventCategory[] = ["Music", "Comedy"];

export function formatEventDate(dateTime: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago"
  }).format(new Date(dateTime));
}
