import { loadEnvConfig } from "@next/env";

async function main() {
  loadEnvConfig(process.cwd());
  const { importEventbriteEvents } = await import("../lib/eventbrite/importer");
  let summary;

  try {
    summary = await importEventbriteEvents({ log: console.log });
  } catch (error) {
    summary = {
      fetchedCount: 0,
      insertedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }

  console.log("[eventbrite] Final summary:");
  console.log(JSON.stringify(summary, null, 2));

  if (summary.errors.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
