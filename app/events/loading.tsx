import { DataState } from "@/components/DataState";

export default function EventsLoading() {
  return <DataState title="Loading events" message="Fetching upcoming events from Supabase..." />;
}
