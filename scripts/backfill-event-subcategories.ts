import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import type { EventSubcategorySlug } from "../lib/taxonomy";

loadEnvConfig(process.cwd());

type EventRow = {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  category_slug: string | null;
  subcategory_slug: string | null;
  external_source: string | null;
  external_event_id: string | null;
  event_date: string | null;
};

type PlannedUpdate = {
  id: string;
  title: string;
  eventDate: string;
  source: string;
  externalEventId: string;
  categorySlug: "music" | "comedy";
  subcategorySlug: EventSubcategorySlug;
  reason: string;
};

const apply = process.argv.includes("--apply");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : null;

if (limit !== null && (!Number.isInteger(limit) || limit <= 0)) {
  throw new Error("--limit must be a positive integer");
}

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

function hasPhrase(text: string, phrases: string[]) {
  const paddedText = ` ${text} `;

  return phrases.some((phrase) => {
    const normalizedPhrase = normalize(phrase);
    if (!normalizedPhrase) return false;

    return paddedText.includes(` ${normalizedPhrase} `);
  });
}

function mapConservativeSubcategory(row: EventRow): { subcategorySlug: EventSubcategorySlug; reason: string } | null {
  const categorySlug = row.category_slug || row.category;
  const title = normalize(row.title || "");
  const description = normalize(row.description || "");

  if (!title) return null;

  if (categorySlug === "comedy") {
    if (hasPhrase(title, ["open mic", "open-mic", "test your mic"])) {
      return { subcategorySlug: "open-mic", reason: "title contains open mic/test your mic" };
    }

    if (hasPhrase(title, ["improv"])) {
      return { subcategorySlug: "improv", reason: "title contains improv" };
    }

    if (hasPhrase(title, ["family comedy", "family friendly comedy"])) {
      return { subcategorySlug: "family-comedy", reason: "title contains family comedy" };
    }

    if (hasPhrase(title, ["stand-up", "standup", "comedy night", "comedy tour", "comedian"])) {
      return { subcategorySlug: "stand-up", reason: "title clearly indicates stand-up comedy" };
    }

    return null;
  }

  if (categorySlug === "music") {
    if (hasPhrase(title, ["tribute to", "a tribute to", "tribute band", "cover band", "the experience"])) {
      return { subcategorySlug: "tribute-cover-band", reason: "title clearly indicates tribute/cover act" };
    }

    if (hasPhrase(title, ["festival", "fest"])) {
      return { subcategorySlug: "festival", reason: "title contains festival/fest" };
    }

    if (hasPhrase(title, ["dj ", " dj", "dj night", "club 90s", "dance party", "nightlife"])) {
      return { subcategorySlug: "dj-nightlife", reason: "title clearly indicates DJ/nightlife" };
    }

    if (hasPhrase(title, ["r and b", "rnb", "soul"])) {
      return { subcategorySlug: "r-and-b-soul", reason: "title clearly indicates R&B/soul" };
    }

    if (hasPhrase(title, ["hip hop", "hip-hop", "rapper", "rap "])) {
      return { subcategorySlug: "hip-hop-rap", reason: "title clearly indicates hip-hop/rap" };
    }

    if (hasPhrase(title, ["jazz jam", "smooth jazz", "jazz at", "jazz festival"])) {
      return { subcategorySlug: "jazz", reason: "title clearly indicates jazz" };
    }

    if (hasPhrase(title, ["banda", "mariachi", "norteño", "norteno", "grupo frontera", "salsa", "reggaeton"])) {
      return { subcategorySlug: "latin", reason: "title clearly indicates Latin music" };
    }

    if (hasPhrase(title, ["classical", "stars of the symphony", "the classical style"])) {
      return { subcategorySlug: "classical", reason: "title clearly indicates classical music" };
    }

    if (hasPhrase(title, ["acoustic", "singer songwriter", "singer-songwriter"])) {
      return { subcategorySlug: "singer-songwriter", reason: "title clearly indicates acoustic/singer-songwriter" };
    }

    if (hasPhrase(title, ["country night", "bluegrass", "honky tonk"])) {
      return { subcategorySlug: "country", reason: "title clearly indicates country/bluegrass" };
    }

    if (hasPhrase(description, ["scheduled support:"]) && hasPhrase(title, ["metal", "punk"])) {
      return { subcategorySlug: "rock", reason: "title clearly indicates rock subgenre" };
    }

    return null;
  }

  return null;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const rows: EventRow[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("events")
      .select("id,title,description,category,category_slug,subcategory_slug,external_source,external_event_id,event_date")
      .or("subcategory_slug.is.null,subcategory_slug.eq.")
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);

    rows.push(...((data || []) as EventRow[]));
    if (!data || data.length < pageSize) break;
  }

  const candidates: PlannedUpdate[] = [];

  for (const row of rows) {
    const categorySlug = row.category_slug || row.category;
    if (categorySlug !== "music" && categorySlug !== "comedy") continue;

    const mapped = mapConservativeSubcategory(row);
    if (!mapped) continue;

    candidates.push({
      id: row.id,
      title: row.title || "",
      eventDate: row.event_date || "",
      source: row.external_source || "",
      externalEventId: row.external_event_id || "",
      categorySlug,
      subcategorySlug: mapped.subcategorySlug,
      reason: mapped.reason
    });
  }

  const selected = limit ? candidates.slice(0, limit) : candidates;

  const bySubcategory = new Map<string, number>();
  for (const row of selected) {
    bySubcategory.set(row.subcategorySlug, (bySubcategory.get(row.subcategorySlug) || 0) + 1);
  }

  console.log(`Mode: ${apply ? "APPLY" : "DRY RUN"}`);
  console.log(`Missing rows scanned: ${rows.length}`);
  console.log(`Rows conservatively mappable: ${candidates.length}`);
  console.log(`Rows selected: ${selected.length}`);

  console.log("");
  console.log("Planned updates by subcategory:");
  for (const [subcategory, count] of [...bySubcategory.entries()].sort()) {
    console.log(`- ${subcategory}: ${count}`);
  }

  console.log("");
  console.log("All planned updates:");
  for (const row of selected) {
    console.log(`${row.eventDate} | ${row.source} | ${row.categorySlug} -> ${row.subcategorySlug} | ${row.title} | ${row.externalEventId} | ${row.reason}`);
  }

  if (!apply) {
    console.log("");
    console.log("Dry run only. Re-run with --apply to update only events.subcategory_slug.");
    return;
  }

  let updated = 0;

  for (const row of selected) {
    const { error } = await supabase
      .from("events")
      .update({ subcategory_slug: row.subcategorySlug })
      .eq("id", row.id)
      .or("subcategory_slug.is.null,subcategory_slug.eq.");

    if (error) {
      throw new Error(`Failed updating ${row.id} (${row.title}): ${error.message}`);
    }

    updated += 1;
  }

  console.log("");
  console.log(`Updated rows: ${updated}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
