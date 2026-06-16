import type { CitySlug } from "@/types/event";

export interface City {
  name: string;
  slug: CitySlug;
  path: string;
  description: string;
}

export const cities: City[] = [
  {
    name: "Dallas",
    slug: "dallas",
    path: "/dallas",
    description: "Big-room concerts, comedy nights, and arena events in the heart of Dallas."
  },
  {
    name: "Fort Worth",
    slug: "fort-worth",
    path: "/fort-worth",
    description: "Stockyards shows, theater nights, and live music across Cowtown."
  },
  {
    name: "Arlington",
    slug: "arlington",
    path: "/arlington",
    description: "Stadium events, touring acts, and weekend entertainment between Dallas and Fort Worth."
  },
  {
    name: "Denton",
    slug: "denton",
    path: "/denton",
    description: "Independent music, comedy rooms, and college-town nightlife."
  },
  {
    name: "Irving",
    slug: "irving",
    path: "/irving",
    description: "Las Colinas concerts, intimate venues, and family-friendly nights out."
  },
  {
    name: "Grand Prairie",
    slug: "grand-prairie",
    path: "/grand-prairie",
    description: "Theater, arena, and amphitheater events in Grand Prairie."
  },
  {
    name: "Plano",
    slug: "plano",
    path: "/plano",
    description: "North Dallas suburban live events, music rooms, and comedy showcases."
  },
  {
    name: "Frisco",
    slug: "frisco",
    path: "/frisco",
    description: "Sports-adjacent entertainment, concerts, and family events in Frisco."
  },
  {
    name: "McKinney",
    slug: "mckinney",
    path: "/mckinney",
    description: "Historic square shows, local performers, and community event nights."
  }
];

export function getCityBySlug(slug: string) {
  return cities.find((city) => city.slug === slug);
}
