"use client";

import { DataState } from "@/components/DataState";

export default function HomeError() {
  return <DataState title="Events unavailable" message="Something went wrong while loading the homepage." />;
}
