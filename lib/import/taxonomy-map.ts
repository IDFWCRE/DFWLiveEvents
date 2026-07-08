import { eventSubcategorySlugs, type EventCategorySlug, type EventSubcategorySlug } from "@/lib/taxonomy";

export type ImportableEventCategorySlug = Extract<EventCategorySlug, "music" | "comedy">;

export type ImportTaxonomyResult = {
  categorySlug: ImportableEventCategorySlug;
  subcategorySlug: EventSubcategorySlug | null;
};

type KeywordRule = {
  slug: EventSubcategorySlug;
  terms: string[];
};

const musicRules: KeywordRule[] = [
  { slug: "jazz", terms: ["jazz", "blues"] },
  { slug: "rock", terms: ["rock", "alternative", "metal", "punk"] },
  { slug: "country", terms: ["country", "americana", "bluegrass"] },
  { slug: "hip-hop-rap", terms: ["hip-hop", "hip hop", "rap"] },
  { slug: "r-and-b-soul", terms: ["r&b", "r and b", "rnb", "soul", "funk"] },
  { slug: "electronic-edm", terms: ["electronic", "edm", "dance", "house", "techno"] },
  { slug: "latin", terms: ["latin", "reggaeton", "salsa", "banda", "mariachi"] },
  { slug: "classical", terms: ["classical", "orchestra", "symphony", "opera"] },
  { slug: "singer-songwriter", terms: ["singer-songwriter", "singer songwriter", "acoustic", "folk"] },
  { slug: "dj-nightlife", terms: ["dj", "club", "nightlife"] },
  { slug: "tribute-cover-band", terms: ["tribute", "cover band"] },
  { slug: "festival", terms: ["festival"] }
];

const comedyRules: KeywordRule[] = [
  { slug: "stand-up", terms: ["stand-up", "standup", "comedian"] },
  { slug: "improv", terms: ["improv"] },
  { slug: "open-mic", terms: ["open mic", "open-mic"] },
  { slug: "sketch", terms: ["sketch"] },
  { slug: "podcast-live-recording", terms: ["podcast", "live recording"] },
  { slug: "variety", terms: ["variety"] },
  { slug: "family-comedy", terms: ["family"] }
];

const musicTerms = ["music", "concert", "band", "singer", "songwriter", "artist", "tour"];
const comedyTerms = ["comedy", "comedian", "stand-up", "standup", "improv", "open mic"];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(values: Array<string | null | undefined>) {
  return values.map((value) => value?.trim()).filter((value): value is string => Boolean(value));
}

function textIncludes(text: string, term: string) {
  return text.includes(normalize(term));
}

function isAllowedSubcategory(slug: EventSubcategorySlug) {
  return (eventSubcategorySlugs as string[]).includes(slug);
}

function matchSubcategory(categorySlug: ImportableEventCategorySlug, text: string) {
  const rules = categorySlug === "music" ? musicRules : comedyRules;
  return rules.find((rule) => isAllowedSubcategory(rule.slug) && rule.terms.some((term) => textIncludes(text, term)))?.slug || null;
}

export function mapImportTaxonomy(labels: string[], fallbackTextParts: Array<string | null | undefined>): ImportTaxonomyResult | null {
  const labelText = compact(labels).map(normalize).join(" ");
  const fallbackText = compact(fallbackTextParts).map(normalize).join(" ");
  const allText = [labelText, fallbackText].filter(Boolean).join(" ");

  const categorySlug: ImportableEventCategorySlug | null =
    comedyTerms.some((term) => textIncludes(allText, term))
      ? "comedy"
      : musicTerms.some((term) => textIncludes(allText, term))
        ? "music"
        : null;

  if (!categorySlug) return null;

  return {
    categorySlug,
    subcategorySlug: matchSubcategory(categorySlug, allText)
  };
}
