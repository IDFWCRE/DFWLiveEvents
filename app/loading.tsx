import { DataState } from "@/components/DataState";

export default function HomeLoading() {
  return <DataState title="Loading DFW Live Events" message="Fetching featured events from Supabase..." />;
}
