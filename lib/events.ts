import type { CitySlug, Event, EventCategory, Venue } from "@/types/event";

export const venues: Venue[] = [
  {
    id: "american-airlines-center",
    name: "American Airlines Center",
    slug: "american-airlines-center",
    city: "Dallas",
    address: "2500 Victory Ave, Dallas, TX",
    capacity: 20000
  },
  {
    id: "bomb-factory",
    name: "The Factory in Deep Ellum",
    slug: "the-factory-in-deep-ellum",
    city: "Dallas",
    address: "2713 Canton St, Dallas, TX",
    capacity: 4300
  },
  {
    id: "dickies-arena",
    name: "Dickies Arena",
    slug: "dickies-arena",
    city: "Fort Worth",
    address: "1911 Montgomery St, Fort Worth, TX",
    capacity: 14000
  },
  {
    id: "tannahills",
    name: "Tannahill's Music Hall",
    slug: "tannahills-music-hall",
    city: "Fort Worth",
    address: "122 E Exchange Ave, Fort Worth, TX",
    capacity: 1000
  },
  {
    id: "texas-trust-cu-theatre",
    name: "Texas Trust CU Theatre",
    slug: "texas-trust-cu-theatre",
    city: "Grand Prairie",
    address: "1001 Performance Pl, Grand Prairie, TX",
    capacity: 6350
  },
  {
    id: "levitt-pavilion",
    name: "Levitt Pavilion Arlington",
    slug: "levitt-pavilion-arlington",
    city: "Arlington",
    address: "100 W Abram St, Arlington, TX"
  },
  {
    id: "rubber-gloves",
    name: "Rubber Gloves Rehearsal Studios",
    slug: "rubber-gloves-rehearsal-studios",
    city: "Denton",
    address: "411 E Sycamore St, Denton, TX"
  },
  {
    id: "toyota-music-factory",
    name: "Toyota Music Factory",
    slug: "toyota-music-factory",
    city: "Irving",
    address: "316 W Las Colinas Blvd, Irving, TX"
  },
  {
    id: "legacy-hall",
    name: "Legacy Hall",
    slug: "legacy-hall",
    city: "Plano",
    address: "7800 Windrose Ave, Plano, TX"
  },
  {
    id: "frisco-discovery-center",
    name: "Frisco Discovery Center",
    slug: "frisco-discovery-center",
    city: "Frisco",
    address: "8004 Dallas Pkwy, Frisco, TX"
  },
  {
    id: "mckinney-performing-arts-center",
    name: "McKinney Performing Arts Center",
    slug: "mckinney-performing-arts-center",
    city: "McKinney",
    address: "111 N Tennessee St, McKinney, TX"
  }
];

const venueBySlug = Object.fromEntries(venues.map((venue) => [venue.slug, venue]));

function venue(slug: string): Venue {
  const foundVenue = venueBySlug[slug];
  if (!foundVenue) {
    throw new Error(`Missing placeholder venue: ${slug}`);
  }
  return foundVenue;
}

function eventImage(seed: string) {
  return `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=1200&q=80`;
}

export const events: Event[] = [
  {
    id: "1",
    slug: "neon-skyline-festival",
    name: "Neon Skyline Festival",
    image: eventImage("1501386761578-eac5c94b800a"),
    dateTime: "2026-06-16T20:00:00-05:00",
    venue: venue("american-airlines-center"),
    city: "Dallas",
    citySlug: "dallas",
    category: "Music",
    description: "A high-energy night of pop, dance, and indie headliners in Victory Park.",
    ticketUrl: "#"
  },
  {
    id: "2",
    slug: "cowtown-summer-sessions",
    name: "Cowtown Summer Sessions",
    image: eventImage("1493225457124-a3eb161ffa5f"),
    dateTime: "2026-06-18T19:30:00-05:00",
    venue: venue("tannahills-music-hall"),
    city: "Fort Worth",
    citySlug: "fort-worth",
    category: "Music",
    description: "Texas songwriters, roots rock, and a packed Stockyards crowd.",
    ticketUrl: "#"
  },
  {
    id: "3",
    slug: "deep-ellum-late-showcase",
    name: "Deep Ellum Late Showcase",
    image: eventImage("1516280440614-37939bbacd81"),
    dateTime: "2026-06-20T21:00:00-05:00",
    venue: venue("the-factory-in-deep-ellum"),
    city: "Dallas",
    citySlug: "dallas",
    category: "Music",
    description: "Three touring bands and one local opener take over Deep Ellum.",
    ticketUrl: "#"
  },
  {
    id: "4",
    slug: "north-texas-comedy-night",
    name: "North Texas Comedy Night",
    image: eventImage("1527224857830-43a7acc85260"),
    dateTime: "2026-06-22T19:00:00-05:00",
    venue: venue("dickies-arena"),
    city: "Fort Worth",
    citySlug: "fort-worth",
    category: "Comedy",
    description: "A touring lineup of stand-up comics with sharp local hosts.",
    ticketUrl: "#"
  },
  {
    id: "5",
    slug: "arlington-acoustic-lawn",
    name: "Arlington Acoustic Lawn",
    image: eventImage("1501612780327-45045538702b"),
    dateTime: "2026-06-24T18:30:00-05:00",
    venue: venue("levitt-pavilion-arlington"),
    city: "Arlington",
    citySlug: "arlington",
    category: "Music",
    description: "Open-air acoustic sets and food trucks in downtown Arlington.",
    ticketUrl: "#"
  },
  {
    id: "6",
    slug: "denton-indie-bill",
    name: "Denton Indie Bill",
    image: eventImage("1514525253161-7a46d19cd819"),
    dateTime: "2026-06-25T20:00:00-05:00",
    venue: venue("rubber-gloves-rehearsal-studios"),
    city: "Denton",
    citySlug: "denton",
    category: "Music",
    description: "Denton's loud, loose, and lovable indie scene on one bill.",
    ticketUrl: "#"
  },
  {
    id: "7",
    slug: "las-colinas-laughs",
    name: "Las Colinas Laughs",
    image: eventImage("1531058020387-3be344556be6"),
    dateTime: "2026-06-27T20:00:00-05:00",
    venue: venue("toyota-music-factory"),
    city: "Irving",
    citySlug: "irving",
    category: "Comedy",
    description: "A polished comedy showcase in the heart of Las Colinas.",
    ticketUrl: "#"
  },
  {
    id: "8",
    slug: "grand-prairie-arena-rock",
    name: "Grand Prairie Arena Rock",
    image: eventImage("1506157786151-b8491531f063"),
    dateTime: "2026-06-29T19:30:00-05:00",
    venue: venue("texas-trust-cu-theatre"),
    city: "Grand Prairie",
    citySlug: "grand-prairie",
    category: "Music",
    description: "Classic arena hooks, guitar anthems, and a full summer stage show.",
    ticketUrl: "#"
  },
  {
    id: "9",
    slug: "plano-patio-concert",
    name: "Plano Patio Concert",
    image: eventImage("1485579149621-3123dd979885"),
    dateTime: "2026-07-03T19:00:00-05:00",
    venue: venue("legacy-hall"),
    city: "Plano",
    citySlug: "plano",
    category: "Music",
    description: "A relaxed Friday night concert with local food hall energy.",
    ticketUrl: "#"
  },
  {
    id: "10",
    slug: "frisco-family-comedy-hour",
    name: "Frisco Family Comedy Hour",
    image: eventImage("1515168833906-d2a3b82b1a48"),
    dateTime: "2026-07-05T17:30:00-05:00",
    venue: venue("frisco-discovery-center"),
    city: "Frisco",
    citySlug: "frisco",
    category: "Comedy",
    description: "Clean comedy, early showtime, and an easy family night out.",
    ticketUrl: "#"
  },
  {
    id: "11",
    slug: "mckinney-square-songs",
    name: "McKinney Square Songs",
    image: eventImage("1507874457470-272b3c8d8ee2"),
    dateTime: "2026-07-08T19:00:00-05:00",
    venue: venue("mckinney-performing-arts-center"),
    city: "McKinney",
    citySlug: "mckinney",
    category: "Music",
    description: "Songwriters and storytellers inside McKinney's historic courthouse theater.",
    ticketUrl: "#"
  }
];

export const categories: EventCategory[] = ["Music", "Comedy"];

export function getEventBySlug(slug: string) {
  return events.find((event) => event.slug === slug);
}

export function getVenueBySlug(slug: string) {
  return venues.find((item) => item.slug === slug);
}

export function getEventsByCity(citySlug: CitySlug) {
  return events.filter((event) => event.citySlug === citySlug);
}

export function getEventsByVenue(venueSlug: string) {
  return events.filter((event) => event.venue.slug === venueSlug);
}

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
