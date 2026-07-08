export const eventTaxonomy = [
  {
    slug: "music",
    label: "Music",
    subcategories: [
      { slug: "jazz", label: "Jazz" },
      { slug: "rock", label: "Rock" },
      { slug: "country", label: "Country" },
      { slug: "hip-hop-rap", label: "Hip-Hop / Rap" },
      { slug: "r-and-b-soul", label: "R&B / Soul" },
      { slug: "electronic-edm", label: "Electronic / EDM" },
      { slug: "latin", label: "Latin" },
      { slug: "classical", label: "Classical" },
      { slug: "singer-songwriter", label: "Singer-Songwriter" },
      { slug: "dj-nightlife", label: "DJ / Nightlife" },
      { slug: "tribute-cover-band", label: "Tribute / Cover Band" },
      { slug: "festival", label: "Festival" }
    ]
  },
  {
    slug: "comedy",
    label: "Comedy",
    subcategories: [
      { slug: "stand-up", label: "Stand-up" },
      { slug: "improv", label: "Improv" },
      { slug: "open-mic", label: "Open Mic" },
      { slug: "sketch", label: "Sketch" },
      { slug: "podcast-live-recording", label: "Podcast / Live Recording" },
      { slug: "variety", label: "Variety" },
      { slug: "family-comedy", label: "Family Comedy" }
    ]
  },
  {
    slug: "sports",
    label: "Sports",
    subcategories: [
      { slug: "baseball", label: "Baseball" },
      { slug: "football", label: "Football" },
      { slug: "basketball", label: "Basketball" },
      { slug: "hockey", label: "Hockey" },
      { slug: "soccer", label: "Soccer" },
      { slug: "combat-sports", label: "Combat Sports" },
      { slug: "racing", label: "Racing" },
      { slug: "college-sports", label: "College Sports" },
      { slug: "wrestling", label: "Wrestling" },
      { slug: "esports", label: "Esports" }
    ]
  }
] as const;

export type EventTaxonomy = typeof eventTaxonomy;
export type EventCategoryDefinition = EventTaxonomy[number];
export type EventCategorySlug = EventCategoryDefinition["slug"];
export type EventCategoryLabel = EventCategoryDefinition["label"];
export type EventSubcategoryDefinition = EventCategoryDefinition["subcategories"][number];
export type EventSubcategorySlug = EventSubcategoryDefinition["slug"];
export type EventSubcategoryLabel = EventSubcategoryDefinition["label"];

export const eventCategorySlugs = eventTaxonomy.map((category) => category.slug) as EventCategorySlug[];

export const eventSubcategorySlugs = eventTaxonomy.flatMap((category) =>
  category.subcategories.map((subcategory) => subcategory.slug)
) as EventSubcategorySlug[];

export function getEventCategory(slug: EventCategorySlug) {
  return eventTaxonomy.find((category) => category.slug === slug);
}

export function getEventSubcategories(categorySlug: EventCategorySlug) {
  return getEventCategory(categorySlug)?.subcategories || [];
}

export function getEventSubcategory(subcategorySlug: EventSubcategorySlug) {
  for (const category of eventTaxonomy) {
    const subcategory = category.subcategories.find((item) => item.slug === subcategorySlug);
    if (subcategory) return subcategory;
  }
  return undefined;
}
