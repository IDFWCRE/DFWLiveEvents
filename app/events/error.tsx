"use client";

import { DataState } from "@/components/DataState";

export default function EventsError() {
  return <DataState title="Events unavailable" message="Something went wrong while loading events." />;
}
