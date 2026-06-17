import { loadEnvConfig } from "@next/env";

async function main() {
  loadEnvConfig(process.cwd());
  const [{ importTicketmasterEvents }, { importEventbriteEvents }] = await Promise.all([
    import("../lib/ticketmaster/importer"),
    import("../lib/eventbrite/importer")
  ]);

  const ticketmaster = await importTicketmasterEvents({ log: console.log });
  const eventbrite = await importEventbriteEvents({ log: console.log });
  const summary = {
    ticketmaster,
    eventbrite,
    totalFetched: ticketmaster.fetchedCount + eventbrite.fetchedCount,
    totalInserted: ticketmaster.insertedCount + eventbrite.insertedCount,
    totalUpdated: ticketmaster.updatedCount + eventbrite.updatedCount,
    totalSkipped: ticketmaster.skippedCount + eventbrite.skippedCount,
    errors: [...ticketmaster.errors, ...eventbrite.errors]
  };

  console.log("[import:all] Final summary:");
  console.log(JSON.stringify(summary, null, 2));

  if (summary.errors.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
